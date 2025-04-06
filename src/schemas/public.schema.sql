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

CREATE ROLE neondb_superuser SUPERUSER;
CREATE ROLE neondb_admin WITH LOGIN PASSWORD 'neondb_admin';

CREATE ROLE neondb_owner WITH LOGIN PASSWORD 'neondb_owner_tabby';
GRANT neondb_superuser TO neondb_owner;


--
-- Functions
--

-- DEPRECATED
-- Name: get_cart_details(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


-- DEPRECATED
-- Name: get_cart_items(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.get_cart_items(p_cartId integer)
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
        WHERE cart_id = p_cartId
    ), sels AS (
        SELECT
            ios.parent_option,
            jsonb_agg(jsonb_build_object(
                'label', ios.label,
                'price', ios.price
            )) as selections
        FROM cart_item_selections as cis
        JOIN item_selections as ios ON ios.id = cis.option_selection
        WHERE EXISTS (SELECT 1 FROM ci WHERE ci.id = cis.cart_item_id)
        GROUP BY ios.parent_option
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
            JOIN item_options as io ON io.id = sels.parent_option
        ) as options
    FROM ci
    JOIN items as i ON i.id = ci.item_id;
END;
$$;


-- Name: get_items_from_menu(uuid); Type: FUNCTION; Schema: public; Owner: neondb_owner
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
ALTER FUNCTION public.get_items_from_menu(p_menu_id uuid) OWNER TO neondb_owner;


-- Name: get_user_items(uuid); Type: FUNCTION; Schema: public; Owner: neondb_owner
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
  SELECT item_selections.parent_option, COALESCE(jsonb_agg(
    jsonb_build_object(
        'label', label,
        'price', COALESCE(price, 0),
        'is_default', COALESCE(is_default, FALSE)
      )
    ), '[]'::jsonb) AS selections
  FROM item_selections
  WHERE item_selections.created_by = p_user_id
  GROUP BY item_selections.parent_option
), option_objs AS (
  SELECT user_opts.item_id, COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', user_opts.label,
      'type', user_opts.type,
      'selections', select_objs.selections
    )
  ), '[]'::jsonb) AS options
  FROM user_opts
  JOIN select_objs ON select_objs.parent_option = user_opts.id
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
ALTER FUNCTION public.get_user_items(p_user_id uuid) OWNER TO neondb_owner;


-- Name: get_session_details(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.get_session_details(p_session_id uuid)
    RETURNS TABLE(
        menu_name text,
        expires_at timestamp with time zone,
        items jsonb
    )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        WITH session_menu AS (
            SELECT
                m.id AS menu_id,
                s.id AS session_id,
                m.name AS menu_name,
                s.expires_at
            FROM public.sessions AS s
            JOIN public.menus AS m ON s.menu_id = m.id
            WHERE s.id = p_session_id
        ), items_on_menu AS (
            SELECT *
            FROM items_to_menus AS itm
            WHERE itm.menu_id = (SELECT menu_id FROM session_menu)
        )
        SELECT
            sm.menu_name,
            sm.expires_at,
            (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'id', i.id,
                        'name', i.name,
                        'description', i.description,
                        'img_url', i.img_url,
                        'base_price', i.base_price
                )), '[]'::jsonb)
                FROM items AS i
                JOIN items_on_menu AS iom ON iom.item_id = i.id
            ) as options
        FROM session_menu AS sm;
END;
$$;


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

-- Name: update_order_data()
CREATE OR REPLACE FUNCTION public.update_order_data()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders AS o
  SET total_cost = total_cost + (NEW.unit_price * NEW.count),
      total_items = total_items + (NEW.count)
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
    FROM item_selections AS ios
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


-- Name: cart_item_selections; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.cart_item_selections (
    cart_item_id integer NOT NULL,
    option_selection integer NOT NULL,
    PRIMARY KEY (cart_item_id, option_selection)
);


