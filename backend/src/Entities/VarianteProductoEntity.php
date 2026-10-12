<?php

declare(strict_types=1);

namespace App\Entities;

use App\Services\PricingService;

final readonly class VarianteProductoEntity
{
    public function __construct(
        public int $id,
        public int $productoId,
        public int $tamanoMl,
        public string $tipoPresentacion,
        public ?string $sku,
        public float $precioBase,
        public bool $disponible,
        public ?array $promocionActiva = null
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            productoId: (int) $row['producto_id'],
            tamanoMl: (int) $row['tamano_ml'],
            tipoPresentacion: (string) ($row['tipo_presentacion'] ?? 'Regular'),
            sku: isset($row['sku']) && $row['sku'] !== '' ? (string) $row['sku'] : null,
            precioBase: (float) $row['precio_base'],
            disponible: (bool) ($row['disponible'] ?? true),
            promocionActiva: is_array($row['promocion_activa'] ?? null) ? $row['promocion_activa'] : null
        );
    }

    public function toArray(): array
    {
        $promoCalculada = PricingService::calculateVariantPrice(
            $this->precioBase,
            $this->promocionActiva
        );

        return [
            'id'                => $this->id,
            'producto_id'       => $this->productoId,
            'tamano_ml'         => $this->tamanoMl,
            'tipo_presentacion' => $this->tipoPresentacion,
            'etiqueta'          => sprintf('%d ml (%s)', $this->tamanoMl, $this->tipoPresentacion),
            'sku'               => $this->sku,
            'precio_base'       => $this->precioBase,
            'precio_base_cop'   => PricingService::formatCop($this->precioBase),
            'precio_final'      => $promoCalculada['precio_final'],
            'precio_final_cop'  => PricingService::formatCop($promoCalculada['precio_final']),
            'ahorro'            => $promoCalculada['ahorro'],
            'ahorro_cop'        => PricingService::formatCop($promoCalculada['ahorro']),
            'tiene_promocion'   => $promoCalculada['tiene_promocion'],
            'promocion'         => $promoCalculada['promocion'],
            'disponible'        => $this->disponible,
        ];
    }
}
