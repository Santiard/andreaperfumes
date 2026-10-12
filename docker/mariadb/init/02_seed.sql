-- =============================================================================
-- DATOS SEMILLA INICIALES: ANDREA PERFUMES
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Usuario Administrador Inicial
-- Email: admin@andreaperfumes.com | Contraseña por defecto: password
INSERT INTO `usuarios_admin` (`id`, `nombre`, `email`, `password_hash`, `activo`) VALUES
(1, 'Administrador Andrea Perfumes', 'admin@andreaperfumes.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 2. Configuración de Contacto WhatsApp (con variables dinámicas para pedido individual o carrito)
INSERT INTO `configuracion_contacto` (`id`, `numero_whatsapp`, `mensaje_plantilla`, `activo`) VALUES
(1, '573000000000', '¡Hola *Andrea Perfumes*! ✨\nMe interesa realizar el siguiente pedido:\n\n{detalle_pedido}\n\n💰 *Total estimado:* {total_cop}\n\n¿Me confirmas disponibilidad y medios de pago? ¡Gracias!', TRUE)
ON DUPLICATE KEY UPDATE `numero_whatsapp` = VALUES(`numero_whatsapp`);

-- 3. Marcas Base
INSERT INTO `marcas` (`id`, `nombre`, `slug`, `descripcion`, `activo`) VALUES
(1, 'Lattafa', 'lattafa', 'Casa de alta perfumería árabe con fragancias intensas y duraderas.', TRUE),
(2, 'Dior', 'dior', 'Casa francesa icónica de perfumería de diseñador y alta costura.', TRUE),
(3, 'Chanel', 'chanel', 'Elegancia atemporal francesa con composiciones clásicas y modernas.', TRUE),
(4, 'Jean Paul Gaultier', 'jean-paul-gaultier', 'Fragancias audaces, seductoras y con frascos icónicos.', TRUE),
(5, 'Carolina Herrera', 'carolina-herrera', 'Perfumería sofisticada de gran proyección y carácter.', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 4. Familias Olfativas Base
INSERT INTO `familias_olfativas` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Oriental Especiada', 'Notas cálidas, especiadas, dulces y envolventes ideales para climas templados/fríos o noche.'),
(2, 'Amaderada Aromática', 'Acordes de maderas nobles combinados con hierbas aromáticas y cítricos vibrantes.'),
(3, 'Ámbar Vainilla', 'Fragancias gourmand y sensuales dominadas por vainilla, resinas y acordes dulces.'),
(4, 'Floral Frutal', 'Composiciones luminosas de flores blancas, rosas y frutas jugosas.'),
(5, 'Cítrica Fresca', 'Aromas limpios, energizantes y versátiles para uso diario y oficina.')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 5. Notas Olfativas Base
INSERT INTO `notas_olfativas` (`id`, `nombre`) VALUES
(1, 'Bergamota'),
(2, 'Canela'),
(3, 'Nuez moscada'),
(4, 'Dátiles'),
(5, 'Praliné'),
(6, 'Nardos'),
(7, 'Vainilla'),
(8, 'Haba tonka'),
(9, 'Benjuí'),
(10, 'Mirra'),
(11, 'Pimienta de Sichuan'),
(12, 'Ambroxan'),
(13, 'Lavanda'),
(14, 'Cedro'),
(15, 'Miel'),
(16, 'Tabaco')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 6. Productos de Ejemplo (Con binario WebP placeholder válido de 34 bytes)
INSERT INTO `productos` (
    `id`, `marca_id`, `familia_olfativa_id`, `nombre`, `slug`, `descripcion`,
    `genero`, `concentracion`, `ocasion_uso`,
    `imagen_data`, `imagen_mime`, `imagen_tamano_bytes`, `destacado`, `activo`
) VALUES
(
    1, 1, 1, 'Khamrah', 'lattafa-khamrah-edp',
    'Una fragancia oriental especiada lujosa y envolvente con notas cálidas de canela, dátiles dulces, praliné y un fondo resinoso de vainilla y haba tonka.',
    'Unisex', 'EDP', 'Noche, Citas, Clima Frío',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
),
(
    2, 2, 2, 'Sauvage Eau de Parfum', 'dior-sauvage-edp',
    'Composición fresca y misteriosa con bergamota de Calabria jugosa, pimienta especiada y una estela amaderada de ambroxan y vainilla de Papúa Nueva Guinea.',
    'Hombre', 'EDP', 'Uso diario, Oficina, Noche',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
),
(
    3, 4, 3, 'Le Male Elixir', 'jean-paul-gaultier-le-male-elixir-parfum',
    'Un elixir intenso y adictivo que combina lavanda aromática con la riqueza cálida del haba tonka, miel dorada y tabaco.',
    'Hombre', 'Parfum', 'Fiesta, Noche, Ocasiones Especiales',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 7. Pirámide Olfativa de los Productos Semilla
INSERT INTO `piramide_olfativa` (`producto_id`, `nota_id`, `tipo_etapa`) VALUES
-- Lattafa Khamrah
(1, 1, 'Salida'), (1, 2, 'Salida'), (1, 3, 'Salida'),
(1, 4, 'Corazón'), (1, 5, 'Corazón'), (1, 6, 'Corazón'),
(1, 7, 'Fondo'), (1, 8, 'Fondo'), (1, 9, 'Fondo'), (1, 10, 'Fondo'),
-- Dior Sauvage EDP
(2, 1, 'Salida'),
(2, 11, 'Corazón'), (2, 13, 'Corazón'), (2, 3, 'Corazón'),
(2, 12, 'Fondo'), (2, 7, 'Fondo'), (2, 14, 'Fondo'),
-- JPG Le Male Elixir
(3, 13, 'Salida'),
(3, 7, 'Corazón'), (3, 9, 'Corazón'),
(3, 15, 'Fondo'), (3, 8, 'Fondo'), (3, 16, 'Fondo')
ON DUPLICATE KEY UPDATE `tipo_etapa` = VALUES(`tipo_etapa`);

-- 8. Variantes y Precios en Pesos Colombianos (COP)
INSERT INTO `variantes_producto` (`id`, `producto_id`, `tamano_ml`, `tipo_presentacion`, `sku`, `precio_base`, `disponible`) VALUES
(1, 1, 100, 'Regular', 'LAT-KHA-100-REG', 195000.00, TRUE),
(2, 1, 10, 'Decant', 'LAT-KHA-010-DEC', 28000.00, TRUE),
(3, 2, 100, 'Regular', 'DIO-SAU-100-REG', 620000.00, TRUE),
(4, 2, 100, 'Tester', 'DIO-SAU-100-TST', 510000.00, TRUE),
(5, 2, 10, 'Decant', 'DIO-SAU-010-DEC', 68000.00, TRUE),
(6, 3, 125, 'Regular', 'JPG-LME-125-REG', 580000.00, TRUE),
(7, 3, 10, 'Decant', 'JPG-LME-010-DEC', 62000.00, TRUE)
ON DUPLICATE KEY UPDATE `precio_base` = VALUES(`precio_base`);

-- 9. Promoción de Ejemplo Vigente
INSERT INTO `promociones` (`id`, `nombre`, `tipo_descuento`, `valor_descuento`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, 'Oferta Especial Perfumería Árabe', 'Porcentaje', 10.00, '2025-01-01 00:00:00', '2027-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `promocion_variantes` (`promocion_id`, `variante_id`) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE `variante_id` = VALUES(`variante_id`);
