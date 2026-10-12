<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class PromocionEntity
{
    public function __construct(
        public int $id,
        public string $nombre,
        public string $tipoDescuento,
        public float $valorDescuento,
        public string $fechaInicio,
        public string $fechaFin,
        public bool $activo,
        public array $variantes = [],
        public array $varianteIds = []
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            nombre: (string) $row['nombre'],
            tipoDescuento: (string) $row['tipo_descuento'],
            valorDescuento: (float) $row['valor_descuento'],
            fechaInicio: (string) $row['fecha_inicio'],
            fechaFin: (string) $row['fecha_fin'],
            activo: (bool) ($row['activo'] ?? true),
            variantes: is_array($row['variantes'] ?? null) ? $row['variantes'] : [],
            varianteIds: is_array($row['variante_ids'] ?? null) ? array_map('intval', $row['variante_ids']) : []
        );
    }

    public function toArray(): array
    {
        $now = time();
        $inicioTs = strtotime($this->fechaInicio) ?: 0;
        $finTs = strtotime($this->fechaFin) ?: 0;
        $vigente = $this->activo && ($now >= $inicioTs && $now <= $finTs);

        return [
            'id'              => $this->id,
            'nombre'          => $this->nombre,
            'tipo_descuento'  => $this->tipoDescuento,
            'valor_descuento' => $this->valorDescuento,
            'fecha_inicio'    => $this->fechaInicio,
            'fecha_fin'       => $this->fechaFin,
            'activo'          => $this->activo,
            'vigente_ahora'   => $vigente,
            'variante_ids'    => $this->varianteIds,
            'variantes'       => $this->variantes,
        ];
    }
}
