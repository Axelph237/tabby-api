--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;


--
-- Roles
--

CREATE OR REPLACE ROLE db_superuser SUPERUSER;
CREATE OR REPLACE ROLE db_admin WITH LOGIN PASSWORD 'db_admin';

CREATE OR REPLACE ROLE db_owner WITH LOGIN PASSWORD 'db_owner_tabby';
GRANT db_superuser TO db_owner;


--
-- Functions
--

-- Name: get_cart_details(integer); Type: FUNCTION; Schema: public; Owner: db_owner
CREATE OR REPLACE FUNCTION public.get_cart_details(p_user_id uuid, p_menu_id uuid)
    RETURNS TABLE(
        id integer,
        created_at  timestamp with time zone,
        created_by uuid,
        menu_id uuid,
        total_cost integer,
        cart_items jsonb
    )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        WITH cart AS (
            SELECT cs.id, cs.created_at, cs.created_by, cs.menu_id
            FROM carts AS cs
            WHERE cs.created_by = p_user_id AND cs.menu_id = p_menu_id
        ), ci AS (
            SELECT ci.id, ci.count, ci.unit_price
            FROM cart_items as ci
            WHERE ci.cart_id = (SELECT cart.id FROM cart)
        )
        SELECT c.id, c.created_at, c.created_by, c.menu_id,
            (
                SELECT COALESCE(SUM(ci.unit_price * ci.count), 0) as total_cost
                FROM ci
            )::integer as total_cost,
            (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'item_id', ci.id,
                        'count', ci.count
                    )), '[]'::jsonb)
                FROM ci
            )::jsonb as cart_items
        FROM cart as c;
END;
$$;


-- Name: get_cart_items(integer); Type: FUNCTION; Schema: public; Owner: db_owner
CREATE OR REPLACE FUNCTION public.get_cart_items(p_cart_id integer)
    RETURNS TABLE(
        cart_item_id integer,
        item_id integer,
        count integer,
        name text,
        description text,
        img_url text,
        unit_price integer,
        options jsonb
    )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY

    WITH ci AS (
        SELECT *
        FROM cart_items
        WHERE cart_id = p_cart_id
    ), sels AS (
        SELECT
            ios.option_id,
            jsonb_agg(jsonb_build_object(
                'label', ios.label,
                'price', ios.price
            )) as selections
        FROM cart_item_selections as cis
        JOIN item_option_selections as ios ON ios.id = cis.option_selection
        WHERE EXISTS (SELECT 1 FROM ci WHERE ci.id = cis.cart_item_id)
        GROUP BY ios.option_id
    )
    SELECT
        ci.id as cart_item_id,
        ci.item_id as item_id,
        ci.count,
        i.name,
        i.description,
        i.img_url,
        ci.unit_price,
        (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'name', io.label,
                'type', io.type,
                'selections', sels.selections
            )), '[]'::jsonb)
            FROM sels
            JOIN item_options as io ON io.id = sels.option_id
        ) as options
    FROM ci
    JOIN items as i ON i.id = ci.item_id;
END;
$$;


-- Name: get_items_to_menus(uuid); Type: FUNCTION; Schema: public; Owner: db_owner
CREATE OR REPLACE FUNCTION public.get_items_from_menu(p_menu_id uuid)
    RETURNS TABLE(
        id integer,
        name text,
        description text,
        img_url text,
        base_price integer,
        options jsonb)
    LANGUAGE plpgsql
    AS $$
  BEGIN
    RETURN QUERY
    WITH menu_ref AS (
      SELECT menus.created_by AS user_id, menus.id AS menu_id
      FROM menus
      WHERE menus.id = p_menu_id
      LIMIT 1
    ), items_to_menus_ref AS (
      SELECT items_to_menus.item_id
      FROM items_to_menus
      WHERE items_to_menus.menu_id = p_menu_id
    )
    SELECT user_items.id, user_items.name, user_items.description, user_items.img_url, user_items.base_price, user_items.options
    FROM get_user_items((SELECT user_id FROM menu_ref)) AS user_items
    JOIN items_to_menus_ref ON items_to_menus_ref.item_id = user_items.id;
  END;
