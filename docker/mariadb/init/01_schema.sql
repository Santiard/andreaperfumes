-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: ANDREA PERFUMES (MariaDB 11)
-- Implementación fiel del Modelo Entidad-Relación (MER)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. MARCAS (Brands)
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

-- 2. FAMILIAS_OLFATIVAS (Olfactory Families)
CREATE TABLE IF NOT EXISTS `familias_olfativas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_familias_olfativas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 3. NOTAS_OLFATIVAS (Fragrance Notes)
CREATE TABLE IF NOT EXISTS `notas_olfativas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notas_olfativas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 4. PRODUCTOS (Products - Con binario WebP embebido 1:1)
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
    `imagen_data` MEDIUMBLOB NOT NULL COMMENT 'Binario comprimido en formato WebP (80-150 KB)',
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
    CONSTRAINT `fk_productos_marca`
        FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_productos_familia_olfativa`
        FOREIGN KEY (`familia_olfativa_id`) REFERENCES `familias_olfativas` (`id`)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 5. PIRAMIDE_OLFATIVA (Composición de Notas N:M con etapa)
CREATE TABLE IF NOT EXISTS `piramide_olfativa` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `producto_id` INT UNSIGNED NOT NULL,
    `nota_id` INT UNSIGNED NOT NULL,
    `tipo_etapa` ENUM('Salida', 'Corazón', 'Fondo') NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_piramide_producto_nota_etapa` (`producto_id`, `nota_id`, `tipo_etapa`),
    KEY `idx_piramide_nota` (`nota_id`),
    CONSTRAINT `fk_piramide_producto`
        FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `fk_piramide_nota`
        FOREIGN KEY (`nota_id`) REFERENCES `notas_olfativas` (`id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 6. VARIANTES_PRODUCTO (Presentaciones y Precios en COP)
CREATE TABLE IF NOT EXISTS `variantes_producto` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `producto_id` INT UNSIGNED NOT NULL,
    `tamano_ml` INT UNSIGNED NOT NULL COMMENT 'Ej. 5, 10, 50, 100, 200',
    `tipo_presentacion` ENUM('Regular', 'Tester', 'Decant') NOT NULL DEFAULT 'Regular',
    `sku` VARCHAR(50) NULL,
    `precio_base` DECIMAL(12, 2) NOT NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_variantes_sku` (`sku`),
    KEY `idx_variantes_producto_disp_precio` (`producto_id`, `disponible`, `precio_base`),
    CONSTRAINT `fk_variantes_producto`
        FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 7. PROMOCIONES (Promociones / Descuentos)
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

-- 8. PROMOCION_VARIANTES (Detalle de Promociones N:M)
CREATE TABLE IF NOT EXISTS `promocion_variantes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promocion_id` INT UNSIGNED NOT NULL,
    `variante_id` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_promocion_variante` (`promocion_id`, `variante_id`),
    KEY `idx_promocion_variantes_variante` (`variante_id`),
    CONSTRAINT `fk_promocion_variantes_promocion`
        FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `fk_promocion_variantes_variante`
        FOREIGN KEY (`variante_id`) REFERENCES `variantes_producto` (`id`)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 9. CONFIGURACION_CONTACTO (WhatsApp y Mensajes)
CREATE TABLE IF NOT EXISTS `configuracion_contacto` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `numero_whatsapp` VARCHAR(20) NOT NULL,
    `mensaje_plantilla` TEXT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- 10. USUARIOS_ADMIN (Panel de Administración)
CREATE TABLE IF NOT EXISTS `usuarios_admin` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_usuarios_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
