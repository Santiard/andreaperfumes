<?php

declare(strict_types=1);

namespace App\Entities;

final class PerfumeEnums
{
    public const GENEROS = [
        'Hombre',
        'Mujer',
        'Unisex',
    ];

    public const CONCENTRACIONES = [
        'EDT',
        'EDP',
        'Parfum',
        'Extrait de Parfum',
        'EDC',
        'Fraiche',
    ];

    public const ETAPAS_PIRAMIDE = [
        'Salida',
        'Corazón',
        'Fondo',
    ];

    public const TIPOS_PRESENTACION = [
        'Regular',
        'Kit',
    ];

    public const TIPOS_DESCUENTO = [
        'Porcentaje',
        'Monto_Fijo',
    ];

    public static function isValidGenero(string $value): bool
    {
        return in_array($value, self::GENEROS, true);
    }

    public static function isValidConcentracion(string $value): bool
    {
        return in_array($value, self::CONCENTRACIONES, true);
    }

    public static function isValidEtapaPiramide(string $value): bool
    {
        return in_array($value, self::ETAPAS_PIRAMIDE, true);
    }

    public static function isValidTipoPresentacion(string $value): bool
    {
        return in_array($value, self::TIPOS_PRESENTACION, true);
    }

    public static function isValidTipoDescuento(string $value): bool
    {
        return in_array($value, self::TIPOS_DESCUENTO, true);
    }
}
