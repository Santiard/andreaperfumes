<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\HttpException;
use PDO;

final class SecurityService
{
    private const MAX_ATTEMPTS = 5;
    private const WINDOW_MINUTES = 15;

    /**
     * Aplica cabeceras HTTP de endurecimiento de seguridad (Hardening) contra
     * ataques XSS, Clickjacking, MIME-Sniffing e indexación no autorizada.
     */
    public static function applySecurityHeaders(bool $isNoIndexRoute = false): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

        if ($isNoIndexRoute) {
            header('X-Robots-Tag: noindex, nofollow, noarchive');
        }
    }

    /**
     * Obtiene la IP real del cliente (considerando Cloudflare o Reverse Proxy de VPS).
     */
    public static function getClientIp(): string
    {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return trim((string) $_SERVER['HTTP_CF_CONNECTING_IP']);
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    /**
     * Verifica si la IP o el correo han superado el límite de intentos fallidos de login
     * en los últimos 15 minutos (Protección Anti-Fuerza Bruta).
     */
    public static function checkLoginRateLimit(string $email): void
    {
        $db = Database::getConnection();
        self::ensureRateLimitTableExists($db);

        // Limpiar registros antiguos (> 1 día)
        $db->exec('DELETE FROM admin_login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)');

        $ip = self::getClientIp();
        $stmt = $db->prepare('
            SELECT COUNT(*) FROM admin_login_attempts
            WHERE (ip_address = :ip OR email = :email)
              AND attempted_at >= (NOW() - INTERVAL ' . self::WINDOW_MINUTES . ' MINUTE)
        ');
        $stmt->execute([
            ':ip'    => $ip,
            ':email' => strtolower(trim($email)),
        ]);

        $attempts = (int) $stmt->fetchColumn();
        if ($attempts >= self::MAX_ATTEMPTS) {
            throw new HttpException(
                sprintf(
                    'Demasiados intentos fallidos de inicio de sesión. Por seguridad, el acceso ha sido bloqueado temporalmente por %d minutos.',
                    self::WINDOW_MINUTES
                ),
                429
            );
        }
    }

    /**
     * Registra un intento fallido de login y aplica un micro-retardo defensivo.
     */
    public static function recordFailedLogin(string $email): void
    {
        $db = Database::getConnection();
        self::ensureRateLimitTableExists($db);

        $stmt = $db->prepare('
            INSERT INTO admin_login_attempts (ip_address, email)
            VALUES (:ip, :email)
        ');
        $stmt->execute([
            ':ip'    => self::getClientIp(),
            ':email' => strtolower(trim($email)),
        ]);

        // Retardo defensivo de 400ms para frenar bots de fuerza bruta
        usleep(400000);
    }

    /**
     * Limpia el historial de intentos fallidos tras un inicio de sesión exitoso.
     */
    public static function clearFailedLogins(string $email): void
    {
        $db = Database::getConnection();
        self::ensureRateLimitTableExists($db);

        $stmt = $db->prepare('
            DELETE FROM admin_login_attempts
            WHERE ip_address = :ip OR email = :email
        ');
        $stmt->execute([
            ':ip'    => self::getClientIp(),
            ':email' => strtolower(trim($email)),
        ]);
    }

    private static function ensureRateLimitTableExists(PDO $db): void
    {
        $db->exec('
            CREATE TABLE IF NOT EXISTS `admin_login_attempts` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `ip_address` VARCHAR(45) NOT NULL,
                `email` VARCHAR(150) NOT NULL,
                `attempted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_login_attempts_ip_time` (`ip_address`, `attempted_at`),
                KEY `idx_login_attempts_email_time` (`email`, `attempted_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
    }
}
