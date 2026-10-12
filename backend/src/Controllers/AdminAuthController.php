<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\JwtAuth;
use App\Core\Request;
use App\Core\Response;
use App\Repositories\CatalogoRepository;

final class AdminAuthController
{
    private CatalogoRepository $catalogo;

    public function __construct()
    {
        $this->catalogo = new CatalogoRepository();
    }

    public function login(Request $request): void
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');

        if ($email === '' || $password === '') {
            throw new HttpException('Debes ingresar correo electrónico y contraseña.', 422);
        }

        $admin = $this->catalogo->findAdminByEmail($email);
        if ($admin === null || !(bool) $admin['activo']) {
            throw new HttpException('Credenciales inválidas o cuenta inactiva.', 401);
        }

        if (!password_verify($password, (string) $admin['password_hash'])) {
            throw new HttpException('Credenciales inválidas.', 401);
        }

        $userPayload = [
            'sub'    => (int) $admin['id'],
            'nombre' => (string) $admin['nombre'],
            'email'  => (string) $admin['email'],
            'role'   => 'admin',
        ];

        $token = JwtAuth::generateToken($userPayload);

        Response::success([
            'token' => $token,
            'user'  => $userPayload,
        ], 'Sesión iniciada correctamente.');
    }

    public function me(Request $request): void
    {
        Response::success($request->authUser());
    }
}
