<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    /** @var array<int, array{method: string, pattern: string, regex: string, handler: callable, protected: bool}> */
    private array $routes = [];

    /** @var callable|null */
    private $fallbackHandler = null;

    public function add(string $method, string $pattern, callable $handler, bool $protected = false): void
    {
        $normalizedPattern = rtrim($pattern, '/') ?: '/';
        // Convertir parámetros como {id} o {slug} en grupos con nombre regex
        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', static function (array $matches): string {
            return '(?P<' . $matches[1] . '>[^/]+)';
        }, $normalizedPattern);

        $this->routes[] = [
            'method'    => strtoupper($method),
            'pattern'   => $normalizedPattern,
            'regex'     => '#^' . $regex . '$#u',
            'handler'   => $handler,
            'protected' => $protected,
        ];
    }

    public function get(string $pattern, callable $handler, bool $protected = false): void
    {
        $this->add('GET', $pattern, $handler, $protected);
    }

    public function post(string $pattern, callable $handler, bool $protected = false): void
    {
        $this->add('POST', $pattern, $handler, $protected);
    }

    public function put(string $pattern, callable $handler, bool $protected = false): void
    {
        $this->add('PUT', $pattern, $handler, $protected);
    }

    public function delete(string $pattern, callable $handler, bool $protected = false): void
    {
        $this->add('DELETE', $pattern, $handler, $protected);
    }

    public function setFallback(callable $handler): void
    {
        $this->fallbackHandler = $handler;
    }

    public function dispatch(Request $request): void
    {
        $method = $request->method();
        $lookupMethod = $method === 'HEAD' ? 'GET' : $method;
        $path = $request->path();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $lookupMethod) {
                continue;
            }

            if (preg_match($route['regex'], $path, $matches)) {
                $params = [];
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = urldecode($value);
                    }
                }

                $request->setParams($params);

                if ($route['protected']) {
                    JwtAuth::requireAdmin($request);
                }

                ($route['handler'])($request);
                return;
            }
        }

        if ($this->fallbackHandler !== null && !str_starts_with($path, '/api/')) {
            ($this->fallbackHandler)($request);
            return;
        }

        Response::error("Endpoint no encontrado: {$method} {$path}", 404);
    }
}
