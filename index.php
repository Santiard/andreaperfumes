<?php

declare(strict_types=1);

/**
 * Punto de entrada unificado para cPanel / Apache (public_html)
 * Redirige fluidamente hacia el controlador principal del backend.
 */

$candidatePaths = [
    __DIR__ . '/backend/public/index.php',
    __DIR__ . '/public/index.php',
];

foreach ($candidatePaths as $path) {
    if (is_file($path)) {
        require_once $path;
        exit;
    }
}

http_response_code(500);
echo "Error de configuración: no se encontró el archivo del backend en el servidor.";
