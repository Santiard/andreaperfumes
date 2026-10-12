<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class MarcaEntity
{
    public function __construct(
        public int $id,
        public string $nombre,
        public string $slug,
        public ?string $descripcion,
        public bool $activo,
        public ?int $totalProductos = null
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            nombre: (string) $row['nombre'],
            slug: (string) $row['slug'],
            descripcion: isset($row['descripcion']) && $row['descripcion'] !== '' ? (string) $row['descripcion'] : null,
            activo: (bool) ($row['activo'] ?? true),
            totalProductos: isset($row['total_productos']) ? (int) $row['total_productos'] : null
        );
    }

    public function toArray(): array
    {
        $data = [
            'id'          => $this->id,
            'nombre'      => $this->nombre,
            'slug'        => $this->slug,
            'descripcion' => $this->descripcion,
            'activo'      => $this->activo,
        ];

        if ($this->totalProductos !== null) {
            $data['total_productos'] = $this->totalProductos;
        }

        return $data;
    }
}
