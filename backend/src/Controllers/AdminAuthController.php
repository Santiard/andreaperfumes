<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\JwtAuth;
use App\Core\Request;
use App\Core\Response;
use App\Repositories\CatalogoRepository;
use App\Services\SecurityService;

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

        // 1. Verificar límite de intentos (Protección Anti-Fuerza Bruta)
        SecurityService::checkLoginRateLimit($email);

        $admin = $this->catalogo->findAdminByEmail($email);
        if ($admin === null || !(bool) $admin['activo']) {
            SecurityService::recordFailedLogin($email);
            throw new HttpException('Credenciales inválidas o cuenta inactiva.', 401);
        }

        if (!password_verify($password, (string) $admin['password_hash'])) {
            SecurityService::recordFailedLogin($email);
            throw new HttpException('Credenciales inválidas.', 401);
        }

        // 2. Limpiar contador de fallos tras login exitoso
        SecurityService::clearFailedLogins($email);

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

    public function changePassword(Request $request): void
    {
        $authUser = $request->authUser();
        $adminId = (int) ($authUser['sub'] ?? 0);
        if ($adminId <= 0) {
            throw new HttpException('Sesión no válida.', 401);
        }

        $currentPassword = (string) $request->input('current_password', '');
        $newPassword = (string) $request->input('new_password', '');

        $this->catalogo->updateAdminPassword($adminId, $currentPassword, $newPassword);

        Response::success(null, 'Contraseña actualizada exitosamente.');
    }
}
