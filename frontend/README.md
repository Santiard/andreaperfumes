# DREA PERFUMES — Sistema de Diseño e Identidad de Marca (Frontend)

Esta carpeta contiene la base configurada del **Sistema de Diseño de DREA PERFUMES (Cúcuta)**, extraída directamente del logotipo oficial y de la **Propuesta Digital 2026**.

---

## 1. Archivos de Identidad y Configuración Ya Listos

* **Logotipo Oficial:** [`public/assets/brand/drea-logo.png`](public/assets/brand/drea-logo.png)
* **Tokens de Marca, Universos, Guía Sensorial y Pilares:** [`src/config/brand.config.ts`](src/config/brand.config.ts)
* **Configuración de Tailwind CSS (`drea-*`):** [`tailwind.config.js`](tailwind.config.js)
* **Variables CSS Globales y Componentes Base:** [`src/styles/theme.css`](src/styles/theme.css)

---

## 2. Paleta de Colores Oficial (`DREA PERFUMES`)

| Token / Variable CSS | Clase Tailwind | Hexadecimal | Uso en la Interfaz |
| :--- | :--- | :--- | :--- |
| `--drea-burgundy` | `bg-drea-burgundy` / `text-drea-burgundy` | `#7A0C35` | Color insignia del logo **DREA PERFUMES**, botones principales de compra, etiquetas *Sale* y acentos de lujo. |
| `--drea-burgundy-deep` | `bg-drea-burgundy-deep` | `#560724` | Estado `hover` de botones primarios y cabeceras de alto contraste. |
| `--drea-gold` | `text-drea-gold` / `border-drea-gold` | `#D4AF37` | Oro metálico del isotipo **DREA**, líneas de flujo de navegación, íconos de la Guía Sensorial y bordes destacados. |
| `--drea-gold-light` | `text-drea-gold-light` | `#F5DF86` | Brillo champagne en gradientes dorados y texto sobre fondo borgoña. |
| `--drea-canvas` | `bg-drea-canvas` | `#F5F4F2` | Fondo general alabastro cálido para brindar **calma visual** al catálogo. |
| `--drea-canvas-secondary` | `bg-drea-canvas-secondary` | `#ECEAE6` | Bloques editoriales secundarios (ej. sección *Criterio & Deseo*). |
| `--drea-surface` | `bg-drea-canvas-surface` | `#FFFFFF` | Fondo neutro limpio para tarjetas de perfumes en la grilla y ficha técnica. |
| `--drea-border` | `border-drea-canvas-border` | `#DCD8D0` | Líneas divisorias sutiles de grilla modular y bordes de tarjetas. |
| `--drea-ink` | `text-drea-ink` / `bg-drea-ink` | `#141414` | Negro obsidiana para titulares editoriales y bloques de pilares (`01 Calidad`, `02 Servicio`, `03 Confianza`). |
| `--drea-muted` | `text-drea-ink-muted` | `#6E6A64` | Microdescripciones de familias olfativas y subtítulos. |

---

## 3. Tipografía Editorial

1. **Titulares y Nombres de Fragancias (`font-serif`):**
   * `Cormorant Garamond` / `Playfair Display` — Transmite el carácter de casa de alta perfumería.
2. **Interfaz, Precios COP, Filtros y Microdescripciones (`font-sans`):**
   * `Plus Jakarta Sans` — Lectura nítida para precios en Pesos Colombianos, notas olfativas y botones.
   * Subtítulos superiores (`.drea-eyebrow`): `uppercase` con `letter-spacing: 0.22em` (ej. `PERFUMES · CÚCUTA`, `CRITERIO · CONFIANZA · ESTILO`).
3. **Acento Caligráfico (`font-script`):**
   * `Pinyon Script` — Inspirado en la **"D"** caligráfica dorada del logotipo **DREA**.
