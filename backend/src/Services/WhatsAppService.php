<?php

declare(strict_types=1);

namespace App\Services;

final class WhatsAppService
{
    /**
     * Construye el mensaje y la URL de redirección a WhatsApp tanto para compra directa
     * de un perfume como para un carrito con múltiples variantes.
     *
     * @param array{numero_whatsapp: string, mensaje_plantilla: string} $contactoConfig
     * @param array<int, array{
     *   producto_nombre: string,
     *   marca_nombre: string,
     *   concentracion: string,
     *   tamano_ml: int,
     *   tipo_presentacion: string,
     *   sku: string|null,
     *   cantidad: int,
     *   precio_unitario: float,
     *   subtotal: float,
     *   tiene_promocion: bool,
     *   promocion_nombre: string|null
     * }> $items
     */
    public static function buildCheckoutPayload(
        array $contactoConfig,
        array $items,
        ?string $nombreCliente = null,
        ?string $ciudadCliente = null,
        ?string $notasAdicionales = null
    ): array {
        $numero = (string) preg_replace('/[^0-9]/', '', (string) ($contactoConfig['numero_whatsapp'] ?? ''));
        $plantilla = (string) ($contactoConfig['mensaje_plantilla'] ?? '');

        $lineas = [];
        $totalGeneral = 0.0;
        $totalUnidades = 0;

        foreach ($items as $idx => $item) {
            $num = $idx + 1;
            $cantidad = max(1, (int) $item['cantidad']);
            $precioUnitarioCop = PricingService::formatCop((float) $item['precio_unitario']);
            $subtotalCop = PricingService::formatCop((float) $item['subtotal']);

            $promoBadge = $item['tiene_promocion'] && !empty($item['promocion_nombre'])
                ? " _(Promo: {$item['promocion_nombre']})_"
                : '';

            $linea = sprintf(
                "%d. *%s - %s (%s)*\n   • Presentación: %d ml (%s)\n   • Cantidad: %d x %s = *%s*%s",
                $num,
                $item['marca_nombre'],
                $item['producto_nombre'],
                $item['concentracion'],
                (int) $item['tamano_ml'],
                $item['tipo_presentacion'],
                $cantidad,
                $precioUnitarioCop,
                $subtotalCop,
                $promoBadge
            );

            $lineas[] = $linea;
            $totalGeneral += (float) $item['subtotal'];
            $totalUnidades += $cantidad;
        }

        $detalleTexto = implode("\n\n", $lineas);
        $totalCop = PricingService::formatCop($totalGeneral);

        if ($plantilla === '') {
            $plantilla = "¡Hola *Andrea Perfumes*! ✨\nMe interesa realizar el siguiente pedido:\n\n{detalle_pedido}\n\n💰 *Total estimado:* {total_cop}\n\n¿Me confirmas disponibilidad?";
        }

        // Normalizar saltos de línea escapados si fueron guardados como literal \n en BD
        $plantilla = str_replace('\\n', "\n", $plantilla);

        $mensaje = strtr($plantilla, [
            '{detalle_pedido}' => $detalleTexto,
            '{total_cop}'      => $totalCop,
            '{total_items}'    => (string) $totalUnidades,
        ]);

        // Si la plantilla personalizada del admin no incluía los placeholders, los anexamos de forma limpia
        if (!str_contains($plantilla, '{detalle_pedido}')) {
            $mensaje .= "\n\n" . $detalleTexto . "\n\n💰 *Total estimado:* " . $totalCop;
        }

        $datosExtra = [];
        if ($nombreCliente !== null && trim($nombreCliente) !== '') {
            $datosExtra[] = "👤 *Cliente:* " . trim($nombreCliente);
        }
        if ($ciudadCliente !== null && trim($ciudadCliente) !== '') {
            $datosExtra[] = "📍 *Ciudad/Envío:* " . trim($ciudadCliente);
        }
        if ($notasAdicionales !== null && trim($notasAdicionales) !== '') {
            $datosExtra[] = "📝 *Nota:* " . trim($notasAdicionales);
        }

        if (!empty($datosExtra)) {
            $mensaje .= "\n\n" . implode("\n", $datosExtra);
        }

        $whatsappUrl = sprintf(
            'https://wa.me/%s?text=%s',
            $numero,
            rawurlencode($mensaje)
        );

        return [
            'numero_whatsapp' => $numero,
            'mensaje'         => $mensaje,
            'whatsapp_url'    => $whatsappUrl,
            'resumen'         => [
                'total_unidades' => $totalUnidades,
                'total'          => round($totalGeneral, 2),
                'total_cop'      => $totalCop,
                'items'          => $items,
            ],
        ];
    }
}
