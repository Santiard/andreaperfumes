<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = (string) Env::get('DB_HOST', 'db');
            $port = (string) Env::get('DB_PORT', '3306');
            $dbname = (string) Env::get('DB_DATABASE', 'andreaperfumes');
            $user = (string) Env::get('DB_USERNAME', 'andrea_user');
            $pass = (string) Env::get('DB_PASSWORD', 'andrea_secret_pass');

            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_STRINGIFY_FETCHES  => false,
                ]);

                // Limpieza automática de semillas antiguas de Decants / Testers en volúmenes locales existentes
                self::$instance->exec("DELETE FROM variantes_producto WHERE tipo_presentacion IN ('Decant', 'Tester')");
            } catch (PDOException $e) {
                throw new HttpException('Error de conexión con la base de datos: ' . $e->getMessage(), 500);
            }
        }

        return self::$instance;
    }
}
