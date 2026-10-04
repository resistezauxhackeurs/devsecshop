# app_intro-compromission/cible/Dockerfile
# LAB VOLONTAIREMENT VULNÉRABLE - ne pas durcir.
# Image épinglée (reproductibilité). PHP exécute les .php partout sous le docroot,
# y compris /uploads : c'est ce qui rend le webshell exploitable (RCE).
FROM php:8.2.20-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends libsqlite3-dev \
 && rm -rf /var/lib/apt/lists/* \
 && docker-php-ext-install pdo_sqlite

COPY src/ /var/www/html/

# /uploads (webshell déposé) et /var/data (base SQLite) doivent être inscriptibles.
RUN mkdir -p /var/www/html/uploads /var/data \
 && chown -R www-data:www-data /var/www/html/uploads /var/data

EXPOSE 80
