<?php

declare(strict_types=1);

namespace App\Core;

final class Env
{
    private static bool $loaded = false;

    private static function loadEnv(): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        $paths = [
            dirname(__DIR__, 2) . '/.env',
            dirname(__DIR__, 3) . '/.env',
            dirname(__DIR__, 1) . '/.env',
        ];

        foreach ($paths as $path) {
            if (is_file($path) && is_readable($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if ($lines !== false) {
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if ($line === '' || str_starts_with($line, '#')) {
                            continue;
                        }
                        if (str_contains($line, '=')) {
                            [$k, $v] = explode('=', $line, 2);
                            $k = trim($k);
                            $v = trim($v, " \t\n\r\0\x0B\"'");
                            if (!array_key_exists($k, $_ENV)) {
                                $_ENV[$k] = $v;
                                putenv("{$k}={$v}");
                            }
                        }
                    }
                }
                break;
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        self::loadEnv();
        $val = $_ENV[$key] ?? getenv($key);
        if ($val === false || $val === null || $val === '') {
            return $default;
        }
        return $val;
    }

    public static function getInt(string $key, int $default = 0): int
    {
        return (int) self::get($key, $default);
    }
}
