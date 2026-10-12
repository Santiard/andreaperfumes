# Andrea Perfumes — Catálogo E-Commerce (Backend PHP 8.3 + MariaDB 11 + Docker)

Plataforma de catálogo e-commerce de perfumería con cierre de pedidos por **WhatsApp** (compra directa por perfume y carrito de compras en **Pesos Colombianos - COP**), almacenamiento optimizado de imágenes en binario **WebP** (`MEDIUMBLOB`) e inyección dinámica de metadatos **SEO / Open Graph**.

---

## 1. Inicio Rápido con Docker

```bash
# Levantar MariaDB 11, PHP 8.3-FPM (GD/WebP) y Nginx
docker compose up -d --build
```

Una vez levantados los contenedores:
* **Servidor Web / SEO / API:** `http://localhost:8080`
* **Healthcheck API:** `http://localhost:8080/api/health`
* **Credenciales Admin Iniciales:**
  * **Email:** `admin@andreaperfumes.com`
  * **Password:** `password`

---

## 2. Estructura del Proyecto

```text
andreaperfumes/
├── docker-compose.yml               # Orquestación aislada para VPS
├── .env.example                     # Variables de entorno base
├── docker/
│   ├── mariadb/
│   │   ├── my.cnf                   # Optimización de RAM e InnoDB para VPS
│   │   └── init/
│   │       ├── 01_schema.sql        # Las 10 tablas del MER + índices + FKs
│   │       └── 02_seed.sql          # Datos semilla en COP (perfumes, notas, promos)
│   ├── nginx/
│   │   └── default.conf             # Reverse proxy interno y caché de activos
│   └── php/
│       ├── Dockerfile               # PHP 8.3-FPM Alpine con GD (WebP), PDO MySQL, OPcache
│       └── php.ini                  # Configuración de memoria y subida de imágenes
├── backend/
│   ├── composer.json                # Configuración PSR-4
│   ├── public/
│   │   └── index.php                # Punto de entrada REST + Inyector SEO
│   └── src/
│       ├── Core/                    # Database, Router, Request, Response, JwtAuth
│       ├── Entities/                # PerfumeEnums y ProductoEntity (sin exponer BLOB)
│       ├── Repositories/            # ProductoRepository y CatalogoRepository
│       ├── Services/                # ImageService (WebP), PricingService (COP), WhatsAppService, SeoService
│       └── Controllers/             # Controladores Públicos y Administrativos
└── frontend/                        # Reservado para la SPA en React (en espera de mockups)
```

---

## 3. Resumen de Endpoints REST

### Públicos (Catálogo y Checkout WhatsApp)
* `GET /api/health` — Verifica conexión a MariaDB y soporte `imagewebp`.
* `GET /api/catalogo/filtros` — Lista marcas, familias olfativas, notas, géneros, concentraciones y rango de precios en COP.
* `GET /api/productos` — Catálogo filtrable (`?q=`, `?marca=`, `?familia=`, `?nota=`, `?genero=`, `?concentracion=`, `?tipo_presentacion=`, `?precio_min=`, `?precio_max=`, `?destacado=1`, `?orden=precio_asc`). **Nunca incluye `imagen_data`**.
* `GET /api/productos/{slug}` — Detalle del perfume con su `piramide_olfativa` (`Salida`, `Corazón`, `Fondo`) y sus `variantes` con promociones calculadas.
* `GET /api/productos/{id}/imagen` — Devuelve el binario `image/webp` con `Cache-Control: public, max-age=604800, immutable` y `ETag`.
* `POST /api/checkout/whatsapp` — Genera el mensaje y la URL `https://wa.me/...` tanto para **compra directa** (`{ "variante_id": 1, "cantidad": 1 }`) como para **carrito de compras** (`{ "items": [{ "variante_id": 1, "cantidad": 2 }] }`).

### Administrativos (Protegidos con `Authorization: Bearer <token>`)
* `POST /api/admin/auth/login`
* `GET /api/admin/auth/me`
* `GET|POST /api/admin/productos` y `GET|PUT|DELETE /api/admin/productos/{id}`
* `GET|POST /api/admin/marcas` y `PUT|DELETE /api/admin/marcas/{id}`
* `GET|POST /api/admin/familias-olfativas` y `PUT|DELETE /api/admin/familias-olfativas/{id}`
* `GET|POST /api/admin/notas-olfativas` y `PUT|DELETE /api/admin/notas-olfativas/{id}`
* `POST /api/admin/variantes` y `PUT|DELETE /api/admin/variantes/{id}`
* `GET|POST /api/admin/promociones` y `PUT|DELETE /api/admin/promociones/{id}`
* `GET|PUT /api/admin/configuracion-contacto`
* `GET|POST /api/admin/usuarios`
