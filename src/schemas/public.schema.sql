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

CREATE OR REPLACE ROLE neondb_superuser SUPERUSER;
CREATE OR REPLACE ROLE neondb_admin WITH LOGIN PASSWORD 'neondb_admin';

CREATE OR REPLACE ROLE neondb_owner WITH LOGIN PASSWORD 'neondb_owner_tabby';
GRANT neondb_superuser TO neondb_owner;


--
-- Functions
--

-- DEPRECATED
-- Name: getCartDetails(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.getCartDetails(p_userId uuid, p_menuId uuid)
    RETURNS TABLE(
        id integer,
        createdAt  timestamp with time zone,
        createdBy uuid,
        menuId uuid,
        totalCost integer,
        cartItems jsonb
    )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        WITH cart AS (
            SELECT cs.id, cs.createdAt, cs.createdBy, cs.menuId
            FROM carts AS cs
            WHERE cs.createdBy = p_userId AND cs.menuId = p_menuId
        ), ci AS (
            SELECT ci.id, ci.count, ci.unitPrice
            FROM cartItems as ci
            WHERE ci.cartId = (SELECT cart.id FROM cart)
        )
        SELECT c.id, c.createdAt, c.createdBy, c.menuId,
            (
                SELECT COALESCE(SUM(ci.unitPrice * ci.count), 0) as totalCost
                FROM ci
            )::integer as totalCost,
            (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'itemId', ci.id,
                        'count', ci.count
                    )), '[]'::jsonb)
                FROM ci
            )::jsonb as cartItems
        FROM cart as c;
END;
$$;


-- DEPRECATED
-- Name: getCartItems(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.getCartItems(p_cartId integer)
    RETURNS TABLE(
        cartItemId integer,
        itemId integer,
        count integer,
        name text,
        description text,
        imgUrl text,
        unitPrice integer,
        options jsonb
    )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY

    WITH ci AS (
        SELECT *
        FROM cartItems
        WHERE cartId = p_cartId
    ), sels AS (
        SELECT
            ios.optionId,
            jsonb_agg(jsonb_build_object(
                'label', ios.label,
                'price', ios.price
            )) as selections
        FROM cartItemSelections as cis
        JOIN itemOptionSelections as ios ON ios.id = cis.optionSelection
        WHERE EXISTS (SELECT 1 FROM ci WHERE ci.id = cis.cartItemId)
        GROUP BY ios.optionId
    )
    SELECT
        ci.id as cartItemId,
        ci.itemId as itemId,
        ci.count,
        i.name,
        i.description,
        i.imgUrl,
        ci.unitPrice,
        (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'name', io.label,
                'type', io.type,
                'selections', sels.selections
            )), '[]'::jsonb)
            FROM sels
            JOIN itemOptions as io ON io.id = sels.optionId
        ) as options
    FROM ci
    JOIN items as i ON i.id = ci.itemId;
END;
$$;


-- Name: get_itemsToMenus(uuid); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.getItemsFromMenu(p_menuId uuid)
    RETURNS TABLE(
        id integer,
        name text,
        description text,
        imgUrl text,
        basePrice integer,
        options jsonb)
    LANGUAGE plpgsql
    AS $$
  BEGIN
    RETURN QUERY
    WITH menu_ref AS (
      SELECT menus.createdBy AS userId, menus.id AS menuId
      FROM menus
      WHERE menus.id = p_menuId
      LIMIT 1
    ), itemsToMenus_ref AS (
      SELECT itemsToMenus.itemId
      FROM itemsToMenus
      WHERE itemsToMenus.menuId = p_menuId
    )
    SELECT userItems.id, userItems.name, userItems.description, userItems.imgUrl, userItems.basePrice, userItems.options
    FROM getUserItems((SELECT userId FROM menu_ref)) AS userItems
    JOIN itemsToMenus_ref ON itemsToMenus_ref.itemId = userItems.id;
  END;
$$;
ALTER FUNCTION public.get_itemsToMenus(p_menuId uuid) OWNER TO neondb_owner;