$$;
ALTER FUNCTION public.get_items_to_menus(p_menu_id uuid) OWNER TO db_owner;


-- Name: get_user_items(uuid); Type: FUNCTION; Schema: public; Owner: db_owner
CREATE OR REPLACE FUNCTION public.get_user_items(p_user_id uuid)
    RETURNS TABLE(
        id integer,
        created_by uuid,
        name text,
        description text,
        img_url text,
        base_price integer,
        options jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  -- FILTER TABLES FOR USER'S ITEMS
-- Reduce join complexity
WITH user_items AS (
  SELECT items.id, items.name, items.description, items.img_url, items.base_price, items.created_by
  FROM items
  WHERE items.created_by = p_user_id
), user_opts AS (
  SELECT item_options.item_id, item_options.id, item_options.label, item_options.type
  FROM item_options
  WHERE item_options.created_by = p_user_id
),
-- CREATE OBJECTS FROM TABLES
select_objs AS (
  SELECT item_option_selections.option_id, COALESCE(jsonb_agg(
    jsonb_build_object(
        'label', label,
        'price', COALESCE(price, 0),
        'is_default', COALESCE(is_default, FALSE)
      )
    ), '[]'::jsonb) AS selections
  FROM item_option_selections
  WHERE item_option_selections.created_by = p_user_id
  GROUP BY item_option_selections.option_id
), option_objs AS (
  SELECT user_opts.item_id, COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', user_opts.label,
      'type', user_opts.type,
      'selections', select_objs.selections
    )
  ), '[]'::jsonb) AS options
  FROM user_opts
  JOIN select_objs ON select_objs.option_id = user_opts.id
  GROUP BY user_opts.item_id
)
-- PRESENT DATA
SELECT
  user_items.id,
  user_items.created_by,
  user_items.name,
  user_items.description,
  user_items.img_url,
  user_items.base_price,
  COALESCE(option_objs.options, '[]'::jsonb)
FROM user_items
LEFT JOIN option_objs ON option_objs.item_id = user_items.id;
END;
$$;
ALTER FUNCTION public.get_user_items(p_user_id uuid) OWNER TO db_owner;


--
-- Triggers
--

