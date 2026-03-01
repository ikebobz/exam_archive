#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until pg_isready -h db -U exampro -d exampro -q; do
  echo "Database is not ready yet, waiting..."
  sleep 2
done
echo "Database is ready!"

echo "Running database migrations..."
npm run db:push

echo "Starting application..."
exec node dist/index.cjs
