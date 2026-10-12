<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class UsuarioAdminEntity
{
    public function __construct(
        public int $id,
        public string $nombre,
        public string $email,
        public bool $activo
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            nombre: (string) $row['nombre'],
            email: (string) $row['email'],
            activo: (bool) ($row['activo'] ?? true)
        );
    }

    /**
     * Serializa el administrador omitiendo siempre `password_hash` por seguridad.
     */
    public function toArray(): array
    {
        return [
            'id'     => $this->id,
            'nombre' => $this->nombre,
            'email'  => $this->email,
            'activo' => $this->activo,
        ];
    }
}
