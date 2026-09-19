#!/bin/bash
set -e

echo "Waiting for database..."
if [ "$POSTGRES_HOST" ]; then
    while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
      sleep 0.1
    done
    echo "PostgreSQL database started!"
fi

echo "Applying database migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

exec "$@"
