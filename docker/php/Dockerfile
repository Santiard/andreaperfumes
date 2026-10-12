FROM php:8.3-fpm-alpine

# Instalar librerías del sistema necesarias para GD (WebP, JPEG, PNG, FreeType) y extensiones PHP
RUN apk add --no-cache \
    libwebp-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    tzdata \
    bash \
    curl

# Configurar e instalar extensiones PHP requeridas (GD con WebP, PDO MySQL, OPcache, Exif, Mbstring, Intl)
RUN docker-php-ext-configure gd \
        --with-webp \
        --with-jpeg \
        --with-freetype \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo \
        pdo_mysql \
        mbstring \
        exif \
        opcache \
        intl

# Instalar Composer oficial para gestión de autoload y librerías
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copiar configuración optimizada de PHP
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html/backend

EXPOSE 9000
CMD ["php-fpm"]