-- Name: getUserItems(uuid); Type: FUNCTION; Schema: public; Owner: neondb_owner
CREATE OR REPLACE FUNCTION public.getUserItems(p_userId uuid)
    RETURNS TABLE(
        id integer,
        createdBy uuid,
        name text,
        description text,
        imgUrl text,
        basePrice integer,
        options jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  -- FILTER TABLES FOR USER'S ITEMS
-- Reduce join complexity
WITH userItems AS (
  SELECT items.id, items.name, items.description, items.imgUrl, items.basePrice, items.createdBy
  FROM items
  WHERE items.createdBy = p_userId
), userOpts AS (
  SELECT itemOptions.itemId, itemOptions.id, itemOptions.label, itemOptions.type
  FROM itemOptions
  WHERE itemOptions.createdBy = p_userId
),
-- CREATE OBJECTS FROM TABLES
selectObjs AS (
  SELECT itemOptionSelections.optionId, COALESCE(jsonb_agg(
    jsonb_build_object(
        'label', label,
        'price', COALESCE(price, 0),
        'isDefault', COALESCE(isDefault, FALSE)
      )
    ), '[]'::jsonb) AS selections
  FROM itemOptionSelections
  WHERE itemOptionSelections.createdBy = p_userId
  GROUP BY itemOptionSelections.optionId
), optionObjs AS (
  SELECT userOpts.itemId, COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', userOpts.label,
      'type', userOpts.type,
      'selections', selectObjs.selections
    )
  ), '[]'::jsonb) AS options
  FROM userOpts
  JOIN selectObjs ON selectObjs.optionId = userOpts.id
  GROUP BY userOpts.itemId
)
-- PRESENT DATA
SELECT
  userItems.id,
  userItems.createdBy,
  userItems.name,
  userItems.description,
  userItems.imgUrl,
  userItems.basePrice,
  COALESCE(optionObjs.options, '[]'::jsonb)
FROM userItems
LEFT JOIN optionObjs ON optionObjs.itemId = userItems.id;
END;
$$;
ALTER FUNCTION public.getUserItems(p_userId uuid) OWNER TO neondb_owner;


--
-- Triggers
--

