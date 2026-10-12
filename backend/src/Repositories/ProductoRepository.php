<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Core\HttpException;
use App\Entities\PerfumeEnums;
use App\Entities\PiramideOlfativaEntity;
use App\Entities\ProductoEntity;
use App\Services\SlugService;
use PDO;
use Throwable;

final class ProductoRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Lista los productos del catálogo paginados y filtrados.
     * PROHIBIDO SELECT *: Excluye estrictamente la columna `p.imagen_data`.
     */
    public function listCatalog(array $filters = [], bool $includeInactive = false): array
    {
        $where = [];
        $params = [];

        if (!$includeInactive) {
            $where[] = 'p.activo = 1';
            $where[] = 'm.activo = 1';
        } elseif (isset($filters['activo']) && $filters['activo'] !== '') {
            $where[] = 'p.activo = :activo';
            $params[':activo'] = (int) filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN);
        }

        if (!empty($filters['marca'])) {
            if (is_numeric($filters['marca'])) {
                $where[] = 'p.marca_id = :marca_id';
                $params[':marca_id'] = (int) $filters['marca'];
            } else {
                $where[] = 'm.slug = :marca_slug';
                $params[':marca_slug'] = (string) $filters['marca'];
            }
        }

        if (!empty($filters['familia'])) {
            $where[] = 'p.familia_olfativa_id = :familia_id';
            $params[':familia_id'] = (int) $filters['familia'];
        }

        if (!empty($filters['genero']) && PerfumeEnums::isValidGenero((string) $filters['genero'])) {
            $where[] = 'p.genero = :genero';
            $params[':genero'] = (string) $filters['genero'];
        }

        if (!empty($filters['concentracion']) && PerfumeEnums::isValidConcentracion((string) $filters['concentracion'])) {
            $where[] = 'p.concentracion = :concentracion';
            $params[':concentracion'] = (string) $filters['concentracion'];
        }

        if (isset($filters['destacado']) && $filters['destacado'] !== '') {
            $where[] = 'p.destacado = :destacado';
            $params[':destacado'] = (int) filter_var($filters['destacado'], FILTER_VALIDATE_BOOLEAN);
        }

        if (!empty($filters['nota'])) {
            $where[] = 'EXISTS (
                SELECT 1 FROM piramide_olfativa po
                WHERE po.producto_id = p.id AND po.nota_id = :nota_id
            )';
            $params[':nota_id'] = (int) $filters['nota'];
        }

        if (!empty($filters['tipo_presentacion']) && PerfumeEnums::isValidTipoPresentacion((string) $filters['tipo_presentacion'])) {
            $where[] = 'EXISTS (
                SELECT 1 FROM variantes_producto vp
                WHERE vp.producto_id = p.id AND vp.disponible = 1 AND vp.tipo_presentacion = :tipo_presentacion
            )';
            $params[':tipo_presentacion'] = (string) $filters['tipo_presentacion'];
        }

        if (isset($filters['precio_min']) && is_numeric($filters['precio_min'])) {
            $where[] = 'EXISTS (
                SELECT 1 FROM variantes_producto vp
                WHERE vp.producto_id = p.id AND vp.disponible = 1 AND vp.precio_base >= :precio_min
            )';
            $params[':precio_min'] = (float) $filters['precio_min'];
        }

        if (isset($filters['precio_max']) && is_numeric($filters['precio_max'])) {
            $where[] = 'EXISTS (
                SELECT 1 FROM variantes_producto vp
                WHERE vp.producto_id = p.id AND vp.disponible = 1 AND vp.precio_base <= :precio_max
            )';
            $params[':precio_max'] = (float) $filters['precio_max'];
        }

        if (!empty($filters['q'])) {
            $q = '%' . trim((string) $filters['q']) . '%';
            $where[] = '(
                p.nombre LIKE :q1
                OR m.nombre LIKE :q2
                OR p.descripcion LIKE :q3
                OR EXISTS (
                    SELECT 1 FROM piramide_olfativa po
                    INNER JOIN notas_olfativas no ON no.id = po.nota_id
                    WHERE po.producto_id = p.id AND no.nombre LIKE :q4
                )
            )';
            $params[':q1'] = $q;
            $params[':q2'] = $q;
            $params[':q3'] = $q;
            $params[':q4'] = $q;
        }

        $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countSql = "
            SELECT COUNT(p.id)
            FROM productos p
            INNER JOIN marcas m ON m.id = p.marca_id
            LEFT JOIN familias_olfativas f ON f.id = p.familia_olfativa_id
            {$whereSql}
        ";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 12)));
        $offset = ($page - 1) * $perPage;

        $orderSql = match ((string) ($filters['orden'] ?? 'destacados')) {
            'precio_asc'  => '(SELECT MIN(vp.precio_base) FROM variantes_producto vp WHERE vp.producto_id = p.id AND vp.disponible = 1) ASC, p.id DESC',
            'precio_desc' => '(SELECT MIN(vp.precio_base) FROM variantes_producto vp WHERE vp.producto_id = p.id AND vp.disponible = 1) DESC, p.id DESC',
            'nombre_asc'  => 'p.nombre ASC',
            'recientes'   => 'p.created_at DESC, p.id DESC',
            default       => 'p.destacado DESC, p.id DESC',
        };

        // NUNCA seleccionar p.imagen_data en listados
        $sql = "
            SELECT
                p.id,
                p.marca_id,
                p.familia_olfativa_id,
                p.nombre,
                p.slug,
                p.descripcion,
                p.genero,
                p.concentracion,
                p.ocasion_uso,
                p.imagen_mime,
                p.imagen_tamano_bytes,
                p.destacado,
                p.activo,
                p.created_at,
                p.updated_at,
                m.nombre AS marca_nombre,
                m.slug AS marca_slug,
                f.nombre AS familia_nombre
            FROM productos p
            INNER JOIN marcas m ON m.id = p.marca_id
            LEFT JOIN familias_olfativas f ON f.id = p.familia_olfativa_id
            {$whereSql}
            ORDER BY {$orderSql}
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        if (empty($rows)) {
            return [
                'items'      => [],
                'pagination' => [
                    'total'       => $total,
                    'page'        => $page,
                    'per_page'    => $perPage,
                    'total_pages' => (int) ceil($total / $perPage),
                ],
            ];
        }

        $productIds = array_map(static fn(array $r): int => (int) $r['id'], $rows);
        $variantesByProduct = $this->loadVariantesWithPromosForProducts($productIds, $includeInactive);

        $items = [];
        foreach ($rows as $row) {
            $pid = (int) $row['id'];
            $items[] = ProductoEntity::formatRow($row, $variantesByProduct[$pid] ?? [], null);
        }

        return [
            'items'      => $items,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    /**
     * Obtiene el detalle completo de un producto por su slug o ID, incluyendo
     * su Pirámide Olfativa agrupada por etapa (Salida, Corazón, Fondo) y sus Variantes.
     * Excluye estrictamente `p.imagen_data`.
     */
    public function findBySlugOrId(string|int $identifier, bool $includeInactive = false): ?array
    {
        $isNumeric = is_int($identifier) || ctype_digit((string) $identifier);
        $condition = $isNumeric ? 'p.id = :ident' : 'p.slug = :ident';
        $activeFilter = $includeInactive ? '' : 'AND p.activo = 1 AND m.activo = 1';

        $sql = "
            SELECT
                p.id,
                p.marca_id,
                p.familia_olfativa_id,
                p.nombre,
                p.slug,
                p.descripcion,
                p.genero,
                p.concentracion,
                p.ocasion_uso,
                p.imagen_mime,
                p.imagen_tamano_bytes,
                p.destacado,
                p.activo,
                p.created_at,
                p.updated_at,
                m.nombre AS marca_nombre,
                m.slug AS marca_slug,
                f.nombre AS familia_nombre
            FROM productos p
            INNER JOIN marcas m ON m.id = p.marca_id
            LEFT JOIN familias_olfativas f ON f.id = p.familia_olfativa_id
            WHERE {$condition} {$activeFilter}
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':ident', $isNumeric ? (int) $identifier : (string) $identifier);
        $stmt->execute();

        $row = $stmt->fetch();
        if (!is_array($row)) {
            return null;
        }

        $productId = (int) $row['id'];
        $variantesMap = $this->loadVariantesWithPromosForProducts([$productId], $includeInactive);
        $piramide = $this->loadPiramideForProduct($productId);

        return ProductoEntity::formatRow($row, $variantesMap[$productId] ?? [], $piramide);
    }

    /**
     * Consulta dedicada exclusivamente para el endpoint GET /api/productos/{id}/imagen.
     * Solo extrae el binario WebP y sus metadatos para minimizar memoria.
     */
    public function getBinaryImageById(int $id): ?array
    {
        $stmt = $this->db->prepare('
            SELECT id, imagen_data, imagen_mime, imagen_tamano_bytes, updated_at
            FROM productos
            WHERE id = :id
            LIMIT 1
        ');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return is_array($row) ? $row : null;
    }

    /**
     * Crea un producto junto con su binario WebP, su pirámide olfativa y sus variantes en una transacción.
     */
    public function create(array $data, array $webpImage, array $piramideItems = [], array $variantesItems = []): array
    {
        $this->validateProductPayload($data);

        $slug = !empty($data['slug'])
            ? SlugService::slugify((string) $data['slug'])
            : $this->generateUniqueSlug((string) $data['nombre'], (string) ($data['concentracion'] ?? ''));

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('
                INSERT INTO productos (
                    marca_id, familia_olfativa_id, nombre, slug, descripcion,
                    genero, concentracion, ocasion_uso,
                    imagen_data, imagen_mime, imagen_tamano_bytes,
                    destacado, activo
                ) VALUES (
                    :marca_id, :familia_olfativa_id, :nombre, :slug, :descripcion,
                    :genero, :concentracion, :ocasion_uso,
                    :imagen_data, :imagen_mime, :imagen_tamano_bytes,
                    :destacado, :activo
                )
            ');

            $stmt->bindValue(':marca_id', (int) $data['marca_id'], PDO::PARAM_INT);
            $stmt->bindValue(
                ':familia_olfativa_id',
                !empty($data['familia_olfativa_id']) ? (int) $data['familia_olfativa_id'] : null,
                !empty($data['familia_olfativa_id']) ? PDO::PARAM_INT : PDO::PARAM_NULL
            );
            $stmt->bindValue(':nombre', trim((string) $data['nombre']));
            $stmt->bindValue(':slug', $slug);
            $stmt->bindValue(':descripcion', isset($data['descripcion']) ? trim((string) $data['descripcion']) : null);
            $stmt->bindValue(':genero', (string) $data['genero']);
            $stmt->bindValue(':concentracion', (string) $data['concentracion']);
            $stmt->bindValue(':ocasion_uso', isset($data['ocasion_uso']) ? trim((string) $data['ocasion_uso']) : null);
            $stmt->bindValue(':imagen_data', $webpImage['data'], PDO::PARAM_LOB);
            $stmt->bindValue(':imagen_mime', $webpImage['mime']);
            $stmt->bindValue(':imagen_tamano_bytes', (int) $webpImage['size'], PDO::PARAM_INT);
            $stmt->bindValue(':destacado', (int) filter_var($data['destacado'] ?? false, FILTER_VALIDATE_BOOLEAN), PDO::PARAM_INT);
            $stmt->bindValue(':activo', (int) filter_var($data['activo'] ?? true, FILTER_VALIDATE_BOOLEAN), PDO::PARAM_INT);
            $stmt->execute();

            $productId = (int) $this->db->lastInsertId();

            if (!empty($piramideItems)) {
                $this->syncPiramideInternal($productId, $piramideItems);
            }

            if (!empty($variantesItems)) {
                $this->syncVariantesInternal($productId, $variantesItems);
            }

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            if ($e instanceof HttpException) {
                throw $e;
            }
            throw new HttpException('Error al crear el producto: ' . $e->getMessage(), 422);
        }

        return (array) $this->findBySlugOrId($productId, true);
    }

    /**
     * Actualiza un producto, reemplazando opcionalmente el binario WebP, su pirámide olfativa y sus variantes.
     */
    public function update(
        int $id,
        array $data,
        ?array $webpImage = null,
        ?array $piramideItems = null,
        ?array $variantesItems = null
    ): array {
        $existing = $this->findBySlugOrId($id, true);
        if ($existing === null) {
            throw new HttpException('El producto solicitado no existe.', 404);
        }

        $merged = [
            'marca_id'            => $data['marca_id'] ?? $existing['marca']['id'],
            'familia_olfativa_id' => array_key_exists('familia_olfativa_id', $data)
                ? $data['familia_olfativa_id']
                : ($existing['familia_olfativa']['id'] ?? null),
            'nombre'              => $data['nombre'] ?? $existing['nombre'],
            'slug'                => !empty($data['slug']) ? SlugService::slugify((string) $data['slug']) : $existing['slug'],
            'descripcion'         => array_key_exists('descripcion', $data) ? $data['descripcion'] : $existing['descripcion'],
            'genero'              => $data['genero'] ?? $existing['genero'],
            'concentracion'       => $data['concentracion'] ?? $existing['concentracion'],
            'ocasion_uso'         => array_key_exists('ocasion_uso', $data) ? $data['ocasion_uso'] : $existing['ocasion_uso'],
            'destacado'           => array_key_exists('destacado', $data) ? $data['destacado'] : $existing['destacado'],
            'activo'              => array_key_exists('activo', $data) ? $data['activo'] : $existing['activo'],
        ];

        $this->validateProductPayload($merged);

        $this->db->beginTransaction();
        try {
            $imageSql = $webpImage !== null
                ? ', imagen_data = :imagen_data, imagen_mime = :imagen_mime, imagen_tamano_bytes = :imagen_tamano_bytes'
                : '';

            $stmt = $this->db->prepare("
                UPDATE productos SET
                    marca_id = :marca_id,
                    familia_olfativa_id = :familia_olfativa_id,
                    nombre = :nombre,
                    slug = :slug,
                    descripcion = :descripcion,
                    genero = :genero,
                    concentracion = :concentracion,
                    ocasion_uso = :ocasion_uso,
                    destacado = :destacado,
                    activo = :activo
                    {$imageSql}
                WHERE id = :id
            ");

            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':marca_id', (int) $merged['marca_id'], PDO::PARAM_INT);
            $stmt->bindValue(
                ':familia_olfativa_id',
                !empty($merged['familia_olfativa_id']) ? (int) $merged['familia_olfativa_id'] : null,
                !empty($merged['familia_olfativa_id']) ? PDO::PARAM_INT : PDO::PARAM_NULL
            );
            $stmt->bindValue(':nombre', trim((string) $merged['nombre']));
            $stmt->bindValue(':slug', (string) $merged['slug']);
            $stmt->bindValue(':descripcion', $merged['descripcion'] !== null ? trim((string) $merged['descripcion']) : null);
            $stmt->bindValue(':genero', (string) $merged['genero']);
            $stmt->bindValue(':concentracion', (string) $merged['concentracion']);
            $stmt->bindValue(':ocasion_uso', $merged['ocasion_uso'] !== null ? trim((string) $merged['ocasion_uso']) : null);
            $stmt->bindValue(':destacado', (int) filter_var($merged['destacado'], FILTER_VALIDATE_BOOLEAN), PDO::PARAM_INT);
            $stmt->bindValue(':activo', (int) filter_var($merged['activo'], FILTER_VALIDATE_BOOLEAN), PDO::PARAM_INT);

            if ($webpImage !== null) {
                $stmt->bindValue(':imagen_data', $webpImage['data'], PDO::PARAM_LOB);
                $stmt->bindValue(':imagen_mime', $webpImage['mime']);
                $stmt->bindValue(':imagen_tamano_bytes', (int) $webpImage['size'], PDO::PARAM_INT);
            }

            $stmt->execute();

            if ($piramideItems !== null) {
                $this->syncPiramideInternal($id, $piramideItems);
            }

            if ($variantesItems !== null) {
                $this->syncVariantesInternal($id, $variantesItems);
            }

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            if ($e instanceof HttpException) {
                throw $e;
            }
            throw new HttpException('Error al actualizar el producto: ' . $e->getMessage(), 422);
        }

        return (array) $this->findBySlugOrId($id, true);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM productos WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new HttpException('El producto no existe.', 404);
        }
    }

    /**
     * Carga en bloque todas las variantes de un conjunto de productos junto con su mejor promoción vigente.
     *
     * @param int[] $productIds
     * @return array<int, array<int, array>>
     */
    private function loadVariantesWithPromosForProducts(array $productIds, bool $includeUnavailable = false): array
    {
        if (empty($productIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $dispSql = $includeUnavailable ? '' : 'AND vp.disponible = 1';

        $sql = "
            SELECT
                vp.id,
                vp.producto_id,
                vp.tamano_ml,
                vp.tipo_presentacion,
                vp.sku,
                vp.precio_base,
                vp.disponible,
                pr.id AS promo_id,
                pr.nombre AS promo_nombre,
                pr.tipo_descuento AS promo_tipo,
                pr.valor_descuento AS promo_valor,
                pr.fecha_inicio AS promo_inicio,
                pr.fecha_fin AS promo_fin
            FROM variantes_producto vp
            LEFT JOIN promocion_variantes pv ON pv.variante_id = vp.id
            LEFT JOIN promociones pr ON pr.id = pv.promocion_id
                AND pr.activo = 1
                AND NOW() BETWEEN pr.fecha_inicio AND pr.fecha_fin
            WHERE vp.producto_id IN ({$placeholders}) {$dispSql}
            ORDER BY vp.precio_base ASC, vp.tamano_ml ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($productIds));
        $rows = $stmt->fetchAll();

        $grouped = [];
        $seenVariantIds = [];

        foreach ($rows as $row) {
            $pid = (int) $row['producto_id'];
            $vid = (int) $row['id'];

            // Si una variante tiene más de una promoción vigente, conservamos la primera/mejor encontrada
            if (isset($seenVariantIds[$vid])) {
                continue;
            }
            $seenVariantIds[$vid] = true;

            $row['promocion_activa'] = !empty($row['promo_id']) ? [
                'id'              => (int) $row['promo_id'],
                'nombre'          => (string) $row['promo_nombre'],
                'tipo_descuento'  => (string) $row['promo_tipo'],
                'valor_descuento' => (float) $row['promo_valor'],
                'fecha_inicio'    => (string) $row['promo_inicio'],
                'fecha_fin'       => (string) $row['promo_fin'],
            ] : null;

            $grouped[$pid][] = $row;
        }

        return $grouped;
    }

    /**
     * Carga la pirámide olfativa de un producto agrupada por etapas: Salida, Corazón y Fondo.
     */
    private function loadPiramideForProduct(int $productId): array
    {
        $stmt = $this->db->prepare('
            SELECT
                po.id,
                po.nota_id,
                po.tipo_etapa,
                no.nombre AS nota_nombre
            FROM piramide_olfativa po
            INNER JOIN notas_olfativas no ON no.id = po.nota_id
            WHERE po.producto_id = :producto_id
            ORDER BY FIELD(po.tipo_etapa, "Salida", "Corazón", "Fondo"), no.nombre ASC
        ');
        $stmt->execute([':producto_id' => $productId]);
        $rows = $stmt->fetchAll();

        $piramide = [
            'Salida'  => [],
            'Corazón' => [],
            'Fondo'   => [],
        ];

        foreach ($rows as $row) {
            $row['producto_id'] = $productId;
            $entity = PiramideOlfativaEntity::fromArray($row);
            $piramide[$entity->tipoEtapa][] = $entity->toArray();
        }

        return $piramide;
    }

    private function syncPiramideInternal(int $productId, array $piramideItems): void
    {
        $del = $this->db->prepare('DELETE FROM piramide_olfativa WHERE producto_id = :producto_id');
        $del->execute([':producto_id' => $productId]);

        $ins = $this->db->prepare('
            INSERT IGNORE INTO piramide_olfativa (producto_id, nota_id, tipo_etapa)
            VALUES (:producto_id, :nota_id, :tipo_etapa)
        ');

        foreach ($piramideItems as $item) {
            if (!is_array($item)) {
                continue;
            }
            $notaId = (int) ($item['nota_id'] ?? 0);
            $etapa = (string) ($item['tipo_etapa'] ?? '');

            if ($notaId <= 0 || !PerfumeEnums::isValidEtapaPiramide($etapa)) {
                throw new HttpException("Nota olfativa o etapa inválida en la pirámide ({$etapa}).", 422);
            }

            $ins->execute([
                ':producto_id' => $productId,
                ':nota_id'     => $notaId,
                ':tipo_etapa'  => $etapa,
            ]);
        }
    }

    private function syncVariantesInternal(int $productId, array $variantesItems): void
    {
        foreach ($variantesItems as $var) {
            if (!is_array($var)) {
                continue;
            }
            $tamanoMl = (int) ($var['tamano_ml'] ?? 0);
            $tipo = (string) ($var['tipo_presentacion'] ?? 'Regular');
            $precioBase = (float) ($var['precio_base'] ?? -1);
            $sku = !empty($var['sku']) ? trim((string) $var['sku']) : null;
            $disponible = (int) filter_var($var['disponible'] ?? true, FILTER_VALIDATE_BOOLEAN);

            if ($tamanoMl <= 0 || $precioBase < 0 || !PerfumeEnums::isValidTipoPresentacion($tipo)) {
                throw new HttpException('Datos de variante inválidos (tamaño ml, precio base o presentación).', 422);
            }

            if (!empty($var['id'])) {
                $upd = $this->db->prepare('
                    UPDATE variantes_producto
                    SET tamano_ml = :tamano_ml,
                        tipo_presentacion = :tipo,
                        sku = :sku,
                        precio_base = :precio_base,
                        disponible = :disponible
                    WHERE id = :id AND producto_id = :producto_id
                ');
                $upd->execute([
                    ':id'          => (int) $var['id'],
                    ':producto_id' => $productId,
                    ':tamano_ml'   => $tamanoMl,
                    ':tipo'        => $tipo,
                    ':sku'         => $sku,
                    ':precio_base' => $precioBase,
                    ':disponible'  => $disponible,
                ]);
            } else {
                $ins = $this->db->prepare('
                    INSERT INTO variantes_producto (producto_id, tamano_ml, tipo_presentacion, sku, precio_base, disponible)
                    VALUES (:producto_id, :tamano_ml, :tipo, :sku, :precio_base, :disponible)
                ');
                $ins->execute([
                    ':producto_id' => $productId,
                    ':tamano_ml'   => $tamanoMl,
                    ':tipo'        => $tipo,
                    ':sku'         => $sku,
                    ':precio_base' => $precioBase,
                    ':disponible'  => $disponible,
                ]);
            }
        }
    }

    private function validateProductPayload(array $data): void
    {
        if (empty($data['marca_id']) || (int) $data['marca_id'] <= 0) {
            throw new HttpException('El campo marca_id es obligatorio.', 422);
        }
        if (empty($data['nombre']) || trim((string) $data['nombre']) === '') {
            throw new HttpException('El nombre del producto es obligatorio.', 422);
        }
        $genero = (string) ($data['genero'] ?? '');
        if (!PerfumeEnums::isValidGenero($genero)) {
            throw new HttpException('Género inválido. Valores permitidos: ' . implode(', ', PerfumeEnums::GENEROS), 422);
        }
        $concentracion = (string) ($data['concentracion'] ?? '');
        if (!PerfumeEnums::isValidConcentracion($concentracion)) {
            throw new HttpException(
                'Concentración inválida. Valores permitidos: ' . implode(', ', PerfumeEnums::CONCENTRACIONES),
                422
            );
        }
    }

    private function generateUniqueSlug(string $nombre, string $concentracion): string
    {
        $base = SlugService::slugify("{$nombre} {$concentracion}");
        $slug = $base;
        $counter = 2;

        while (true) {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM productos WHERE slug = :slug');
            $stmt->execute([':slug' => $slug]);
            if ((int) $stmt->fetchColumn() === 0) {
                return $slug;
            }
            $slug = "{$base}-{$counter}";
            $counter++;
        }
    }
}
