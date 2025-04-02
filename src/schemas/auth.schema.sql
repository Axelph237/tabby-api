DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE auth.user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean NOT NULL,
    image text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE auth.user OWNER TO neondb_owner;

CREATE TABLE auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    id_token text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (user_id, provider_id)
);
ALTER TABLE auth.account OWNER TO neondb_owner;


--
-- Foreign Keys
--

ALTER TABLE ONLY auth.account
    ADD CONSTRAINT user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.user(id);