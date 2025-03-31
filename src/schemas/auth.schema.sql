DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE auth.user (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    emailVerified boolean NOT NULL,
    image text,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE auth.user OWNER TO db_owner;

CREATE TABLE auth.account (
    id text NOT NULL,
    userId text NOT NULL,
    accountId text NOT NULL,
    providerId text NOT NULL,
    accessToken text,
    refreshToken text,
    accessTokenExpiresAt timestamp,
    refreshTokenExpiresAt timestamp,
    scope text,
    idToken text,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE auth.account OWNER TO db_owner;


--
-- Foreign Keys
--

ALTER TABLE ONLY auth.account
    ADD CONSTRAINT userId_fkey FOREIGN KEY (userId) REFERENCES auth.user(id);