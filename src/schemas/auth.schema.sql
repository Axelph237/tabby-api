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

CREATE TABLE auth.session (
    id text NOT NULL,
    userId text NOT NULL,
    token text NOT NULL,
    expiresAt timestamp NOT NULl,
    ipAddress text,
    userAgent text,
    createdAt timestamp,
    updatedAt timestamp,
    PRIMARY KEY (id)
);
ALTER TABLE auth.session OWNER TO db_owner;

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
    password text,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE auth.account OWNER TO db_owner;

CREATE TABLE auth.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expiresAt timestamp NOT NULL,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE auth.verification OWNER TO db_owner;


--
-- Foreign Keys
--
ALTER TABLE ONLY auth.session
    ADD CONSTRAINT userId_fkey FOREIGN KEY (userId) REFERENCES auth.user(id);

ALTER TABLE ONLY auth.account
    ADD CONSTRAINT userId_fkey FOREIGN KEY (userId) REFERENCES auth.user(id);