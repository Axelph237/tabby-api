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

-- CREATE ROLE db_superuser SUPERUSER;
-- CREATE ROLE db_admin;

--
-- Name: get_cart_details(integer); Type: FUNCTION; Schema: public; Owner: db_owner
--

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

--
-- Name: get_cart_items(integer); Type: FUNCTION; Schema: public; Owner: db_owner
--

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

--
-- Name: get_menus_to_items(uuid); Type: FUNCTION; Schema: public; Owner: db_owner
--

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
    ), menus_to_items_ref AS (
      SELECT menus_to_items.item_id
      FROM menus_to_items
      WHERE menus_to_items.menu_id = p_menu_id
    )
    SELECT user_items.id, user_items.name, user_items.description, user_items.img_url, user_items.base_price, user_items.options
    FROM get_user_items((SELECT user_id FROM menu_ref)) AS user_items
    JOIN menus_to_items_ref ON menus_to_items_ref.item_id = user_items.id;
  END;
$$;


--ALTER FUNCTION public.get_menus_to_items(p_menu_id uuid) OWNER TO db_owner;

--
-- Name: get_user_items(uuid); Type: FUNCTION; Schema: public; Owner: db_owner
--

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


--ALTER FUNCTION public.get_user_items(p_user_id uuid) OWNER TO db_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_item_selections; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.cart_item_selections (
    cart_item_id integer NOT NULL,
    option_selection integer NOT NULL,
    PRIMARY KEY (cart_item_id, option_selection),
    FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id),
    FOREIGN KEY (option_selection) REFERENCES public.item_option_selections(id)
);

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.cart_items (
    id serial NOT NULL,
    cart_id integer NOT NULL,
    item_id integer NOT NULL,
    count integer,
    unit_price integer NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (cart_id) REFERENCES public.carts(id),
    FOREIGN KEY (item_id) REFERENCES public.items(id)
);


--ALTER TABLE public.cart_items OWNER TO db_owner;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.carts (
    id serial NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    menu_id uuid,
    PRIMARY KEY (id),
    UNIQUE (created_by, menu_id),
    FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE
);


--ALTER TABLE public.carts OWNER TO db_owner;

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: db_owner
--

-- ALTER TABLE public.carts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
--     SEQUENCE NAME public.carts_id_seq
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1
-- );


--
-- Name: item_option_selections; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.item_option_selections (
    id serial NOT NULL,
    option_id integer NOT NULL,
    label text NOT NULL,
    price integer,
    is_default boolean DEFAULT false,
    created_by uuid,
    PRIMARY KEY (id),
    UNIQUE (option_id, label),
    FOREIGN KEY (option_id) REFERENCES public.item_options(id)
);


--ALTER TABLE public.item_option_selections OWNER TO db_owner;

--
-- Name: item_option_selections_id_seq; Type: SEQUENCE; Schema: public; Owner: db_owner
--

-- ALTER TABLE public.item_option_selections ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
--     SEQUENCE NAME public.item_option_selections_id_seq
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1
-- );


--
-- Name: item_options; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.item_options (
    id serial NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    item_id integer NOT NULL,
    created_by uuid,
    PRIMARY KEY (id),
    UNIQUE (item_id, label),
    FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT type_valid CHECK ((type = ANY (ARRAY['one'::text, 'many'::text, 'text'::text])))
);


--ALTER TABLE public.item_options OWNER TO db_owner;

--
-- Name: item_options_id_seq; Type: SEQUENCE; Schema: public; Owner: db_owner
--

-- ALTER TABLE public.item_options ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
--     SEQUENCE NAME public.item_options_id_seq
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1
-- );


--
-- Name: items; Type: TABLE; Schema: public; Owner: db_owner
--

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


--ALTER TABLE public.items OWNER TO db_owner;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: db_owner
--

-- CREATE SEQUENCE public.items_id_seq
--     AS integer
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1;


--ALTER SEQUENCE public.items_id_seq OWNER TO db_owner;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_owner
--

-- ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: menus_to_items; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.menus_to_items (
    item_id integer NOT NULL,
    menu_id uuid NOT NULL,
    PRIMARY KEY (item_id, menu_id),
    FOREIGN KEY (item_id) REFERENCES public.items(id),
    FOREIGN KEY (menu_id) REFERENCES public.menus(id)
);


--ALTER TABLE public.menus_to_items OWNER TO db_owner;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: db_owner
--

CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    PRIMARY KEY (id)
);


--ALTER TABLE public.menus OWNER TO db_owner;

--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: cart_item_selections cart_item_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_item_selections
--     ADD CONSTRAINT cart_item_selections_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_items
--     ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.carts
--     ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: item_option_selections item_option_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.item_option_selections
--     ADD CONSTRAINT item_option_selections_pkey PRIMARY KEY (id);


--
-- Name: item_options item_options_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.item_options
--     ADD CONSTRAINT item_options_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.items
--     ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: menus_to_items menus_to_items_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.menus_to_items
--     ADD CONSTRAINT menus_to_items_pkey PRIMARY KEY (item_id, menu_id);


--
-- Name: menus menu_pkey; Type: CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.menus
--     ADD CONSTRAINT menu_pkey PRIMARY KEY (id);


--
-- Name: item_option_selections_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
--

CREATE INDEX item_option_selections_created_by_hash ON public.item_option_selections USING hash (created_by);


--
-- Name: item_options_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
--

CREATE INDEX item_options_created_by_hash ON public.item_options USING hash (created_by);


--
-- Name: items_created_by_hash; Type: INDEX; Schema: public; Owner: db_owner
--

CREATE INDEX items_created_by_hash ON public.items USING hash (created_by);


--
-- Name: cart_items cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_items
--     ADD CONSTRAINT cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- Name: cart_item_selections cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_item_selections
--     ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id);


--
-- Name: carts carts_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.carts
--     ADD CONSTRAINT carts_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: item_options item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.item_options
--     ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menus_to_items item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.menus_to_items
--     ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: cart_items item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_items
--     ADD CONSTRAINT item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: item_option_selections option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.item_option_selections
--     ADD CONSTRAINT option_id_fkey FOREIGN KEY (option_id) REFERENCES public.item_options(id);


--
-- Name: menus_to_items menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.menus_to_items
--     ADD CONSTRAINT menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_item_selections option_selection_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_owner
--

-- ALTER TABLE ONLY public.cart_item_selections
--     ADD CONSTRAINT option_selection_fkey FOREIGN KEY (option_selection) REFERENCES public.item_option_selections(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: db_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO db_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: db_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public GRANT ALL ON TABLES TO db_superuser WITH GRANT OPTION;