<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Repositories\CatalogoRepository;

final class AdminCatalogoController
{
    private CatalogoRepository $catalogo;

    public function __construct()
    {
        $this->catalogo = new CatalogoRepository();
    }

    // --- MARCAS ---
    public function listarMarcas(Request $request): void
    {
        Response::success($this->catalogo->listMarcas(false));
    }

    public function crearMarca(Request $request): void
    {
        Response::success($this->catalogo->createMarca($request->allInput()), 'Marca creada.', 201);
    }

    public function actualizarMarca(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        Response::success($this->catalogo->updateMarca($id, $request->allInput()), 'Marca actualizada.');
    }

    public function eliminarMarca(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->catalogo->deleteMarca($id);
        Response::success(null, 'Marca eliminada.');
    }

    // --- FAMILIAS OLFATIVAS ---
    public function listarFamilias(Request $request): void
    {
        Response::success($this->catalogo->listFamilias());
    }

    public function crearFamilia(Request $request): void
    {
        Response::success($this->catalogo->createFamilia($request->allInput()), 'Familia olfativa creada.', 201);
    }

    public function actualizarFamilia(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        Response::success($this->catalogo->updateFamilia($id, $request->allInput()), 'Familia olfativa actualizada.');
    }

    public function eliminarFamilia(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->catalogo->deleteFamilia($id);
        Response::success(null, 'Familia olfativa eliminada.');
    }

    // --- NOTAS OLFATIVAS ---
    public function listarNotas(Request $request): void
    {
        Response::success($this->catalogo->listNotas());
    }

    public function crearNota(Request $request): void
    {
        Response::success($this->catalogo->createNota($request->allInput()), 'Nota olfativa creada.', 201);
    }

    public function actualizarNota(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        Response::success($this->catalogo->updateNota($id, $request->allInput()), 'Nota olfativa actualizada.');
    }

    public function eliminarNota(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->catalogo->deleteNota($id);
        Response::success(null, 'Nota olfativa eliminada.');
    }

    // --- VARIANTES DE PRODUCTO ---
    public function listarVariantes(Request $request): void
    {
        Response::success($this->catalogo->listAllVariantesWithProducto());
    }

    public function crearVariante(Request $request): void
    {
        Response::success($this->catalogo->createVariante($request->allInput()), 'Variante creada.', 201);
    }

    public function actualizarVariante(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        Response::success($this->catalogo->updateVariante($id, $request->allInput()), 'Variante actualizada.');
    }

    public function eliminarVariante(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->catalogo->deleteVariante($id);
        Response::success(null, 'Variante eliminada.');
    }

    // --- PROMOCIONES ---
    public function listarPromociones(Request $request): void
    {
        Response::success($this->catalogo->listPromociones());
    }

    public function crearPromocion(Request $request): void
    {
        Response::success($this->catalogo->createPromocion($request->allInput()), 'Promoción creada.', 201);
    }

    public function actualizarPromocion(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        Response::success($this->catalogo->updatePromocion($id, $request->allInput()), 'Promoción actualizada.');
    }

    public function eliminarPromocion(Request $request): void
    {
        $id = (int) $request->param('id', 0);
        $this->catalogo->deletePromocion($id);
        Response::success(null, 'Promoción eliminada.');
    }

    // --- CONFIGURACION CONTACTO WHATSAPP ---
    public function obtenerConfigContacto(Request $request): void
    {
        Response::success($this->catalogo->getActiveContactoConfig());
    }

    public function actualizarConfigContacto(Request $request): void
    {
        Response::success(
            $this->catalogo->updateContactoConfig($request->allInput()),
            'Configuración de WhatsApp actualizada.'
        );
    }

    // --- USUARIOS ADMIN ---
    public function listarAdmins(Request $request): void
    {
        Response::success($this->catalogo->listAdmins());
    }

    public function crearAdmin(Request $request): void
    {
        Response::success($this->catalogo->createAdmin($request->allInput()), 'Usuario administrador creado.', 201);
    }
}
