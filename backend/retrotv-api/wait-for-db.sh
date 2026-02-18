#!/bin/sh
set -e

# Defaults
DATABASE_HOST=${DATABASE_HOST:-db}
DATABASE_PORT=${DATABASE_PORT:-5432}
DATABASE_USER=${DATABASE_USER:-retrotv}

echo "Waiting for postgres at ${DATABASE_HOST}:${DATABASE_PORT}..."
until pg_isready -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USER}" >/dev/null 2>&1; do
  sleep 1
done
echo "Postgres is ready"
