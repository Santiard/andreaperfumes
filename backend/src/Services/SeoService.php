<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Env;

final class SeoService
{
    /**
     * Genera el documento HTML con etiquetas SEO, Open Graph (para previsualización en WhatsApp/Instagram)
     * y datos estructurados Schema.org/Product en JSON-LD.
     * Si existe el build de React en /frontend/dist/index.html, inyecta las etiquetas en su <head>.
     */
    public static function renderSpaWithSeo(?array $producto = null): string
    {
        $baseUrl = rtrim((string) Env::get('APP_URL', 'http://localhost:8080'), '/');

        if ($producto !== null) {
            $marca = (string) ($producto['marca']['nombre'] ?? '');
            $nombre = (string) ($producto['nombre'] ?? '');
            $concentracion = (string) ($producto['concentracion'] ?? '');
            $precioCop = (string) ($producto['precio_desde_cop'] ?? '');
            $precioNum = (float) ($producto['precio_desde'] ?? 0);

            $title = trim("{$nombre} {$concentracion} - {$marca} | Andrea Perfumes");
            $rawDesc = (string) ($producto['descripcion'] ?? "Compra {$nombre} de {$marca} en Andrea Perfumes.");
            $description = $precioCop !== ''
                ? "Disponible desde {$precioCop} COP. {$rawDesc}"
                : $rawDesc;
            $imageUrl = $baseUrl . (string) ($producto['imagen']['url'] ?? '');
            $canonicalUrl = "{$baseUrl}/perfume/" . (string) ($producto['slug'] ?? '');
            $ogType = 'product';

            $jsonLd = [
                '@context'    => 'https://schema.org',
                '@type'       => 'Product',
                'name'        => "{$marca} {$nombre} ({$concentracion})",
                'description' => $rawDesc,
                'image'       => [$imageUrl],
                'brand'       => [
                    '@type' => 'Brand',
                    'name'  => $marca,
                ],
                'offers'      => [
                    '@type'         => 'Offer',
                    'url'           => $canonicalUrl,
                    'priceCurrency' => 'COP',
                    'price'         => $precioNum,
                    'availability'  => 'https://schema.org/InStock',
                ],
            ];
        } else {
            $title = 'Andrea Perfumes | Catálogo de Perfumería Original, Árabe y Diseñador';
            $description = 'Explora nuestro catálogo de perfumes originales, presentaciones regulares, testers y decants. Pedidos directos por WhatsApp en toda Colombia.';
            $imageUrl = "{$baseUrl}/api/productos/1/imagen";
            $canonicalUrl = $baseUrl;
            $ogType = 'website';

            $jsonLd = [
                '@context'    => 'https://schema.org',
                '@type'       => 'Store',
                'name'        => 'Andrea Perfumes',
                'description' => $description,
                'url'         => $baseUrl,
            ];
        }

        $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $escapedDesc = htmlspecialchars(mb_substr($description, 0, 200), ENT_QUOTES, 'UTF-8');
        $escapedImage = htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8');
        $escapedUrl = htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8');
        $jsonLdScript = json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $seoBlock = <<<HTML
    <title>{$escapedTitle}</title>
    <meta name="description" content="{$escapedDesc}">
    <link rel="canonical" href="{$escapedUrl}">
    <meta property="og:site_name" content="Andrea Perfumes">
    <meta property="og:type" content="{$ogType}">
    <meta property="og:title" content="{$escapedTitle}">
    <meta property="og:description" content="{$escapedDesc}">
    <meta property="og:image" content="{$escapedImage}">
    <meta property="og:image:type" content="image/webp">
    <meta property="og:url" content="{$escapedUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$escapedTitle}">
    <meta name="twitter:description" content="{$escapedDesc}">
    <meta name="twitter:image" content="{$escapedImage}">
    <script type="application/ld+json">{$jsonLdScript}</script>
HTML;

        $frontendIndex = dirname(__DIR__, 3) . '/frontend/dist/index.html';
        if (is_file($frontendIndex) && is_readable($frontendIndex)) {
            $html = (string) file_get_contents($frontendIndex);
            // Reemplazar <title>...</title> existente e inyectar bloque SEO antes de </head>
            $html = (string) preg_replace('/<title>.*?<\/title>/is', '', $html);
            return str_ireplace('</head>', $seoBlock . "\n</head>", $html);
        }

        // Vista diagnóstica de estado del Backend cuando aún no se ha compilado el Frontend en React
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
{$seoBlock}
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f12; color: #f4f1ea; margin: 0; padding: 2.5rem; line-height: 1.6; }
        .card { max-width: 780px; margin: 0 auto; background: #18181d; border: 1px solid #2e2a23; border-radius: 12px; padding: 2rem; }
        h1 { color: #d4af37; margin-top: 0; }
        code { background: #25252d; padding: 0.2rem 0.45rem; border-radius: 4px; color: #f3d27a; }
        a { color: #d4af37; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul { padding-left: 1.25rem; }
        li { margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Andrea Perfumes — Backend API &amp; Motor SEO Activo</h1>
        <p>El servidor <strong>PHP 8.3 + MariaDB 11</strong> está en ejecución y las etiquetas <strong>Open Graph / Schema.org</strong> ya han sido inyectadas en el <code>&lt;head&gt;</code> de esta página.</p>
        <h3>Endpoints Públicos Listos:</h3>
        <ul>
            <li><a href="/api/health"><code>GET /api/health</code></a> — Estado de la API y Base de Datos</li>
            <li><a href="/api/catalogo/filtros"><code>GET /api/catalogo/filtros</code></a> — Marcas, Familias, Notas, Géneros y Rango de Precios COP</li>
            <li><a href="/api/productos"><code>GET /api/productos</code></a> — Catálogo paginado y filtrable (sin binario WebP en el JSON)</li>
            <li><a href="/api/productos/lattafa-khamrah-edp"><code>GET /api/productos/lattafa-khamrah-edp</code></a> — Detalle con Pirámide Olfativa y Variantes</li>
            <li><a href="/api/productos/1/imagen"><code>GET /api/productos/1/imagen</code></a> — Imagen binaria WebP con caché inmutable</li>
            <li><a href="/api/contacto"><code>GET /api/contacto</code></a> — Configuración activa de WhatsApp</li>
        </ul>
    </div>
</body>
</html>
HTML;
    }
}
