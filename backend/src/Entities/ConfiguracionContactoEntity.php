<?php

declare(strict_types=1);

namespace App\Entities;

final readonly class ConfiguracionContactoEntity
{
    public function __construct(
        public int $id,
        public string $numeroWhatsapp,
        public string $mensajePlantilla,
        public bool $activo
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? 1),
            numeroWhatsapp: (string) $row['numero_whatsapp'],
            mensajePlantilla: (string) $row['mensaje_plantilla'],
            activo: (bool) ($row['activo'] ?? true)
        );
    }

    public function toArray(): array
    {
        return [
            'id'                => $this->id,
            'numero_whatsapp'   => $this->numeroWhatsapp,
            'mensaje_plantilla' => $this->mensajePlantilla,
            'activo'            => $this->activo,
        ];
    }
}