-- Name: setOrderNum()
CREATE OR REPLACE FUNCTION public.setOrderNum()
RETURNS TRIGGER AS $$
BEGIN
  NEW.orderNum := (
    SELECT COALESCE(MAX(orderNum), 0) + 1
    FROM public.orders AS o
    WHERE o.sessionId = NEW.sessionId
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Name: updateOrderCost()
CREATE OR REPLACE FUNCTION public.updateOrderCost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders AS o
  SET totalCost = totalCost + (NEW.unitPrice * NEW.count)
  WHERE o.id = NEW.orderId;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Name: setUnitPrice()
CREATE OR REPLACE FUNCTION public.setUnitPrice()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unitPrice := (
    SELECT SUM(COALESCE(price, 0))
    FROM itemOptionSelections AS ios
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


-- Name: cartItemSelections; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.cartItemSelections (
    cartItemId integer NOT NULL,
    optionSelection integer NOT NULL,
    PRIMARY KEY (cartItemId, optionSelection)
);


-- Name: cartItems; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.cartItems (
    id serial NOT NULL,
    cartId integer NOT NULL,
    itemId integer NOT NULL,
    count integer,
    unitPrice integer NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.cartItems OWNER TO neondb_owner;


-- Name: carts; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.carts (
    id serial NOT NULL,
    createdAt timestamp with time zone DEFAULT now() NOT NULL,
    createdBy uuid,
    menuId uuid,
    PRIMARY KEY (id),
    UNIQUE (createdBy, menuId)
);
ALTER TABLE public.carts OWNER TO neondb_owner;


-- Name: itemOptionSelections; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.itemOptionSelections (
    id serial NOT NULL,
    optionId integer NOT NULL,
    label text NOT NULL,
    price integer,
    isDefault boolean DEFAULT false,
    createdBy uuid,
    PRIMARY KEY (id),
    UNIQUE (optionId, label)
);
ALTER TABLE public.itemOptionSelections OWNER TO neondb_owner;


-- Name: itemOptions; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.itemOptions (
    id serial NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    itemId integer NOT NULL,
    createdBy uuid,
    PRIMARY KEY (id),
    UNIQUE (itemId, label),
    CONSTRAINT typeValid CHECK ((type = ANY (ARRAY['one'::text, 'many'::text, 'text'::text])))
);
ALTER TABLE public.itemOptions OWNER TO neondb_owner;


-- Name: items; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.items (
    id serial NOT NULL,
    createdAt date DEFAULT now(),
    name text NOT NULL,
    description text,
    imgUrl text,
    basePrice integer,
    createdBy uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.items OWNER TO neondb_owner;


-- Name: itemsToMenus; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.itemsToMenus (
    itemId integer NOT NULL,
    menuId uuid NOT NULL,
    PRIMARY KEY (itemId, menuId)
);
ALTER TABLE public.itemsToMenus OWNER TO neondb_owner;


-- Name: menus; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    createdAt timestamp with time zone DEFAULT now() NOT NULL,
    createdBy uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.menus OWNER TO neondb_owner;


-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
CREATE TABLE public.sessions (
    id serial NOT NULL,
    menuId uuid NOT NULL,
    expires timestamp with time zone,
    PRIMARY KEY (id)
);
ALTER TABLE public.sessions OWNER TO neondb_owner;


-- Name: orders
CREATE TABLE public.orders (
    id serial NOT NULL,
    sessionId integer NOT NULL,
    guestName text NOT NULL,
    orderNum integer NOT NULL,
    totalCost integer DEFAULT 0 NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE public.orders OWNER TO neondb_owner;

CREATE TRIGGER beforeInsertSetOrderNum
    BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.setOrderNum();


-- Name: orderLineItems
CREATE TABLE public.orderLineItems (
    id serial NOT NULL,
    itemId integer NOT NULL,
    orderId integer NOT NULL,
    count integer NOT NULL,
    unitPrice integer NOT NULL,
    selections integer[],
    PRIMARY KEY (id)
);
ALTER TABLE public.orderLineItems OWNER TO neondb_owner;

CREATE TRIGGER beforeInsertSetUnitPrice
    BEFORE INSERT ON public.orderLineItems FOR EACH ROW EXECUTE FUNCTION public.setUnitPrice();

CREATE TRIGGER afterInsertUpdateOrderPrice
    AFTER INSERT ON public.orderLineItems FOR EACH ROW EXECUTE FUNCTION public.updateOrderCost();

--
-- Constraints
--

-- Table: public.cartItemSelections
ALTER TABLE ONLY public.cartItemSelections
    ADD CONSTRAINT cartItemId_fkey FOREIGN KEY (cartItemId) REFERENCES public.cartItems(id);

ALTER TABLE ONLY public.cartItemSelections
    ADD CONSTRAINT optionSelectionId_fkey FOREIGN KEY (optionSelection) REFERENCES public.itemOptionSelections(id);

-- Table: public.cartItems
ALTER TABLE ONLY public.cartItems
    ADD CONSTRAINT cartId_fkey FOREIGN KEY (cartId) REFERENCES public.carts(id);

ALTER TABLE ONLY public.cartItems
    ADD CONSTRAINT itemId_fkey FOREIGN KEY (cartId) REFERENCES public.items(id);

-- Table: public.carts
ALTER TABLE ONLY public.carts
    ADD CONSTRAINT menuId_fkey FOREIGN KEY (menuId) REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Table: public.itemOptionSelections
ALTER TABLE ONLY public.itemOptionSelections
    ADD CONSTRAINT optionId_fkey FOREIGN KEY (optionId) REFERENCES public.itemOptions(id);

-- Table: public.itemOptions
ALTER TABLE ONLY public.itemOptions
    ADD CONSTRAINT itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Table: public.itemsToMenus
ALTER TABLE ONLY public.itemsToMenus
    ADD CONSTRAINT itemId_fkey FOREIGN KEY (itemId) REFERENCES public.items(id);
ALTER TABLE ONLY public.itemsToMenus
    ADD CONSTRAINT menuId_fkey FOREIGN KEY (menuId) REFERENCES public.menus(id);

-- Table: public.sessions
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT menuId_fkey FOREIGN KEY (menuId) REFERENCES public.menus(id);

--
-- Indexes
--

-- Name: itemOptionSelections_createdBy_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX itemOptionSelections_createdBy_hash ON public.itemOptionSelections USING hash (createdBy);

-- Name: itemOptions_createdBy_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX itemOptions_createdBy_hash ON public.itemOptions USING hash (createdBy);

-- Name: items_createdBy_hash; Type: INDEX; Schema: public; Owner: neondb_owner
CREATE INDEX items_createdBy_hash ON public.items USING hash (createdBy);


--
-- Privileges
--

-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: neondb_admin
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neondb_superuser WITH GRANT OPTION;

-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: neondb_admin
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_admin IN SCHEMA public GRANT ALL ON TABLES TO neondb_superuser WITH GRANT OPTION;