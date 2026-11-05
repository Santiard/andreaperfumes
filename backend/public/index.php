<?php

declare(strict_types=1);

// =============================================================================
// DREA PERFUMES — BACKEND PUBLIC ENTRY POINT (cPanel / Apache)
// =============================================================================

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// 1. Detectar ubicación física de la carpeta 'src'
$candidateSrcDirs = [
    dirname(__DIR__) . '/src',
    __DIR__ . '/../src',
    __DIR__ . '/src',
    dirname(__DIR__, 2) . '/backend/src',
    dirname(__DIR__, 2) . '/src',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/backend/src',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/src',
];

$srcDir = null;
foreach ($candidateSrcDirs as $candidate) {
    if (is_dir($candidate)) {
        $srcDir = realpath($candidate) ?: $candidate;
        break;
    }
}

if ($srcDir === null || !is_dir($srcDir)) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<div style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">';
    echo '<h2 style="color:#800020;margin-top:0;">DREA PERFUMES — Error de Despliegue</h2>';
    echo '<p>No se pudo localizar el directorio de código <code>backend/src</code> en el servidor.</p>';
    echo '<p><strong>Rutas exploradas:</strong></p><ul>';
    foreach ($candidateSrcDirs as $p) {
        echo '<li><code>' . htmlspecialchars($p) . '</code></li>';
    }
    echo '</ul><p>Asegúrese de descomprimir el archivo ZIP directamente en <code>public_html</code>.</p>';
    echo '</div>';
    exit;
}

// 2. Carga explícita inmediata de los 7 componentes del Núcleo (Core)
$coreDir = is_dir("{$srcDir}/Core") ? "{$srcDir}/Core" : (is_dir("{$srcDir}/core") ? "{$srcDir}/core" : null);

if ($coreDir === null) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<div style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">';
    echo '<h2 style="color:#800020;margin-top:0;">DREA PERFUMES — Error del Sistema</h2>';
    echo "<p>No se encontró el directorio <code>Core</code> dentro de <code>{$srcDir}</code>.</p>";
    echo '</div>';
    exit;
}

$coreFiles = [
    'HttpException.php',
    'Env.php',
    'Response.php',
    'Request.php',
    'Router.php',
    'Database.php',
    'JwtAuth.php',
];

foreach ($coreFiles as $coreFile) {
    $filePath = "{$coreDir}/{$coreFile}";
    if (file_exists($filePath)) {
        require_once $filePath;
    } else {
        http_response_code(500);
        die("Error de inicialización: Archivo del núcleo no encontrado: {$filePath}");
    }
}

// 3. Autoloader PSR-4 blindado con soporte para Linux (case-sensitivity)
spl_autoload_register(static function (string $class) use ($srcDir): void {
    $class = ltrim($class, '\\');
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $relativePath = str_replace('\\', '/', $relativeClass) . '.php';

    // 1. Ruta exacta estándar
    $targetFile = "{$srcDir}/{$relativePath}";
    if (file_exists($targetFile)) {
        require_once $targetFile;
        return;
    }

    // 2. Fallback de nombre de carpeta en minúsculas para servidores Linux
    $parts = explode('/', $relativePath);
    if (count($parts) > 1) {
        $parts[0] = strtolower($parts[0]);
        $fallbackFile = $srcDir . '/' . implode('/', $parts);
        if (file_exists($fallbackFile)) {
            require_once $fallbackFile;
            return;
        }
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

// 4. Cabeceras CORS y endurecimiento HTTP
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token, X-Authorization, X-Requested-With');

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 5. Inicializar Request y Router
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

// 6. Despachar petición con captura centralizada de excepciones
try {
    $router->dispatch($request);
} catch (HttpException $e) {
    Response::error($e->getMessage(), $e->getStatusCode(), $e->getErrors());
} catch (Throwable $e) {
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
