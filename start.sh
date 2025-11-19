#!/bin/bash
set -e

echo "Building frontend..."
cd /app && yarn build

echo "Starting services with supervisor..."
exec supervisord -c /app/supervisord.conf