-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.cart_items (
    id serial NOT NULL,
    cart_id integer NOT NULL,
    item_id integer NOT NULL,
    count integer,
    unit_price integer NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.cart_items OWNER TO neondb_owner;


-- Name: carts; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.carts (
    id serial NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    menu_id uuid,
    PRIMARY KEY (id),
    UNIQUE (created_by, menu_id)
);
ALTER TABLE public.carts OWNER TO neondb_owner;


-- Name: item_selections; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.item_selections (
    id serial NOT NULL,
    item_id integer NOT NULL,
    parent_option integer,
    label text NOT NULL,
    price integer,
    is_default boolean DEFAULT false,
    created_by uuid,
    PRIMARY KEY (id),
    UNIQUE (parent_option, item_id, label)
);
ALTER TABLE public.item_selections OWNER TO neondb_owner;


-- Name: item_options; Type: TABLE; Schema: public; Owner: neondb_owner
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
ALTER TABLE public.item_options OWNER TO neondb_owner;


-- Name: items; Type: TABLE; Schema: public; Owner: neondb_owner
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
ALTER TABLE public.items OWNER TO neondb_owner;


-- Name: items_to_menus; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.items_to_menus (
    item_id integer NOT NULL,
    menu_id uuid NOT NULL,
    PRIMARY KEY (item_id, menu_id)
);
ALTER TABLE public.items_to_menus OWNER TO neondb_owner;


-- Name: menus; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.menus OWNER TO neondb_owner;


-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    menu_id uuid NOT NULL,
    expires_at timestamp with time zone,
    PRIMARY KEY (id)
);
ALTER TABLE public.sessions OWNER TO neondb_owner;


-- Name: session_admins
CREATE TABLE public.session_admins (
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    PRIMARY KEY (session_id, user_id)
);
ALTER TABLE public.session_admins OWNER TO neondb_owner;


-- Name: orders
CREATE TABLE public.orders (
    id serial NOT NULL,
    placed_at timestamp NOT NULL,
    session_id uuid NOT NULL,
    guest_name text NOT NULL,
    order_num integer,
    total_cost integer DEFAULT 0 NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    status text NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.orders OWNER TO neondb_owner;

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
ALTER TABLE public.order_line_items OWNER TO neondb_owner;

CREATE TRIGGER before_insert_set_unit_price
    BEFORE INSERT ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION public.set_unit_price();

CREATE TRIGGER after_insert_update_order_price
    AFTER INSERT ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION public.update_order_data();

--
-- Constraints
--

-- Table: public.cart_item_selections
ALTER TABLE ONLY public.cart_item_selections
    ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id);

ALTER TABLE ONLY public.cart_item_selections
    ADD CONSTRAINT option_selection_id_fkey FOREIGN KEY (option_selection) REFERENCES public.item_selections(id);

-- Table: public.cart_items
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT item_id_fkey FOREIGN KEY (cart_id) REFERENCES public.items(id);

-- Table: public.carts
ALTER TABLE ONLY public.carts
    ADD CONSTRAINT menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Table: public.item_selections
ALTER TABLE ONLY public.item_selections
    ADD CONSTRAINT parent_option_fkey FOREIGN KEY (parent_option) REFERENCES public.item_options(id);
ALTER TABLE ONLY public.item_selections
    ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);

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

-- Table: public.session_admins
ALTER TABLE ONLY public.session_admins
    ADD CONSTRAINT menu_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);

--
-- Indexes
--

-- Name: item_selections_created_by_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX item_selections_created_by_hash ON public.item_selections USING hash (created_by);

-- Name: item_options_created_by_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX item_options_created_by_hash ON public.item_options USING hash (created_by);

-- Name: items_created_by_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX items_created_by_hash ON public.items USING hash (created_by);


--
-- Privileges
--

-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: neondb_admin
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neondb_superuser WITH GRANT OPTION;

-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: neondb_admin
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_admin IN SCHEMA public GRANT ALL ON TABLES TO neondb_superuser WITH GRANT OPTION;