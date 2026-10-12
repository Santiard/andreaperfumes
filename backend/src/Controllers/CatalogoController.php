<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Repositories\CatalogoRepository;
use App\Repositories\ProductoRepository;
use App\Services\SeoService;
use App\Services\WhatsAppService;

final class CatalogoController
{
    private ProductoRepository $productos;
    private CatalogoRepository $catalogo;

    public function __construct()
    {
        $this->productos = new ProductoRepository();
        $this->catalogo = new CatalogoRepository();
    }

    public function health(Request $request): void
    {
        $db = Database::getConnection();
        $version = (string) $db->query('SELECT VERSION()')->fetchColumn();

        Response::success([
            'service'      => 'DREA PERFUMES API',
            'brand'        => 'DREA PERFUMES',
            'location'     => 'Cúcuta, Colombia',
            'php_version'  => PHP_VERSION,
            'db_engine'    => $version,
            'webp_support' => function_exists('imagewebp'),
            'currency'     => 'COP',
            'timestamp'    => date('c'),
        ], 'Sistema operativo y conectado a MariaDB.');
    }

    public function filtros(Request $request): void
    {
        Response::success($this->catalogo->getPublicFilters());
    }

    public function listarProductos(Request $request): void
    {
        $result = $this->productos->listCatalog($request->allQuery(), false);
        Response::success($result);
    }

    public function detalleProducto(Request $request): void
    {
        $slugOrId = (string) $request->param('slug', '');
        $producto = $this->productos->findBySlugOrId($slugOrId, false);
        if ($producto === null) {
            throw new HttpException('El perfume solicitado no fue encontrado o no está disponible.', 404);
        }

        Response::success($producto);
    }

    /**
     * Endpoint dedicado GET /api/productos/{id}/imagen
     * Sirve el binario WebP directamente con Cache-Control: public, max-age=604800, immutable.
     */
    public function servirImagen(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        if ($id <= 0) {
            throw new HttpException('ID de producto inválido.', 400);
        }

        $img = $this->productos->getBinaryImageById($id);
        if ($img === null || empty($img['imagen_data'])) {
            throw new HttpException('Imagen no encontrada.', 404);
        }

        $binary = (string) $img['imagen_data'];
        $mime = (string) ($img['imagen_mime'] ?: 'image/webp');
        $size = (int) ($img['imagen_tamano_bytes'] ?: strlen($binary));
        $etag = sha1($id . '-' . ($img['updated_at'] ?? '') . '-' . $size);

        Response::webpBinary($binary, $mime, $size, $etag);
    }

    public function obtenerContacto(Request $request): void
    {
        $config = $this->catalogo->getActiveContactoConfig();
        Response::success([
            'numero_whatsapp'   => $config['numero_whatsapp'],
            'mensaje_plantilla' => $config['mensaje_plantilla'],
        ]);
    }

    /**
     * Endpoint POST /api/checkout/whatsapp
     * Soporta tanto:
     * 1) Compra directa de un perfume: { "variante_id": 1, "cantidad": 1 }
     * 2) Carrito de compras completo: { "items": [{ "variante_id": 1, "cantidad": 2 }, { "variante_id": 4, "cantidad": 1 }] }
     */
    public function generarCheckoutWhatsApp(Request $request): void
    {
        $items = $request->input('items');

        if (!is_array($items) || empty($items)) {
            $singleVarianteId = (int) $request->input('variante_id', 0);
            if ($singleVarianteId > 0) {
                $items = [
                    [
                        'variante_id' => $singleVarianteId,
                        'cantidad'    => max(1, (int) $request->input('cantidad', 1)),
                    ],
                ];
            } else {
                throw new HttpException(
                    'Debes enviar `variante_id` (compra directa) o el arreglo `items` (carrito de compras).',
                    422
                );
            }
        }

        $resolvedItems = $this->catalogo->resolveItemsForCheckout($items);
        $contactoConfig = $this->catalogo->getActiveContactoConfig();

        $checkout = WhatsAppService::buildCheckoutPayload(
            $contactoConfig,
            $resolvedItems,
            $request->input('nombre_cliente') !== null ? (string) $request->input('nombre_cliente') : null,
            $request->input('ciudad_cliente') !== null ? (string) $request->input('ciudad_cliente') : null,
            $request->input('notas') !== null ? (string) $request->input('notas') : null
        );

        Response::success($checkout, 'Enlace de pedido para WhatsApp generado correctamente.');
    }

    /**
     * Renderiza el HTML con inyección SEO / Open Graph para rutas web como /perfume/{slug}.
     */
    public function renderSeoPage(Request $request): void
    {
        $path = $request->path();
        $producto = null;

        if (preg_match('#^/perfume/([^/]+)$#u', $path, $matches)) {
            $slug = urldecode($matches[1]);
            $producto = $this->productos->findBySlugOrId($slug, false);
        }

        $html = SeoService::renderSpaWithSeo($producto);
        Response::html($html, 200);
    }
}
