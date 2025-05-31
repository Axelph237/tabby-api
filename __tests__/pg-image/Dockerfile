FROM ubuntu:latest
LABEL authors="aiden"

ENTRYPOINT ["top", "-b"]

# Use official Postgres image as base
FROM postgres:15

# Set environment variables for default user, password, and database
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=test_db

# Copy initialization SQL script to be executed on container startup
COPY init.sql /docker-entrypoint-initdb.d/

# Expose default Postgres port
EXPOSE 5432
