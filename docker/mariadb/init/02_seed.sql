-- =============================================================================
-- DATOS SEMILLA INICIALES: DREA PERFUMES (CÚCUTA, COLOMBIA)
-- Alineado con la Propuesta Digital 2026 y Guía Sensorial de Familias Olfativas
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Usuario Administrador Inicial
-- Email: admin@dreaperfumes.com | Contraseña por defecto: password
INSERT INTO `usuarios_admin` (`id`, `nombre`, `email`, `password_hash`, `activo`) VALUES
(1, 'Administración DREA PERFUMES', 'admin@dreaperfumes.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `email` = VALUES(`email`);

-- 2. Configuración de Contacto WhatsApp (Compra Asistida Cúcuta y Envíos Nacionales)
INSERT INTO `configuracion_contacto` (`id`, `numero_whatsapp`, `mensaje_plantilla`, `activo`) VALUES
(1, '573207683734', '¡Hola *DREA PERFUMES*! ✨\nMe interesa realizar el siguiente pedido desde el catálogo web:\n\n{detalle_pedido}\n\n💰 *Total estimado:* {total_cop}\n\n¿Me confirmas disponibilidad en Cúcuta / envío nacional y medios de pago? ¡Gracias!', TRUE)
ON DUPLICATE KEY UPDATE `numero_whatsapp` = VALUES(`numero_whatsapp`), `mensaje_plantilla` = VALUES(`mensaje_plantilla`);

-- 3. Marcas Base
INSERT INTO `marcas` (`id`, `nombre`, `slug`, `descripcion`, `activo`) VALUES
(1, 'Lattafa', 'lattafa', 'Casa de alta perfumería árabe con fragancias intensas y duraderas.', TRUE),
(2, 'Dior', 'dior', 'Casa francesa icónica de perfumería de diseñador y alta costura.', TRUE),
(3, 'Chanel', 'chanel', 'Elegancia atemporal francesa con composiciones clásicas y modernas.', TRUE),
(4, 'Jean Paul Gaultier', 'jean-paul-gaultier', 'Fragancias audaces, seductoras y con frascos icónicos.', TRUE),
(5, 'Carolina Herrera', 'carolina-herrera', 'Perfumería sofisticada de gran proyección y carácter.', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 4. Familias Olfativas Oficiales (Guía Sensorial - Página 6 de la Propuesta Digital)
INSERT INTO `familias_olfativas` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Floral', 'jazmín, rosa y delicadeza elegante'),
(2, 'Cítrica', 'bergamota, mandarina y vitalidad limpia'),
(3, 'Amaderada', 'cedro, sándalo y carácter sobrio'),
(4, 'Oriental', 'ámbar, vainilla y seducción cálida'),
(5, 'Dulce', 'acordes gourmand y presencia envolvente'),
(6, 'Fresca', 'notas acuáticas, verdes y ligereza moderna')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`);

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
(16, 'Tabaco'),
(17, 'Jazmín'),
(18, 'Rosa'),
(19, 'Sándalo'),
(20, 'Ámbar')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 6. Productos de Ejemplo (Con binario WebP placeholder válido de 34 bytes)
INSERT INTO `productos` (
    `id`, `marca_id`, `familia_olfativa_id`, `nombre`, `slug`, `descripcion`,
    `genero`, `concentracion`, `ocasion_uso`,
    `imagen_data`, `imagen_mime`, `imagen_tamano_bytes`, `destacado`, `activo`
) VALUES
(
    1, 1, 4, 'Khamrah', 'lattafa-khamrah-edp',
    'Una fragancia oriental especiada lujosa y envolvente con notas cálidas de canela, dátiles dulces, praliné y un fondo resinoso de vainilla y haba tonka.',
    'Unisex', 'EDP', 'Noche, Citas, Clima Templado/Frío',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
),
(
    2, 2, 3, 'Sauvage Eau de Parfum', 'dior-sauvage-edp',
    'Composición fresca y misteriosa con bergamota de Calabria jugosa, pimienta especiada y una estela amaderada de ambroxan, cedro y vainilla.',
    'Hombre', 'EDP', 'Uso diario, Oficina, Noche',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
),
(
    3, 4, 5, 'Le Male Elixir', 'jean-paul-gaultier-le-male-elixir-parfum',
    'Un elixir intenso y adictivo que combina lavanda aromática con la riqueza cálida del haba tonka, miel dorada y tabaco.',
    'Hombre', 'Parfum', 'Fiesta, Noche, Ocasiones Especiales',
    UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'),
    'image/webp', 34, TRUE, TRUE
)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `familia_olfativa_id` = VALUES(`familia_olfativa_id`);

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

-- 8. Variantes y Precios en Pesos Colombianos (COP) — Solo botellas originales Regular y Kits
INSERT INTO `variantes_producto` (`id`, `producto_id`, `tamano_ml`, `tipo_presentacion`, `sku`, `precio_base`, `disponible`) VALUES
(1, 1, 100, 'Regular', 'LAT-KHA-100-REG', 195000.00, TRUE),
(2, 1, 100, 'Kit', 'LAT-KHA-100-KIT', 245000.00, TRUE),
(3, 2, 100, 'Regular', 'DIO-SAU-100-REG', 620000.00, TRUE),
(4, 2, 200, 'Regular', 'DIO-SAU-200-REG', 850000.00, TRUE),
(6, 3, 125, 'Regular', 'JPG-LME-125-REG', 580000.00, TRUE),
(7, 3, 125, 'Kit', 'JPG-LME-125-KIT', 680000.00, TRUE)
ON DUPLICATE KEY UPDATE
    `tamano_ml` = VALUES(`tamano_ml`),
    `tipo_presentacion` = VALUES(`tipo_presentacion`),
    `sku` = VALUES(`sku`),
    `precio_base` = VALUES(`precio_base`);

-- 9. Promoción de Ejemplo Vigente (Universo "Sale")
INSERT INTO `promociones` (`id`, `nombre`, `tipo_descuento`, `valor_descuento`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, 'Selección Sale DREA', 'Porcentaje', 10.00, '2025-01-01 00:00:00', '2027-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `promocion_variantes` (`promocion_id`, `variante_id`) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE `variante_id` = VALUES(`variante_id`);
