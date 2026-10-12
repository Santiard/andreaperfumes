<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class FamiliaOlfativaEntity
{
    public function __construct(
        public int $id,
        public string $nombre,
        public ?string $descripcion,
        public ?int $totalProductos = null
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            nombre: (string) $row['nombre'],
            descripcion: isset($row['descripcion']) && $row['descripcion'] !== '' ? (string) $row['descripcion'] : null,
            totalProductos: isset($row['total_productos']) ? (int) $row['total_productos'] : null
        );
    }

    public function toArray(): array
    {
        $data = [
            'id'          => $this->id,
            'nombre'      => $this->nombre,
            'descripcion' => $this->descripcion,
        ];

        if ($this->totalProductos !== null) {
            $data['total_productos'] = $this->totalProductos;
        }

        return $data;
    }
}
