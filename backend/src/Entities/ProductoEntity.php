<?php

declare(strict_types=1);

namespace App\Entities;

use App\Services\PricingService;

final class ProductoEntity
{
    /**
     * Formatea una fila de la tabla PRODUCTOS para respuesta JSON pública o administrativa.
     * Garantiza que NUNCA se incluya `imagen_data` en el payload JSON y genera la URL
     * dedicada `/api/productos/{id}/imagen?v={timestamp}` para cache-busting inmutable.
     */
    public static function formatRow(
        array $row,
        array $variantes = [],
        ?array $piramide = null
    ): array {
        $id = (int) $row['id'];
        $updatedAt = (string) ($row['updated_at'] ?? '');
        $versionTimestamp = $updatedAt !== '' ? strtotime($updatedAt) : time();

        // Si existe imagen local en frontend/public/assets/productos/producto{id}.*, usar su fecha de modificación para actualizar caché al instante
        $localDir = dirname(__DIR__, 3) . '/frontend/public/assets/productos';
        foreach (['webp', 'png', 'jpg', 'jpeg'] as $ext) {
            $localFile = "{$localDir}/producto{$id}.{$ext}";
            if (is_file($localFile)) {
                $versionTimestamp = max((int) $versionTimestamp, (int) filemtime($localFile));
                break;
            }
        }

        $formattedVariantes = [];
        $precioMinimoFinal = null;
        $tienePromocion = false;

        foreach ($variantes as $variante) {
            $formattedVar = self::formatVariante($variante);
            $formattedVariantes[] = $formattedVar;

            if ($formattedVar['disponible']) {
                $precioActual = $formattedVar['precio_final'];
                if ($precioMinimoFinal === null || $precioActual < $precioMinimoFinal) {
                    $precioMinimoFinal = $precioActual;
                }
                if ($formattedVar['tiene_promocion']) {
                    $tienePromocion = true;
                }
            }
        }

        $payload = [
            'id'                  => $id,
            'nombre'              => (string) $row['nombre'],
            'slug'                => (string) $row['slug'],
            'descripcion'         => $row['descripcion'] !== null ? (string) $row['descripcion'] : null,
            'genero'              => (string) $row['genero'],
            'concentracion'       => (string) $row['concentracion'],
            'ocasion_uso'         => $row['ocasion_uso'] !== null ? (string) $row['ocasion_uso'] : null,
            'marca'               => [
                'id'     => (int) $row['marca_id'],
                'nombre' => (string) ($row['marca_nombre'] ?? ''),
                'slug'   => (string) ($row['marca_slug'] ?? ''),
            ],
            'familia_olfativa'    => $row['familia_olfativa_id'] !== null ? [
                'id'     => (int) $row['familia_olfativa_id'],
                'nombre' => (string) ($row['familia_nombre'] ?? ''),
            ] : null,
            'imagen'              => [
                'url'          => "/api/productos/{$id}/imagen?v={$versionTimestamp}",
                'mime'         => (string) ($row['imagen_mime'] ?? 'image/webp'),
                'tamano_bytes' => (int) ($row['imagen_tamano_bytes'] ?? 0),
            ],
            'destacado'           => (bool) $row['destacado'],
            'activo'              => (bool) $row['activo'],
            'precio_desde'        => $precioMinimoFinal,
            'precio_desde_cop'    => $precioMinimoFinal !== null ? PricingService::formatCop($precioMinimoFinal) : null,
            'tiene_promocion'     => $tienePromocion,
            'variantes'           => $formattedVariantes,
            'created_at'          => (string) ($row['created_at'] ?? ''),
            'updated_at'          => $updatedAt,
        ];

        if ($piramide !== null) {
            $payload['piramide_olfativa'] = $piramide;
        }

        return $payload;
    }

    public static function formatVariante(array $var): array
    {
        return VarianteProductoEntity::fromArray($var)->toArray();
    }
}
