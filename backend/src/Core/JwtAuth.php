<?php

declare(strict_types=1);

namespace App\Core;

final class JwtAuth
{
    public static function generateToken(array $payload): string
    {
        $secret = (string) Env::get('JWT_SECRET', 'andrea_perfumes_jwt_super_secret_key_2026');
        $ttl = Env::getInt('JWT_EXPIRATION_SECONDS', 86400);

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $now = time();
        $body = array_merge($payload, [
            'iat' => $now,
            'exp' => $now + $ttl,
        ]);

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($body));

        $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "{$base64Header}.{$base64Payload}.{$base64Signature}";
    }

    public static function verifyToken(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new HttpException('Token de autenticación inválido.', 401);
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;
        $secret = (string) Env::get('JWT_SECRET', 'andrea_perfumes_jwt_super_secret_key_2026');

        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true)
        );

        if (!hash_equals($expectedSig, $base64Signature)) {
            throw new HttpException('Firma del token inválida.', 401);
        }

        $payloadJson = self::base64UrlDecode($base64Payload);
        $payload = json_decode($payloadJson, true);

        if (!is_array($payload)) {
            throw new HttpException('Payload del token corrupto.', 401);
        }

        if (isset($payload['exp']) && time() > (int) $payload['exp']) {
            throw new HttpException('La sesión ha expirado. Inicia sesión nuevamente.', 401);
        }

        return $payload;
    }

    public static function requireAdmin(Request $request): void
    {
        $token = $request->bearerToken();
        if ($token === null || $token === '') {
            throw new HttpException('Se requiere autenticación de administrador (Bearer token).', 401);
        }

        $payload = self::verifyToken($token);
        $request->setAuthUser($payload);
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return (string) base64_decode(strtr($data, '-_', '+/'));
    }
}
