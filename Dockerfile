# Use the official PostgreSQL image as the base
FROM postgres:16

# Optional: Set default environment variables (can be overridden at runtime)
ENV POSTGRES_PASSWORD=mysecretpassword
ENV POSTGRES_DB=mydatabase

# Optional: Copy initialization scripts
# Scripts in /docker-entrypoint-initdb.d/ run automatically on first startup
COPY ./init.sql /docker-entrypoint-initdb.d/