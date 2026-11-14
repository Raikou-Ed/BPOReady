FROM php:8.2-cli-alpine

# Install PostgreSQL development libraries and required system dependencies
RUN apk add --no-cache postgresql-dev bash libpng-dev libzip-dev zip unzip

# Install PHP extensions for Laravel and PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application code
COPY . .

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Ensure writable directories for SQLite/logs/cache
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8080

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8080}

