<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Env;

final class SeoService
{
    /**
     * Genera el documento HTML con etiquetas SEO, Open Graph (para previsualización en WhatsApp/Instagram)
     * y datos estructurados Schema.org/Product en JSON-LD bajo la identidad oficial de DREA PERFUMES (Cúcuta).
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

            $title = trim("{$nombre} {$concentracion} - {$marca} | DREA PERFUMES · Cúcuta");
            $rawDesc = (string) ($producto['descripcion'] ?? "Compra {$nombre} de {$marca} en DREA PERFUMES.");
            $description = $precioCop !== ''
                ? "Disponible desde {$precioCop} COP. {$rawDesc} Entrega el mismo día en Cúcuta y envíos a todo el país."
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
            $title = 'DREA PERFUMES · Cúcuta | Boutique de Perfumería Exclusiva';
            $description = 'Boutique digital de perfumería selectiva, elegante y fácil de explorar. Marcas originales, entregas el mismo día en Cúcuta y envíos asegurados a toda Colombia.';
            $imageUrl = "{$baseUrl}/api/productos/1/imagen";
            $canonicalUrl = $baseUrl;
            $ogType = 'website';

            $jsonLd = [
                '@context'    => 'https://schema.org',
                '@type'       => 'Store',
                'name'        => 'DREA PERFUMES',
                'description' => $description,
                'url'         => $baseUrl,
                'address'     => [
                    '@type'           => 'PostalAddress',
                    'addressLocality' => 'Cúcuta',
                    'addressCountry'  => 'CO',
                ],
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
    <meta property="og:site_name" content="DREA PERFUMES">
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
            $html = (string) preg_replace('/<title>.*?<\/title>/is', '', $html);
            return str_ireplace('</head>', $seoBlock . "\n</head>", $html);
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
{$seoBlock}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #F5F4F2; color: #141414; margin: 0; padding: 3rem 1.5rem; line-height: 1.6; }
        .card { max-width: 820px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD8D0; padding: 2.5rem; box-shadow: 0 10px 30px -10px rgba(20, 20, 20, 0.06); }
        .eyebrow { font-size: 0.75rem; letter-spacing: 0.22em; text-transform: uppercase; color: #7A0C35; font-weight: 600; margin-bottom: 0.5rem; }
        h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.5rem; color: #141414; margin: 0 0 0.25rem 0; font-weight: 600; }
        .divider { width: 110px; height: 2px; background: #7A0C35; margin: 1.25rem 0; }
        code { background: #ECEAE6; padding: 0.2rem 0.45rem; border-radius: 3px; color: #7A0C35; font-size: 0.9em; }
        a { color: #7A0C35; font-weight: 500; text-decoration: none; }
        a:hover { color: #D4AF37; text-decoration: underline; }
        ul { padding-left: 1.25rem; }
        li { margin-bottom: 0.55rem; }
    </style>
</head>
<body>
    <div class="card">
        <div class="eyebrow">PERFUMES · CÚCUTA · CRITERIO · CONFIANZA · ESTILO</div>
        <h1>DREA PERFUMES — Backend &amp; Motor SEO</h1>
        <div class="divider"></div>
        <p>Boutique digital de perfumería exclusiva. El servidor <strong>PHP 8.3 + MariaDB 11</strong> está operativo y las etiquetas <strong>Open Graph / Schema.org</strong> están inyectadas en el <code>&lt;head&gt;</code>.</p>
        <h3>Endpoints Públicos Listos:</h3>
        <ul>
            <li><a href="/api/health"><code>GET /api/health</code></a> — Estado de la API y Base de Datos</li>
            <li><a href="/api/catalogo/filtros"><code>GET /api/catalogo/filtros</code></a> — Marcas, 6 Familias de la Guía Sensorial, Notas y Precios COP</li>
            <li><a href="/api/productos"><code>GET /api/productos</code></a> — Catálogo paginado (soporta <code>?genero=Mujer|Hombre|Unisex</code> y <code>?en_promocion=1</code> para Sale)</li>
            <li><a href="/api/productos/lattafa-khamrah-edp"><code>GET /api/productos/lattafa-khamrah-edp</code></a> — Ficha de producto con Pirámide Olfativa y Variantes</li>
            <li><a href="/api/productos/1/imagen"><code>GET /api/productos/1/imagen</code></a> — Imagen binaria WebP con caché inmutable</li>
            <li><a href="/api/contacto"><code>GET /api/contacto</code></a> — Configuración activa de WhatsApp</li>
        </ul>
    </div>
</body>
</html>
HTML;
    }
}
