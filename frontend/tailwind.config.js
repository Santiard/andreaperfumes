/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        drea: {
          // Vino / Borgoña Imperial (Extraído del isotipo oficial DREA PERFUMES)
          burgundy: {
            DEFAULT: '#7A0C35',
            deep: '#560724',
            dark: '#3D0419',
            light: '#991445',
            accent: '#8B1038',
          },
          // Oro Metálico / Champagne (Extraído del logotipo dorado y detalles del frasco)
          gold: {
            DEFAULT: '#D4AF37',
            light: '#F5DF86',
            metallic: '#E3BF52',
            antique: '#B5892A',
            muted: '#C5A55A',
          },
          // Lienzo Editorial Claro (Extraído de la presentación de marca 2026)
          canvas: {
            DEFAULT: '#F5F4F2', // Fondo principal alabastro cálido
            secondary: '#ECEAE6', // Bloques editoriales secundarios ("CRITERIO DESEO")
            surface: '#FFFFFF', // Superficie limpia de tarjetas y fichas
            border: '#DCD8D0', // Líneas divisorias sutiles y bordes de tarjetas
          },
          // Tinta / Carbón Editorial (Extraído de los pilares 01/02/03 y tipografía)
          ink: {
            DEFAULT: '#141414', // Negro obsidiana editorial
            charcoal: '#1F1E1D', // Fondo de tarjetas oscuras (Pilares 01, 02, 03)
            body: '#3D3B38', // Texto de párrafo principal
            muted: '#6E6A64', // Subtítulos, microdescripciones y notas
          },
        },
      },
      fontFamily: {
        // Serif editorial de alto contraste para titulares y nombre de perfumes
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        // Sans-serif geométrica sobria para navegación, filtros, precios COP y fichas técnicas
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        // Caligráfica / Script para el monograma o acentos especiales de "DREA"
        script: ['"Pinyon Script"', '"Great Vibes"', 'cursive'],
      },
      letterSpacing: {
        editorial: '0.22em', // Para subtítulos en mayúsculas: "PERFUMES · CÚCUTA"
        widest: '0.28em',    // Para "P E R F U M E S" bajo el logo
      },
      backgroundImage: {
        'drea-gold-gradient': 'linear-gradient(135deg, #B5892A 0%, #F5DF86 48%, #D4AF37 75%, #9E731D 100%)',
        'drea-burgundy-gradient': 'linear-gradient(145deg, #8B1038 0%, #7A0C35 55%, #4A051E 100%)',
      },
      boxShadow: {
        'editorial': '0 10px 30px -10px rgba(20, 20, 20, 0.06)',
        'editorial-hover': '0 18px 40px -12px rgba(122, 12, 53, 0.12)',
        'gold-glow': '0 8px 24px -6px rgba(212, 175, 55, 0.28)',
      },
    },
  },
  plugins: [],
};