-- Name: set_order_num()
CREATE OR REPLACE FUNCTION public.set_order_num()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_num := (
    SELECT COALESCE(MAX(order_num), 0) + 1
    FROM public.orders AS o
    WHERE o.session_id = NEW.session_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Name: update_order_cost()
CREATE OR REPLACE FUNCTION public.update_order_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders AS o
  SET total_cost = total_cost + (NEW.unit_price * NEW.count)
  WHERE o.id = NEW.order_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Name: set_unit_price()
CREATE OR REPLACE FUNCTION public.set_unit_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unit_price := (
    SELECT SUM(COALESCE(price, 0))
    FROM item_option_selections AS ios
    WHERE ios.id = ANY (NEW.selections)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--
-- Tables
--
SET default_tablespace = '';
SET default_table_access_method = heap;


-- Name: cart_item_selections; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.cart_item_selections (
    cart_item_id integer NOT NULL,
    option_selection integer NOT NULL,
    PRIMARY KEY (cart_item_id, option_selection)
);


-- Name: cart_items; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.cart_items (
    id serial NOT NULL,
    cart_id integer NOT NULL,
    item_id integer NOT NULL,
    count integer,
    unit_price integer NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.cart_items OWNER TO db_owner;


-- Name: carts; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.carts (
    id serial NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    menu_id uuid,
    PRIMARY KEY (id),
    UNIQUE (created_by, menu_id)
);
ALTER TABLE public.carts OWNER TO db_owner;


-- Name: item_option_selections; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.item_option_selections (
    id serial NOT NULL,
    option_id integer NOT NULL,
    label text NOT NULL,
    price integer,
    is_default boolean DEFAULT false,
    created_by uuid,
    PRIMARY KEY (id),
    UNIQUE (option_id, label)
);
ALTER TABLE public.item_option_selections OWNER TO db_owner;


-- Name: item_options; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.item_options (
    id serial NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    item_id integer NOT NULL,
    created_by uuid,
    PRIMARY KEY (id),
    UNIQUE (item_id, label),
    CONSTRAINT type_valid CHECK ((type = ANY (ARRAY['one'::text, 'many'::text, 'text'::text])))
);
ALTER TABLE public.item_options OWNER TO db_owner;


-- Name: items; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.items (
    id serial NOT NULL,
    created_at date DEFAULT now(),
    name text NOT NULL,
    description text,
    img_url text,
    base_price integer,
    created_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.items OWNER TO db_owner;


-- Name: items_to_menus; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.items_to_menus (
    item_id integer NOT NULL,
    menu_id uuid NOT NULL,
    PRIMARY KEY (item_id, menu_id)
);
ALTER TABLE public.items_to_menus OWNER TO db_owner;


-- Name: menus; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.menus OWNER TO db_owner;


-- Name: sessions; Type: TABLE; Schema: public; Owner: db_owner
CREATE TABLE public.sessions (
    id serial NOT NULL,
    menu_id uuid NOT NULL,
    expires timestamp with time zone,
    PRIMARY KEY (id)
);
ALTER TABLE public.sessions OWNER TO db_owner;


-- Name: orders
CREATE TABLE public.orders (
    id serial NOT NULL,
    session_id integer NOT NULL,
    guest_name text NOT NULL,
    order_num integer NOT NULL,
    total_cost integer DEFAULT 0 NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (session_id, guest_name, order_num)
);
ALTER TABLE public.orders OWNER TO db_owner;

CREATE TRIGGER before_insert_set_order_num
    BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_num();


-- Name: order_line_items
CREATE TABLE public.order_line_items (
    id serial NOT NULL,
    item_id integer NOT NULL,
    order_id integer NOT NULL,
    count integer NOT NULL,
    unit_price integer NOT NULL,
    selections integer[],
    PRIMARY KEY (id)
);
ALTER TABLE public.order_line_items OWNER TO db_owner;

CREATE TRIGGER before_insert_set_unit_price
    BEFORE INSERT ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION public.set_unit_price();

CREATE TRIGGER after_insert_update_order_price
    AFTER INSERT ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION public.update_order_cost();

--
-- Constraints
--

-- Table: public.cart_item_selections
ALTER TABLE ONLY public.cart_item_selections
    ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id);

ALTER TABLE ONLY public.cart_item_selections
    ADD CONSTRAINT option_selection_id_fkey FOREIGN KEY (option_selection) REFERENCES public.item_option_selections(id);

-- Table: public.cart_items
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT item_id_fkey FOREIGN KEY (cart_id) REFERENCES public.items(id);

-- Table: public.carts
ALTER TABLE ONLY public.carts
    ADD CONSTRAINT menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Table: public.item_option_selections
ALTER TABLE ONLY public.item_option_selections
    ADD CONSTRAINT option_id_fkey FOREIGN KEY (option_id) REFERENCES public.item_options(id);

-- Table: public.item_options
ALTER TABLE ONLY public.item_options
    ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Table: public.items_to_menus
ALTER TABLE ONLY public.items_to_menus
    ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);
ALTER TABLE ONLY public.items_to_menus
    ADD CONSTRAINT menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id);

-- Table: public.sessions
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id);

--
-- Indexes
--

-- Name: item_option_selections_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
CREATE INDEX item_option_selections_created_by_hash ON public.item_option_selections USING hash (created_by);

-- Name: item_options_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
CREATE INDEX item_options_created_by_hash ON public.item_options USING hash (created_by);

-- Name: items_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
CREATE INDEX items_created_by_hash ON public.items USING hash (created_by);


--
-- Privileges
--

-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: db_admin
ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO db_superuser WITH GRANT OPTION;

-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: db_admin
ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public GRANT ALL ON TABLES TO db_superuser WITH GRANT OPTION;