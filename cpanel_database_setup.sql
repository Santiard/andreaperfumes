-- =============================================================================
-- BASE DE DATOS DREA PERFUMES (CPANEL PRODUCTION SETUP)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. MARCAS
CREATE TABLE IF NOT EXISTS `marcas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `descripcion` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_marcas_nombre` (`nombre`),
    UNIQUE KEY `uk_marcas_slug` (`slug`),
    KEY `idx_marcas_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 2. FAMILIAS OLFATIVAS
CREATE TABLE IF NOT EXISTS `familias_olfativas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_familias_olfativas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 3. NOTAS OLFATIVAS
CREATE TABLE IF NOT EXISTS `notas_olfativas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notas_olfativas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 4. PRODUCTOS
CREATE TABLE IF NOT EXISTS `productos` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `marca_id` INT UNSIGNED NOT NULL,
    `familia_olfativa_id` INT UNSIGNED NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `descripcion` TEXT NULL,
    `genero` ENUM('Hombre', 'Mujer', 'Unisex') NOT NULL,
    `concentracion` ENUM('EDT', 'EDP', 'Parfum', 'Extrait de Parfum', 'EDC', 'Fraiche') NOT NULL,
    `ocasion_uso` VARCHAR(150) NULL,
    `imagen_data` MEDIUMBLOB NOT NULL COMMENT 'Binario WebP',
    `imagen_mime` VARCHAR(30) NOT NULL DEFAULT 'image/webp',
    `imagen_tamano_bytes` INT UNSIGNED NOT NULL,
    `destacado` BOOLEAN NOT NULL DEFAULT FALSE,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_productos_slug` (`slug`),
    KEY `idx_productos_marca` (`marca_id`),
    KEY `idx_productos_familia` (`familia_olfativa_id`),
    KEY `idx_productos_catalogo` (`activo`, `genero`, `destacado`),
    KEY `idx_productos_concentracion` (`concentracion`),
    CONSTRAINT `fk_productos_marca` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_productos_familia_olfativa` FOREIGN KEY (`familia_olfativa_id`) REFERENCES `familias_olfativas` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 5. PIRAMIDE OLFATIVA
CREATE TABLE IF NOT EXISTS `piramide_olfativa` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `producto_id` INT UNSIGNED NOT NULL,
    `nota_id` INT UNSIGNED NOT NULL,
    `tipo_etapa` ENUM('Salida', 'Corazón', 'Fondo') NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_piramide_producto_nota_etapa` (`producto_id`, `nota_id`, `tipo_etapa`),
    KEY `idx_piramide_nota` (`nota_id`),
    CONSTRAINT `fk_piramide_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `fk_piramide_nota` FOREIGN KEY (`nota_id`) REFERENCES `notas_olfativas` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 6. VARIANTES PRODUCTO
CREATE TABLE IF NOT EXISTS `variantes_producto` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `producto_id` INT UNSIGNED NOT NULL,
    `tamano_ml` INT UNSIGNED NOT NULL,
    `tipo_presentacion` ENUM('Regular', 'Kit') NOT NULL DEFAULT 'Regular',
    `sku` VARCHAR(50) NULL,
    `precio_base` DECIMAL(12, 2) NOT NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_variantes_sku` (`sku`),
    KEY `idx_variantes_producto_disp_precio` (`producto_id`, `disponible`, `precio_base`),
    CONSTRAINT `fk_variantes_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 7. PROMOCIONES
CREATE TABLE IF NOT EXISTS `promociones` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo_descuento` ENUM('Porcentaje', 'Monto_Fijo') NOT NULL,
    `valor_descuento` DECIMAL(10, 2) NOT NULL,
    `fecha_inicio` DATETIME NOT NULL,
    `fecha_fin` DATETIME NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    KEY `idx_promociones_vigencia` (`activo`, `fecha_inicio`, `fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 8. PROMOCION VARIANTES
CREATE TABLE IF NOT EXISTS `promocion_variantes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promocion_id` INT UNSIGNED NOT NULL,
    `variante_id` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_promocion_variante` (`promocion_id`, `variante_id`),
    KEY `idx_promocion_variantes_variante` (`variante_id`),
    CONSTRAINT `fk_promocion_variantes_promocion` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `fk_promocion_variantes_variante` FOREIGN KEY (`variante_id`) REFERENCES `variantes_producto` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 9. CONFIGURACION CONTACTO
CREATE TABLE IF NOT EXISTS `configuracion_contacto` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `numero_whatsapp` VARCHAR(20) NOT NULL,
    `mensaje_plantilla` TEXT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 10. USUARIOS ADMIN
CREATE TABLE IF NOT EXISTS `usuarios_admin` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_usuarios_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- =============================================================================
-- DATOS INICIALES (SEMILLA)
-- =============================================================================

-- Usuario Administrador (email: admin@dreaperfumes.com | pass: password)
INSERT INTO `usuarios_admin` (`id`, `nombre`, `email`, `password_hash`, `activo`) VALUES
(1, 'Administración DREA PERFUMES', 'admin@dreaperfumes.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Contacto WhatsApp DREA
INSERT INTO `configuracion_contacto` (`id`, `numero_whatsapp`, `mensaje_plantilla`, `activo`) VALUES
(1, '573207683734', '¡Hola *DREA PERFUMES*! ✨\nMe interesa realizar el siguiente pedido desde el catálogo web:\n\n{detalle_pedido}\n\n💰 *Total estimado:* {total_cop}\n\n¿Me confirmas disponibilidad en Cúcuta / envío nacional y medios de pago? ¡Gracias!', TRUE)
ON DUPLICATE KEY UPDATE `numero_whatsapp` = VALUES(`numero_whatsapp`);

-- Marcas
INSERT INTO `marcas` (`id`, `nombre`, `slug`, `descripcion`, `activo`) VALUES
(1, 'Lattafa', 'lattafa', 'Casa de alta perfumería árabe con fragancias intensas y duraderas.', TRUE),
(2, 'Dior', 'dior', 'Casa francesa icónica de perfumería de diseñador y alta costura.', TRUE),
(3, 'Chanel', 'chanel', 'Elegancia atemporal francesa con composiciones clásicas y modernas.', TRUE),
(4, 'Jean Paul Gaultier', 'jean-paul-gaultier', 'Fragancias audaces, seductoras y con frascos icónicos.', TRUE),
(5, 'Carolina Herrera', 'carolina-herrera', 'Perfumería sofisticada de gran proyección y carácter.', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Familias Olfativas
INSERT INTO `familias_olfativas` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Floral', 'jazmín, rosa y delicadeza elegante'),
(2, 'Cítrica', 'bergamota, mandarina y vitalidad limpia'),
(3, 'Amaderada', 'cedro, sándalo y carácter sobrio'),
(4, 'Oriental', 'ámbar, vainilla y seducción cálida'),
(5, 'Dulce', 'acordes gourmand y presencia envolvente'),
(6, 'Fresca', 'notas acuáticas, verdes y ligereza moderna')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Notas Olfativas
INSERT INTO `notas_olfativas` (`id`, `nombre`) VALUES
(1, 'Bergamota'), (2, 'Canela'), (3, 'Nuez moscada'), (4, 'Dátiles'), (5, 'Praliné'),
(6, 'Nardos'), (7, 'Vainilla'), (8, 'Haba tonka'), (9, 'Benjuí'), (10, 'Mirra'),
(11, 'Pimienta de Sichuan'), (12, 'Ambroxan'), (13, 'Lavanda'), (14, 'Cedro'),
(15, 'Miel'), (16, 'Tabaco'), (17, 'Jazmín'), (18, 'Rosa'), (19, 'Sándalo'), (20, 'Ámbar')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Productos Muestra
INSERT INTO `productos` (
    `id`, `marca_id`, `familia_olfativa_id`, `nombre`, `slug`, `descripcion`,
    `genero`, `concentracion`, `ocasion_uso`,
    `imagen_data`, `imagen_mime`, `imagen_tamano_bytes`, `destacado`, `activo`
) VALUES
(1, 1, 4, 'Khamrah', 'lattafa-khamrah-edp', 'Fragancia oriental especiada lujosa con notas de canela, dátiles y fondo de vainilla.', 'Unisex', 'EDP', 'Noche, Citas, Clima Templado', UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'), 'image/webp', 34, TRUE, TRUE),
(2, 2, 3, 'Sauvage Eau de Parfum', 'dior-sauvage-edp', 'Composición fresca con bergamota de Calabria jugosa y fondo amaderado de ambroxan.', 'Hombre', 'EDP', 'Uso diario, Oficina, Noche', UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'), 'image/webp', 34, TRUE, TRUE),
(3, 4, 5, 'Le Male Elixir', 'jean-paul-gaultier-le-male-elixir-parfum', 'Elixir intenso y adictivo con lavanda, haba tonka, miel dorada y tabaco.', 'Hombre', 'Parfum', 'Fiesta, Noche, Especiales', UNHEX('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700'), 'image/webp', 34, TRUE, TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Variantes Iniciales (Regular y Kits)
INSERT INTO `variantes_producto` (`id`, `producto_id`, `tamano_ml`, `tipo_presentacion`, `sku`, `precio_base`, `disponible`) VALUES
(1, 1, 100, 'Regular', 'LAT-KHA-100-REG', 195000.00, TRUE),
(2, 1, 100, 'Kit', 'LAT-KHA-100-KIT', 245000.00, TRUE),
(3, 2, 100, 'Regular', 'DIO-SAU-100-REG', 620000.00, TRUE),
(4, 2, 200, 'Regular', 'DIO-SAU-200-REG', 850000.00, TRUE),
(6, 3, 125, 'Regular', 'JPG-LME-125-REG', 580000.00, TRUE),
(7, 3, 125, 'Kit', 'JPG-LME-125-KIT', 680000.00, TRUE)
ON DUPLICATE KEY UPDATE `precio_base` = VALUES(`precio_base`);

-- Promoción Sale
INSERT INTO `promociones` (`id`, `nombre`, `tipo_descuento`, `valor_descuento`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, 'Selección Sale DREA', 'Porcentaje', 10.00, '2025-01-01 00:00:00', '2027-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `promocion_variantes` (`promocion_id`, `variante_id`) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE `variante_id` = VALUES(`variante_id`);

SET FOREIGN_KEY_CHECKS = 1;
