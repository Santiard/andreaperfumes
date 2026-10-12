<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Repositories\ProductoRepository;
use App\Services\ImageService;

final class AdminProductoController
{
    private ProductoRepository $productos;

    public function __construct()
    {
        $this->productos = new ProductoRepository();
    }

    public function index(Request $request): void
    {
        $result = $this->productos->listCatalog($request->allQuery(), true);
        Response::success($result);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $producto = $this->productos->findBySlugOrId($id, true);
        if ($producto === null) {
            throw new HttpException('Producto no encontrado.', 404);
        }
        Response::success($producto);
    }

    public function store(Request $request): void
    {
        $uploadedFile = $request->file('imagen');
        $webpImage = $uploadedFile !== null
            ? ImageService::processUploadedFile($uploadedFile)
            : ImageService::generatePlaceholderWebp();

        $piramide = $this->parseArrayOrJsonInput($request->input('piramide', []));
        $variantes = $this->parseArrayOrJsonInput($request->input('variantes', []));

        $created = $this->productos->create(
            $request->allInput(),
            $webpImage,
            $piramide ?? [],
            $variantes ?? []
        );

        Response::success($created, 'Perfume creado y comprimido a WebP exitosamente.', 201);
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $uploadedFile = $request->file('imagen');
        $webpImage = $uploadedFile !== null
            ? ImageService::processUploadedFile($uploadedFile)
            : null;

        $rawPiramide = $request->input('piramide');
        $rawVariantes = $request->input('variantes');

        $piramide = $rawPiramide !== null ? $this->parseArrayOrJsonInput($rawPiramide) : null;
        $variantes = $rawVariantes !== null ? $this->parseArrayOrJsonInput($rawVariantes) : null;

        $updated = $this->productos->update(
            $id,
            $request->allInput(),
            $webpImage,
            $piramide,
            $variantes
        );

        Response::success($updated, 'Perfume actualizado correctamente.');
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->productos->delete($id);
        Response::success(null, 'Perfume eliminado correctamente.');
    }

    private function parseArrayOrJsonInput(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $decoded;
            }
            throw new HttpException('El formato JSON enviado en piramide o variantes es inválido.', 422);
        }
        return null;
    }
}
