<?php

declare(strict_types=1);

namespace App\Services;

final class SlugService
{
    public static function slugify(string $text): string
    {
        $text = trim($text);
        $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        if (is_string($transliterated) && $transliterated !== '') {
            $text = $transliterated;
        } else {
            $map = [
                'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
                'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u',
                'ñ' => 'n', 'Ñ' => 'n', 'ü' => 'u', 'Ü' => 'u', 'ç' => 'c',
                'è' => 'e', 'ê' => 'e', 'à' => 'a', 'ô' => 'o',
            ];
            $text = strtr($text, $map);
        }

        $text = strtolower($text);
        $text = (string) preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');

        return $text !== '' ? $text : 'item-' . time();
    }
}
