<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class PiramideOlfativaEntity
{
    public function __construct(
        public int $id,
        public int $productoId,
        public int $notaId,
        public string $notaNombre,
        public string $tipoEtapa
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? 0),
            productoId: (int) ($row['producto_id'] ?? 0),
            notaId: (int) $row['nota_id'],
            notaNombre: (string) ($row['nota_nombre'] ?? $row['nombre'] ?? ''),
            tipoEtapa: (string) $row['tipo_etapa']
        );
    }

    public function toArray(): array
    {
        return [
            'id'     => $this->notaId,
            'nombre' => $this->notaNombre,
            'etapa'  => $this->tipoEtapa,
        ];
    }
}
