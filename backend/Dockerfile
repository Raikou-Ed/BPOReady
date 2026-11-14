FROM php:8.4-cli-alpine

# Install PostgreSQL development libraries and required system dependencies
RUN apk add --no-cache postgresql-dev bash libpng-dev libzip-dev zip unzip icu-dev

# Install PHP extensions for Laravel and PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application code
COPY . .

# Install production dependencies matching PHP 8.4
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

# Ensure writable directories for logs and cache
RUN chmod -R 777 storage bootstrap/cache

ENV APP_KEY=base64:LKX4BL3qMgo1NG3VrUaY5zyrBQTxmQX9OXiRaWN3PDw=
ENV APP_DEBUG=true

EXPOSE 8080

CMD sh -c "php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"
