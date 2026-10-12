<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Core\HttpException;
use App\Entities\ConfiguracionContactoEntity;
use App\Entities\FamiliaOlfativaEntity;
use App\Entities\MarcaEntity;
use App\Entities\NotaOlfativaEntity;
use App\Entities\PerfumeEnums;
use App\Entities\ProductoEntity;
use App\Entities\PromocionEntity;
use App\Entities\UsuarioAdminEntity;
use App\Services\PricingService;
use App\Services\SlugService;
use PDO;
use Throwable;

final class CatalogoRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // =========================================================================
    // FILTROS PÚBLICOS DEL CATÁLOGO
    // =========================================================================

    public function getPublicFilters(): array
    {
        $marcas = $this->db->query('
            SELECT m.id, m.nombre, m.slug, COUNT(p.id) AS total_productos
            FROM marcas m
            LEFT JOIN productos p ON p.marca_id = m.id AND p.activo = 1
            WHERE m.activo = 1
            GROUP BY m.id, m.nombre, m.slug
            ORDER BY m.nombre ASC
        ')->fetchAll();

        $familias = $this->db->query('
            SELECT f.id, f.nombre, f.descripcion, COUNT(p.id) AS total_productos
            FROM familias_olfativas f
            LEFT JOIN productos p ON p.familia_olfativa_id = f.id AND p.activo = 1
            GROUP BY f.id, f.nombre, f.descripcion
            ORDER BY f.nombre ASC
        ')->fetchAll();

        $notas = $this->db->query('
            SELECT no.id, no.nombre
            FROM notas_olfativas no
            ORDER BY no.nombre ASC
        ')->fetchAll();

        $rangoPrecios = $this->db->query('
            SELECT
                COALESCE(MIN(vp.precio_base), 0) AS precio_min,
                COALESCE(MAX(vp.precio_base), 0) AS precio_max
            FROM variantes_producto vp
            INNER JOIN productos p ON p.id = vp.producto_id
            WHERE vp.disponible = 1 AND p.activo = 1
        ')->fetch();

        $min = (float) ($rangoPrecios['precio_min'] ?? 0);
        $max = (float) ($rangoPrecios['precio_max'] ?? 0);

        return [
            'marcas'               => $marcas,
            'familias_olfativas'   => $familias,
            'notas_olfativas'      => $notas,
            'generos'              => PerfumeEnums::GENEROS,
            'concentraciones'      => PerfumeEnums::CONCENTRACIONES,
            'tipos_presentacion'   => PerfumeEnums::TIPOS_PRESENTACION,
            'etapas_piramide'      => PerfumeEnums::ETAPAS_PIRAMIDE,
            'rango_precios'        => [
                'min'     => $min,
                'min_cop' => PricingService::formatCop($min),
                'max'     => $max,
                'max_cop' => PricingService::formatCop($max),
            ],
        ];
    }

    // =========================================================================
    // MARCAS (Brands)
    // =========================================================================

    public function listMarcas(bool $onlyActive = false): array
    {
        $sql = $onlyActive
            ? 'SELECT * FROM marcas WHERE activo = 1 ORDER BY nombre ASC'
            : 'SELECT * FROM marcas ORDER BY nombre ASC';
        $rows = $this->db->query($sql)->fetchAll();
        return array_map(static fn(array $r): array => MarcaEntity::fromArray($r)->toArray(), $rows);
    }

    public function createMarca(array $data): array
    {
        $nombre = trim((string) ($data['nombre'] ?? ''));
        if ($nombre === '') {
            throw new HttpException('El nombre de la marca es obligatorio.', 422);
        }
        $slug = !empty($data['slug']) ? SlugService::slugify((string) $data['slug']) : SlugService::slugify($nombre);
        $descripcion = isset($data['descripcion']) ? trim((string) $data['descripcion']) : null;
        $activo = (int) filter_var($data['activo'] ?? true, FILTER_VALIDATE_BOOLEAN);

        $stmt = $this->db->prepare('
            INSERT INTO marcas (nombre, slug, descripcion, activo)
            VALUES (:nombre, :slug, :descripcion, :activo)
        ');
        $stmt->execute([
            ':nombre'      => $nombre,
            ':slug'        => $slug,
            ':descripcion' => $descripcion,
            ':activo'      => $activo,
        ]);

        return $this->getMarcaById((int) $this->db->lastInsertId());
    }

    public function updateMarca(int $id, array $data): array
    {
        $current = $this->getMarcaById($id);
        $nombre = isset($data['nombre']) ? trim((string) $data['nombre']) : $current['nombre'];
        $slug = !empty($data['slug']) ? SlugService::slugify((string) $data['slug']) : $current['slug'];
        $descripcion = array_key_exists('descripcion', $data) ? $data['descripcion'] : $current['descripcion'];
        $activo = array_key_exists('activo', $data)
            ? (int) filter_var($data['activo'], FILTER_VALIDATE_BOOLEAN)
            : (int) $current['activo'];

        $stmt = $this->db->prepare('
            UPDATE marcas SET nombre = :nombre, slug = :slug, descripcion = :descripcion, activo = :activo
            WHERE id = :id
        ');
        $stmt->execute([
            ':id'          => $id,
            ':nombre'      => $nombre,
            ':slug'        => $slug,
            ':descripcion' => $descripcion,
            ':activo'      => $activo,
        ]);

        return $this->getMarcaById($id);
    }

    public function deleteMarca(int $id): void
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM marcas WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable) {
            throw new HttpException('No se puede eliminar la marca porque tiene productos asociados.', 409);
        }
    }

    public function getMarcaById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM marcas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            throw new HttpException('Marca no encontrada.', 404);
        }
        return MarcaEntity::fromArray($row)->toArray();
    }

    // =========================================================================
    // FAMILIAS OLFATIVAS
    // =========================================================================

    public function listFamilias(): array
    {
        $rows = $this->db->query('SELECT * FROM familias_olfativas ORDER BY nombre ASC')->fetchAll();
        return array_map(static fn(array $r): array => FamiliaOlfativaEntity::fromArray($r)->toArray(), $rows);
    }

    public function createFamilia(array $data): array
    {
        $nombre = trim((string) ($data['nombre'] ?? ''));
        if ($nombre === '') {
            throw new HttpException('El nombre de la familia olfativa es obligatorio.', 422);
        }
        $descripcion = isset($data['descripcion']) ? trim((string) $data['descripcion']) : null;

        $stmt = $this->db->prepare('INSERT INTO familias_olfativas (nombre, descripcion) VALUES (:nombre, :descripcion)');
        $stmt->execute([':nombre' => $nombre, ':descripcion' => $descripcion]);

        return $this->getFamiliaById((int) $this->db->lastInsertId());
    }

    public function updateFamilia(int $id, array $data): array
    {
        $current = $this->getFamiliaById($id);
        $nombre = isset($data['nombre']) ? trim((string) $data['nombre']) : $current['nombre'];
        $descripcion = array_key_exists('descripcion', $data) ? $data['descripcion'] : $current['descripcion'];

        $stmt = $this->db->prepare('UPDATE familias_olfativas SET nombre = :nombre, descripcion = :descripcion WHERE id = :id');
        $stmt->execute([':id' => $id, ':nombre' => $nombre, ':descripcion' => $descripcion]);

        return $this->getFamiliaById($id);
    }

    public function deleteFamilia(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM familias_olfativas WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function getFamiliaById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM familias_olfativas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            throw new HttpException('Familia olfativa no encontrada.', 404);
        }
        return FamiliaOlfativaEntity::fromArray($row)->toArray();
    }

    // =========================================================================
    // NOTAS OLFATIVAS
    // =========================================================================

    public function listNotas(): array
    {
        $rows = $this->db->query('SELECT * FROM notas_olfativas ORDER BY nombre ASC')->fetchAll();
        return array_map(static fn(array $r): array => NotaOlfativaEntity::fromArray($r)->toArray(), $rows);
    }

    public function createNota(array $data): array
    {
        $nombre = trim((string) ($data['nombre'] ?? ''));
        if ($nombre === '') {
            throw new HttpException('El nombre de la nota olfativa es obligatorio.', 422);
        }
        $stmt = $this->db->prepare('INSERT INTO notas_olfativas (nombre) VALUES (:nombre)');
        $stmt->execute([':nombre' => $nombre]);

        return $this->getNotaById((int) $this->db->lastInsertId());
    }

    public function updateNota(int $id, array $data): array
    {
        $this->getNotaById($id);
        $nombre = trim((string) ($data['nombre'] ?? ''));
        if ($nombre === '') {
            throw new HttpException('El nombre de la nota olfativa es obligatorio.', 422);
        }
        $stmt = $this->db->prepare('UPDATE notas_olfativas SET nombre = :nombre WHERE id = :id');
        $stmt->execute([':id' => $id, ':nombre' => $nombre]);

        return $this->getNotaById($id);
    }

    public function deleteNota(int $id): void
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM notas_olfativas WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable) {
            throw new HttpException('No se puede eliminar la nota porque está asignada a la pirámide de uno o más perfumes.', 409);
        }
    }

    public function getNotaById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM notas_olfativas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            throw new HttpException('Nota olfativa no encontrada.', 404);
        }
        return NotaOlfativaEntity::fromArray($row)->toArray();
    }

    // =========================================================================
    // VARIANTES DE PRODUCTO Y CHECKOUT WHATSAPP
    // =========================================================================

    public function createVariante(array $data): array
    {
        $productoId = (int) ($data['producto_id'] ?? 0);
        $tamanoMl = (int) ($data['tamano_ml'] ?? 0);
        $tipo = (string) ($data['tipo_presentacion'] ?? 'Regular');
        $precioBase = (float) ($data['precio_base'] ?? -1);
        $sku = !empty($data['sku']) ? trim((string) $data['sku']) : null;
        $disponible = (int) filter_var($data['disponible'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if ($productoId <= 0 || $tamanoMl <= 0 || $precioBase < 0 || !PerfumeEnums::isValidTipoPresentacion($tipo)) {
            throw new HttpException('Datos de variante inválidos.', 422);
        }

        $stmt = $this->db->prepare('
            INSERT INTO variantes_producto (producto_id, tamano_ml, tipo_presentacion, sku, precio_base, disponible)
            VALUES (:producto_id, :tamano_ml, :tipo, :sku, :precio_base, :disponible)
        ');
        $stmt->execute([
            ':producto_id' => $productoId,
            ':tamano_ml'   => $tamanoMl,
            ':tipo'        => $tipo,
            ':sku'         => $sku,
            ':precio_base' => $precioBase,
            ':disponible'  => $disponible,
        ]);

        return $this->getVarianteById((int) $this->db->lastInsertId());
    }

    public function updateVariante(int $id, array $data): array
    {
        $current = $this->getVarianteById($id);
        $tamanoMl = isset($data['tamano_ml']) ? (int) $data['tamano_ml'] : (int) $current['tamano_ml'];
        $tipo = isset($data['tipo_presentacion']) ? (string) $data['tipo_presentacion'] : (string) $current['tipo_presentacion'];
        $precioBase = isset($data['precio_base']) ? (float) $data['precio_base'] : (float) $current['precio_base'];
        $sku = array_key_exists('sku', $data) ? (!empty($data['sku']) ? trim((string) $data['sku']) : null) : $current['sku'];
        $disponible = array_key_exists('disponible', $data)
            ? (int) filter_var($data['disponible'], FILTER_VALIDATE_BOOLEAN)
            : (int) $current['disponible'];

        if ($tamanoMl <= 0 || $precioBase < 0 || !PerfumeEnums::isValidTipoPresentacion($tipo)) {
            throw new HttpException('Datos de variante inválidos.', 422);
        }

        $stmt = $this->db->prepare('
            UPDATE variantes_producto
            SET tamano_ml = :tamano_ml,
                tipo_presentacion = :tipo,
                sku = :sku,
                precio_base = :precio_base,
                disponible = :disponible
            WHERE id = :id
        ');
        $stmt->execute([
            ':id'          => $id,
            ':tamano_ml'   => $tamanoMl,
            ':tipo'        => $tipo,
            ':sku'         => $sku,
            ':precio_base' => $precioBase,
            ':disponible'  => $disponible,
        ]);

        return $this->getVarianteById($id);
    }

    public function deleteVariante(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM variantes_producto WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function getVarianteById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM variantes_producto WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            throw new HttpException('Variante no encontrada.', 404);
        }
        return ProductoEntity::formatVariante($row);
    }

    /**
     * Valida y resuelve las variantes enviadas desde la compra directa o el carrito de compras,
     * calculando sus precios finales reales (con promoción activa si aplica) en base de datos.
     *
     * @param array<int, array{variante_id: int, cantidad?: int}> $requestedItems
     */
    public function resolveItemsForCheckout(array $requestedItems): array
    {
        if (empty($requestedItems)) {
            throw new HttpException('Debes enviar al menos un producto/variante para armar el pedido de WhatsApp.', 422);
        }

        $quantitiesByVariant = [];
        foreach ($requestedItems as $item) {
            $vid = (int) ($item['variante_id'] ?? 0);
            $qty = max(1, (int) ($item['cantidad'] ?? 1));
            if ($vid <= 0) {
                throw new HttpException('El identificador variante_id es inválido.', 422);
            }
            $quantitiesByVariant[$vid] = ($quantitiesByVariant[$vid] ?? 0) + $qty;
        }

        $variantIds = array_keys($quantitiesByVariant);
        $placeholders = implode(',', array_fill(0, count($variantIds), '?'));

        $sql = "
            SELECT
                vp.id AS variante_id,
                vp.producto_id,
                vp.tamano_ml,
                vp.tipo_presentacion,
                vp.sku,
                vp.precio_base,
                vp.disponible,
                p.nombre AS producto_nombre,
                p.slug AS producto_slug,
                p.concentracion,
                p.activo AS producto_activo,
                m.nombre AS marca_nombre,
                pr.id AS promo_id,
                pr.nombre AS promo_nombre,
                pr.tipo_descuento AS promo_tipo,
                pr.valor_descuento AS promo_valor
            FROM variantes_producto vp
            INNER JOIN productos p ON p.id = vp.producto_id
            INNER JOIN marcas m ON m.id = p.marca_id
            LEFT JOIN promocion_variantes pv ON pv.variante_id = vp.id
            LEFT JOIN promociones pr ON pr.id = pv.promocion_id
                AND pr.activo = 1
                AND NOW() BETWEEN pr.fecha_inicio AND pr.fecha_fin
            WHERE vp.id IN ({$placeholders})
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($variantIds);
        $rows = $stmt->fetchAll();

        $resolvedByVid = [];
        foreach ($rows as $row) {
            $vid = (int) $row['variante_id'];
            if (isset($resolvedByVid[$vid])) {
                continue;
            }

            if (!(bool) $row['disponible'] || !(bool) $row['producto_activo']) {
                throw new HttpException(
                    sprintf('La presentación %s (%d ml) de %s no se encuentra disponible actualmente.', $row['tipo_presentacion'], $row['tamano_ml'], $row['producto_nombre']),
                    422
                );
            }

            $promo = !empty($row['promo_id']) ? [
                'id'              => (int) $row['promo_id'],
                'nombre'          => (string) $row['promo_nombre'],
                'tipo_descuento'  => (string) $row['promo_tipo'],
                'valor_descuento' => (float) $row['promo_valor'],
            ] : null;

            $calc = PricingService::calculateVariantPrice((float) $row['precio_base'], $promo);
            $cantidad = $quantitiesByVariant[$vid];
            $subtotal = round($calc['precio_final'] * $cantidad, 2);

            $resolvedByVid[$vid] = [
                'variante_id'       => $vid,
                'producto_id'       => (int) $row['producto_id'],
                'producto_nombre'   => (string) $row['producto_nombre'],
                'producto_slug'     => (string) $row['producto_slug'],
                'marca_nombre'      => (string) $row['marca_nombre'],
                'concentracion'     => (string) $row['concentracion'],
                'tamano_ml'         => (int) $row['tamano_ml'],
                'tipo_presentacion' => (string) $row['tipo_presentacion'],
                'sku'               => $row['sku'] !== null ? (string) $row['sku'] : null,
                'cantidad'          => $cantidad,
                'precio_base'       => (float) $row['precio_base'],
                'precio_unitario'   => $calc['precio_final'],
                'precio_unitario_cop' => PricingService::formatCop($calc['precio_final']),
                'subtotal'          => $subtotal,
                'subtotal_cop'      => PricingService::formatCop($subtotal),
                'tiene_promocion'   => $calc['tiene_promocion'],
                'promocion_nombre'  => $promo['nombre'] ?? null,
            ];
        }

        if (count($resolvedByVid) !== count($variantIds)) {
            throw new HttpException('Una o más variantes solicitadas no existen en el catálogo.', 404);
        }

        return array_values($resolvedByVid);
    }

    // =========================================================================
    // PROMOCIONES Y PROMOCION_VARIANTES
    // =========================================================================

    public function listPromociones(): array
    {
        $promos = $this->db->query('SELECT * FROM promociones ORDER BY id DESC')->fetchAll();
        $result = [];
        foreach ($promos as $promo) {
            $stmt = $this->db->prepare('
                SELECT
                    pv.variante_id,
                    vp.tamano_ml,
                    vp.tipo_presentacion,
                    vp.precio_base,
                    p.nombre AS producto_nombre,
                    m.nombre AS marca_nombre
                FROM promocion_variantes pv
                INNER JOIN variantes_producto vp ON vp.id = pv.variante_id
                INNER JOIN productos p ON p.id = vp.producto_id
                INNER JOIN marcas m ON m.id = p.marca_id
                WHERE pv.promocion_id = :promocion_id
            ');
            $stmt->execute([':promocion_id' => (int) $promo['id']]);
            $variantes = $stmt->fetchAll();
            $promo['variantes'] = $variantes;
            $promo['variante_ids'] = array_map(static fn(array $v): int => (int) $v['variante_id'], $variantes);
            $result[] = PromocionEntity::fromArray($promo)->toArray();
        }
        return $result;
    }

    public function createPromocion(array $data): array
    {
        $nombre = trim((string) ($data['nombre'] ?? ''));
        $tipo = (string) ($data['tipo_descuento'] ?? '');
        $valor = (float) ($data['valor_descuento'] ?? 0);
        $inicio = (string) ($data['fecha_inicio'] ?? '');
        $fin = (string) ($data['fecha_fin'] ?? '');
        $activo = (int) filter_var($data['activo'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $varianteIds = is_array($data['variante_ids'] ?? null) ? $data['variante_ids'] : [];

        if ($nombre === '' || !PerfumeEnums::isValidTipoDescuento($tipo) || $valor <= 0 || $inicio === '' || $fin === '') {
            throw new HttpException('Datos de promoción inválidos.', 422);
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('
                INSERT INTO promociones (nombre, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, activo)
                VALUES (:nombre, :tipo, :valor, :inicio, :fin, :activo)
            ');
            $stmt->execute([
                ':nombre' => $nombre,
                ':tipo'   => $tipo,
                ':valor'  => $valor,
                ':inicio' => $inicio,
                ':fin'    => $fin,
                ':activo' => $activo,
            ]);
            $promoId = (int) $this->db->lastInsertId();

            $this->syncPromocionVariantes($promoId, $varianteIds);
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw new HttpException('Error al crear la promoción: ' . $e->getMessage(), 422);
        }

        return $this->getPromocionById($promoId);
    }

    public function updatePromocion(int $id, array $data): array
    {
        $current = $this->getPromocionById($id);
        $nombre = isset($data['nombre']) ? trim((string) $data['nombre']) : $current['nombre'];
        $tipo = isset($data['tipo_descuento']) ? (string) $data['tipo_descuento'] : $current['tipo_descuento'];
        $valor = isset($data['valor_descuento']) ? (float) $data['valor_descuento'] : (float) $current['valor_descuento'];
        $inicio = isset($data['fecha_inicio']) ? (string) $data['fecha_inicio'] : $current['fecha_inicio'];
        $fin = isset($data['fecha_fin']) ? (string) $data['fecha_fin'] : $current['fecha_fin'];
        $activo = array_key_exists('activo', $data)
            ? (int) filter_var($data['activo'], FILTER_VALIDATE_BOOLEAN)
            : (int) $current['activo'];

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('
                UPDATE promociones
                SET nombre = :nombre,
                    tipo_descuento = :tipo,
                    valor_descuento = :valor,
                    fecha_inicio = :inicio,
                    fecha_fin = :fin,
                    activo = :activo
                WHERE id = :id
            ');
            $stmt->execute([
                ':id'     => $id,
                ':nombre' => $nombre,
                ':tipo'   => $tipo,
                ':valor'  => $valor,
                ':inicio' => $inicio,
                ':fin'    => $fin,
                ':activo' => $activo,
            ]);

            if (is_array($data['variante_ids'] ?? null)) {
                $this->syncPromocionVariantes($id, $data['variante_ids']);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw new HttpException('Error al actualizar la promoción: ' . $e->getMessage(), 422);
        }

        return $this->getPromocionById($id);
    }

    public function deletePromocion(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM promociones WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function getPromocionById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM promociones WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            throw new HttpException('Promoción no encontrada.', 404);
        }

        $vStmt = $this->db->prepare('SELECT variante_id FROM promocion_variantes WHERE promocion_id = :id');
        $vStmt->execute([':id' => $id]);
        $row['variante_ids'] = array_map('intval', $vStmt->fetchAll(PDO::FETCH_COLUMN));

        return PromocionEntity::fromArray($row)->toArray();
    }

    private function syncPromocionVariantes(int $promoId, array $varianteIds): void
    {
        $del = $this->db->prepare('DELETE FROM promocion_variantes WHERE promocion_id = :id');
        $del->execute([':id' => $promoId]);

        $ins = $this->db->prepare('
            INSERT IGNORE INTO promocion_variantes (promocion_id, variante_id)
            VALUES (:promocion_id, :variante_id)
        ');
        foreach ($varianteIds as $vid) {
            if ((int) $vid > 0) {
                $ins->execute([
                    ':promocion_id' => $promoId,
                    ':variante_id'  => (int) $vid,
                ]);
            }
        }
    }

    // =========================================================================
    // CONFIGURACION DE CONTACTO (WHATSAPP)
    // =========================================================================

    public function getActiveContactoConfig(): array
    {
        $row = $this->db->query('
            SELECT id, numero_whatsapp, mensaje_plantilla, activo
            FROM configuracion_contacto
            WHERE activo = 1
            ORDER BY id DESC
            LIMIT 1
        ')->fetch();

        if (!is_array($row)) {
            $row = [
                'id'                => 1,
                'numero_whatsapp'   => '573000000000',
                'mensaje_plantilla' => "¡Hola *DREA PERFUMES*!\nQuiero pedir:\n\n{detalle_pedido}\n\n💰 *Total:* {total_cop}",
                'activo'            => true,
            ];
        }

        return ConfiguracionContactoEntity::fromArray($row)->toArray();
    }

    public function updateContactoConfig(array $data): array
    {
        $current = $this->getActiveContactoConfig();
        $numero = isset($data['numero_whatsapp'])
            ? (string) preg_replace('/[^0-9]/', '', (string) $data['numero_whatsapp'])
            : (string) $current['numero_whatsapp'];
        $plantilla = isset($data['mensaje_plantilla'])
            ? trim((string) $data['mensaje_plantilla'])
            : (string) $current['mensaje_plantilla'];

        if ($numero === '' || $plantilla === '') {
            throw new HttpException('El número de WhatsApp y la plantilla del mensaje son obligatorios.', 422);
        }

        $stmt = $this->db->prepare('
            UPDATE configuracion_contacto
            SET numero_whatsapp = :numero, mensaje_plantilla = :plantilla, activo = 1
            WHERE id = :id
        ');
        $stmt->execute([
            ':id'        => (int) $current['id'],
            ':numero'    => $numero,
            ':plantilla' => $plantilla,
        ]);

        return $this->getActiveContactoConfig();
    }

    // =========================================================================
    // USUARIOS ADMIN
    // =========================================================================

    public function findAdminByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios_admin WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => strtolower(trim($email))]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    public function listAdmins(): array
    {
        $rows = $this->db->query('SELECT id, nombre, email, activo FROM usuarios_admin ORDER BY id ASC')->fetchAll();
        return array_map(static fn(array $r): array => UsuarioAdminEntity::fromArray($r)->toArray(), $rows);
    }

    public function createAdmin(array $data): array
    {
        $nombre = trim((string) ($data['nombre'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');

        if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            throw new HttpException('Nombre, email válido y contraseña (mín. 6 caracteres) son obligatorios.', 422);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('
            INSERT INTO usuarios_admin (nombre, email, password_hash, activo)
            VALUES (:nombre, :email, :hash, 1)
        ');
        $stmt->execute([
            ':nombre' => $nombre,
            ':email'  => $email,
            ':hash'   => $hash,
        ]);

        $id = (int) $this->db->lastInsertId();
        return UsuarioAdminEntity::fromArray([
            'id'     => $id,
            'nombre' => $nombre,
            'email'  => $email,
            'activo' => true,
        ])->toArray();
    }
}
