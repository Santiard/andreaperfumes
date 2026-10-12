<?php

declare(strict_types=1);

namespace App\Core;

final class Response
{
    public static function json(mixed $data, int $status = 200, array $extraHeaders = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($extraHeaders as $name => $value) {
            header("{$name}: {$value}");
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'OK', int $status = 200): never
    {
        self::json([
            'ok'      => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    public static function error(string $message, int $status = 400, array $errors = []): never
    {
        $payload = [
            'ok'      => false,
            'message' => $message,
        ];
        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }
        self::json($payload, $status);
    }

    /**
     * Sirve el binario WebP directamente desde la base de datos con cabeceras de caché inmutable (7 días)
     * y validación condicional por ETag.
     */
    public static function webpBinary(string $binaryData, string $mime, int $sizeBytes, string $etag): never
    {
        $clientEtag = trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
        $quotedEtag = '"' . $etag . '"';

        header('Content-Type: ' . ($mime ?: 'image/webp'));
        header('Cache-Control: public, max-age=604800, immutable');
        header('ETag: ' . $quotedEtag);
        header('Vary: Accept-Encoding');

        if ($clientEtag === $quotedEtag) {
            http_response_code(304);
            exit;
        }

        http_response_code(200);
        header('Content-Length: ' . ($sizeBytes > 0 ? $sizeBytes : strlen($binaryData)));
        echo $binaryData;
        exit;
    }

    public static function html(string $html, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }
}
