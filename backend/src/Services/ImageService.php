<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Env;
use App\Core\HttpException;
use GdImage;

final class ImageService
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ];

    /**
     * Intercepta el archivo subido ($_FILES['imagen']), valida tipo y peso,
     * redimensiona proporcionalmente (máx. 1000x1000 px) y lo convierte a binario WebP.
     *
     * @return array{data: string, mime: string, size: int}
     */
    public static function processUploadedFile(array $file): array
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new HttpException('Error al subir el archivo de imagen (Código: ' . $error . ').', 400);
        }

        $tmpPath = (string) ($file['tmp_name'] ?? '');
        if ($tmpPath === '' || !is_readable($tmpPath)) {
            throw new HttpException('No se pudo leer el archivo temporal de la imagen.', 400);
        }

        $maxUploadBytes = Env::getInt('MAX_UPLOAD_BYTES', 10 * 1024 * 1024);
        $fileSize = (int) ($file['size'] ?? filesize($tmpPath));
        if ($fileSize <= 0 || $fileSize > $maxUploadBytes) {
            throw new HttpException('El tamaño de la imagen excede el límite permitido (10 MB).', 400);
        }

        $imageInfo = @getimagesize($tmpPath);
        if ($imageInfo === false) {
            throw new HttpException('El archivo subido no es una imagen válida.', 422);
        }

        $mime = strtolower((string) ($imageInfo['mime'] ?? ''));
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new HttpException('Formato de imagen no soportado. Usa JPG, PNG o WebP.', 422);
        }

        $srcImage = self::createGdResource($tmpPath, $mime);
        if (!$srcImage instanceof GdImage) {
            throw new HttpException('No fue posible procesar la imagen con la librería gráfica GD.', 422);
        }

        $origWidth = imagesx($srcImage);
        $origHeight = imagesy($srcImage);
        $maxDim = Env::getInt('WEBP_MAX_DIMENSION', 1000);
        $quality = Env::getInt('WEBP_QUALITY', 82);

        [$targetWidth, $targetHeight] = self::calculateProportionalDimensions(
            $origWidth,
            $origHeight,
            $maxDim
        );

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        if (!$canvas instanceof GdImage) {
            imagedestroy($srcImage);
            throw new HttpException('Error al reservar memoria para redimensionar la imagen.', 500);
        }

        // Preservar canal alfa (transparencia en frascos de perfume recortados)
        imagepalettetotruecolor($canvas);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 255, 255, 255, 127);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, (int) $transparent);

        imagecopyresampled(
            $canvas,
            $srcImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $origWidth,
            $origHeight
        );

        imagedestroy($srcImage);

        // Codificar a WebP y asegurar que no supere ~150 KB reduciendo calidad gradualmente si es necesario
        $binary = self::encodeWebpWithTargetSize($canvas, $quality, 150 * 1024);
        imagedestroy($canvas);

        $sizeBytes = strlen($binary);
        if ($sizeBytes === 0) {
            throw new HttpException('La conversión a WebP generó un archivo vacío.', 500);
        }

        return [
            'data' => $binary,
            'mime' => 'image/webp',
            'size' => $sizeBytes,
        ];
    }

    /**
     * Genera un binario WebP placeholder limpio (frasco minimalista sobre fondo neutro)
     * cuando se crea un producto de prueba sin adjuntar archivo.
     *
     * @return array{data: string, mime: string, size: int}
     */
    public static function generatePlaceholderWebp(): array
    {
        if (function_exists('imagecreatetruecolor') && function_exists('imagewebp')) {
            $img = imagecreatetruecolor(400, 400);
            if ($img instanceof GdImage) {
                $bg = imagecolorallocate($img, 248, 245, 240);
                $gold = imagecolorallocate($img, 184, 148, 95);
                imagefilledrectangle($img, 0, 0, 400, 400, (int) $bg);
                imagerectangle($img, 140, 130, 260, 310, (int) $gold);
                imagefilledrectangle($img, 175, 95, 225, 130, (int) $gold);

                ob_start();
                imagewebp($img, null, 80);
                $binary = (string) ob_get_clean();
                imagedestroy($img);

                if ($binary !== '') {
                    return [
                        'data' => $binary,
                        'mime' => 'image/webp',
                        'size' => strlen($binary),
                    ];
                }
            }
        }

        // Fallback binario WebP 1x1 lossless válido (34 bytes)
        $fallback = (string) hex2bin('524946461A000000574542505650384C0D0000002F00000010071011118888FE0700');
        return [
            'data' => $fallback,
            'mime' => 'image/webp',
            'size' => strlen($fallback),
        ];
    }

    private static function createGdResource(string $path, string $mime): GdImage|false
    {
        return match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png'               => @imagecreatefrompng($path),
            'image/webp'              => @imagecreatefromwebp($path),
            default                   => false,
        };
    }

    /**
     * @return array{0: int, 1: int}
     */
    private static function calculateProportionalDimensions(int $width, int $height, int $maxDim): array
    {
        if ($width <= $maxDim && $height <= $maxDim) {
            return [$width, $height];
        }

        $ratio = $width / $height;
        if ($width >= $height) {
            $newWidth = $maxDim;
            $newHeight = (int) max(1, round($maxDim / $ratio));
        } else {
            $newHeight = $maxDim;
            $newWidth = (int) max(1, round($maxDim * $ratio));
        }

        return [$newWidth, $newHeight];
    }

    private static function encodeWebpWithTargetSize(GdImage $canvas, int $initialQuality, int $maxBytes): string
    {
        $quality = max(50, min(95, $initialQuality));
        $binary = '';

        while ($quality >= 55) {
            ob_start();
            imagewebp($canvas, null, $quality);
            $binary = (string) ob_get_clean();

            if (strlen($binary) <= $maxBytes || $quality <= 60) {
                break;
            }
            $quality -= 8;
        }

        return $binary;
    }
}
