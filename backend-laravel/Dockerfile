# ==============================================================================
# StockMaster Backend Laravel - Dockerfile Multi-Stage
# ==============================================================================
FROM php:8.3-cli-alpine

WORKDIR /var/www/html

# Instalar dependencias del sistema y extensiones de PHP para MySQL y curl
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    linux-headers \
    mysql-client \
    bash \
    && docker-php-ext-install pdo pdo_mysql bcmath

# Instalar Composer oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copiar archivos del proyecto
COPY . .

# Permisos para storage y cache
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

# Script de arranque: espera a MySQL, migra y sirve la API
CMD ["sh", "-c", "composer install --no-interaction --prefer-dist && php artisan key:generate --force && php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000"]
