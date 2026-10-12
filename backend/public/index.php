<?php

declare(strict_types=1);

// 1. Autoload PSR-4 (Composer + Respaldo PSR-4 dinámico para nuevas clases)
$composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $baseDir = dirname(__DIR__) . '/src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});

use App\Controllers\AdminAuthController;
use App\Controllers\AdminCatalogoController;
use App\Controllers\AdminProductoController;
use App\Controllers\CatalogoController;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Services\SecurityService;

// 2. Cabeceras CORS y Endurecimiento de Seguridad HTTP (Hardening)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 3. Inicializar Request, Cabeceras de Seguridad y Router
$request = new Request();
$path = $request->path();
$isNoIndexRoute = str_starts_with($path, '/api/admin')
    || str_starts_with($path, '/drea-admin')
    || str_starts_with($path, '/admin');

SecurityService::applySecurityHeaders($isNoIndexRoute);

$router = new Router();

// =============================================================================
// RUTAS PÚBLICAS DEL CATÁLOGO Y CHECKOUT WHATSAPP
// =============================================================================
$router->get('/api/health', static fn(Request $req) => (new CatalogoController())->health($req));
$router->get('/api/catalogo/filtros', static fn(Request $req) => (new CatalogoController())->filtros($req));
$router->get('/api/productos', static fn(Request $req) => (new CatalogoController())->listarProductos($req));
$router->get('/api/productos/{id}/imagen', static fn(Request $req) => (new CatalogoController())->servirImagen($req));
$router->get('/api/productos/{slug}', static fn(Request $req) => (new CatalogoController())->detalleProducto($req));
$router->get('/api/contacto', static fn(Request $req) => (new CatalogoController())->obtenerContacto($req));
$router->post('/api/checkout/whatsapp', static fn(Request $req) => (new CatalogoController())->generarCheckoutWhatsApp($req));

// =============================================================================
// RUTAS DE AUTENTICACIÓN ADMINISTRATIVA (Con Rate-Limiting Anti-Fuerza Bruta)
// =============================================================================
$router->post('/api/admin/auth/login', static fn(Request $req) => (new AdminAuthController())->login($req));
$router->get('/api/admin/auth/me', static fn(Request $req) => (new AdminAuthController())->me($req), true);
$router->put('/api/admin/auth/password', static fn(Request $req) => (new AdminAuthController())->changePassword($req), true);

// =============================================================================
// RUTAS PROTEGIDAS DEL PANEL DE ADMINISTRACIÓN (Requieren Bearer JWT)
// =============================================================================

// Productos (con conversión a WebP, Pirámide Olfativa y Variantes)
$router->get('/api/admin/productos', static fn(Request $req) => (new AdminProductoController())->index($req), true);
$router->get('/api/admin/productos/{id}', static fn(Request $req) => (new AdminProductoController())->show($req), true);
$router->post('/api/admin/productos', static fn(Request $req) => (new AdminProductoController())->store($req), true);
$router->put('/api/admin/productos/{id}', static fn(Request $req) => (new AdminProductoController())->update($req), true);
$router->post('/api/admin/productos/{id}', static fn(Request $req) => (new AdminProductoController())->update($req), true);
$router->delete('/api/admin/productos/{id}', static fn(Request $req) => (new AdminProductoController())->destroy($req), true);

// Marcas
$router->get('/api/admin/marcas', static fn(Request $req) => (new AdminCatalogoController())->listarMarcas($req), true);
$router->post('/api/admin/marcas', static fn(Request $req) => (new AdminCatalogoController())->crearMarca($req), true);
$router->put('/api/admin/marcas/{id}', static fn(Request $req) => (new AdminCatalogoController())->actualizarMarca($req), true);
$router->delete('/api/admin/marcas/{id}', static fn(Request $req) => (new AdminCatalogoController())->eliminarMarca($req), true);

// Familias Olfativas
$router->get('/api/admin/familias-olfativas', static fn(Request $req) => (new AdminCatalogoController())->listarFamilias($req), true);
$router->post('/api/admin/familias-olfativas', static fn(Request $req) => (new AdminCatalogoController())->crearFamilia($req), true);
$router->put('/api/admin/familias-olfativas/{id}', static fn(Request $req) => (new AdminCatalogoController())->actualizarFamilia($req), true);
$router->delete('/api/admin/familias-olfativas/{id}', static fn(Request $req) => (new AdminCatalogoController())->eliminarFamilia($req), true);

// Notas Olfativas
$router->get('/api/admin/notas-olfativas', static fn(Request $req) => (new AdminCatalogoController())->listarNotas($req), true);
$router->post('/api/admin/notas-olfativas', static fn(Request $req) => (new AdminCatalogoController())->crearNota($req), true);
$router->put('/api/admin/notas-olfativas/{id}', static fn(Request $req) => (new AdminCatalogoController())->actualizarNota($req), true);
$router->delete('/api/admin/notas-olfativas/{id}', static fn(Request $req) => (new AdminCatalogoController())->eliminarNota($req), true);

// Variantes de Producto individuales
$router->get('/api/admin/variantes', static fn(Request $req) => (new AdminCatalogoController())->listarVariantes($req), true);
$router->post('/api/admin/variantes', static fn(Request $req) => (new AdminCatalogoController())->crearVariante($req), true);
$router->put('/api/admin/variantes/{id}', static fn(Request $req) => (new AdminCatalogoController())->actualizarVariante($req), true);
$router->delete('/api/admin/variantes/{id}', static fn(Request $req) => (new AdminCatalogoController())->eliminarVariante($req), true);

// Promociones y Descuentos
$router->get('/api/admin/promociones', static fn(Request $req) => (new AdminCatalogoController())->listarPromociones($req), true);
$router->post('/api/admin/promociones', static fn(Request $req) => (new AdminCatalogoController())->crearPromocion($req), true);
$router->put('/api/admin/promociones/{id}', static fn(Request $req) => (new AdminCatalogoController())->actualizarPromocion($req), true);
$router->delete('/api/admin/promociones/{id}', static fn(Request $req) => (new AdminCatalogoController())->eliminarPromocion($req), true);

// Configuración de Contacto (WhatsApp y Plantilla)
$router->get('/api/admin/configuracion-contacto', static fn(Request $req) => (new AdminCatalogoController())->obtenerConfigContacto($req), true);
$router->put('/api/admin/configuracion-contacto', static fn(Request $req) => (new AdminCatalogoController())->actualizarConfigContacto($req), true);

// Usuarios Administradores
$router->get('/api/admin/usuarios', static fn(Request $req) => (new AdminCatalogoController())->listarAdmins($req), true);
$router->post('/api/admin/usuarios', static fn(Request $req) => (new AdminCatalogoController())->crearAdmin($req), true);

// =============================================================================
// FALLBACK SEO / OPEN GRAPH PARA RUTAS WEB (ej. /, /perfume/{slug}, /drea-admin)
// =============================================================================
$router->setFallback(static fn(Request $req) => (new CatalogoController())->renderSeoPage($req));

// 4. Despachar petición con captura centralizada de excepciones
try {
    $router->dispatch($request);
} catch (HttpException $e) {
    Response::error($e->getMessage(), $e->getStatusCode(), $e->getErrors());
} catch (Throwable $e) {
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
