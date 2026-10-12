<?php

declare(strict_types=1);

namespace App\Services;

final class PricingService
{
    /**
     * Formatea un monto numérico en Pesos Colombianos (COP) sin decimales visibles (ej. $350.000).
     */
    public static function formatCop(float|int $amount): string
    {
        $rounded = (int) round((float) $amount);
        return '$' . number_format($rounded, 0, ',', '.');
    }

    /**
     * Calcula el precio final de una variante aplicando su promoción activa (si existe).
     *
     * @return array{precio_final: float, ahorro: float, tiene_promocion: bool, promocion: array|null}
     */
    public static function calculateVariantPrice(float $precioBase, ?array $promo): array
    {
        if ($promo === null || empty($promo['id'])) {
            return [
                'precio_final'    => round($precioBase, 2),
                'ahorro'          => 0.0,
                'tiene_promocion' => false,
                'promocion'       => null,
            ];
        }

        $tipo = (string) $promo['tipo_descuento'];
        $valor = (float) $promo['valor_descuento'];
        $ahorro = 0.0;

        if ($tipo === 'Porcentaje') {
            $porcentaje = max(0.0, min(100.0, $valor));
            $ahorro = round($precioBase * ($porcentaje / 100.0), 2);
        } elseif ($tipo === 'Monto_Fijo') {
            $ahorro = min($precioBase, max(0.0, $valor));
        }

        $precioFinal = max(0.0, round($precioBase - $ahorro, 2));

        return [
            'precio_final'    => $precioFinal,
            'ahorro'          => $ahorro,
            'tiene_promocion' => $ahorro > 0,
            'promocion'       => [
                'id'              => (int) $promo['id'],
                'nombre'          => (string) $promo['nombre'],
                'tipo_descuento'  => $tipo,
                'valor_descuento' => $valor,
                'etiqueta'        => $tipo === 'Porcentaje'
                    ? '-' . rtrim(rtrim(number_format($valor, 2, '.', ''), '0'), '.') . '%'
                    : '-' . self::formatCop($valor),
                'fecha_inicio'    => (string) ($promo['fecha_inicio'] ?? ''),
                'fecha_fin'       => (string) ($promo['fecha_fin'] ?? ''),
            ],
        ];
    }
}
