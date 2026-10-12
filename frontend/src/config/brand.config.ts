/**
 * ============================================================================
 * CONFIGURACIÓN CENTRAL DE IDENTIDAD DE MARCA — DREA PERFUMES
 * ============================================================================
 * Este archivo centraliza el nombre oficial, colores, tipografías, universos
 * de navegación, guía sensorial de familias olfativas y pilares de servicio
 * definidos en la Propuesta Digital 2026 para que todo el equipo de Frontend
 * mantenga una estética 100% uniforme.
 */

export const DREA_BRAND = {
  name: 'DREA PERFUMES',
  shortName: 'DREA',
  city: 'Cúcuta',
  country: 'Colombia',
  currency: 'COP',
  tagline: 'Criterio · Confianza · Estilo',
  subtitle: 'PERFUMES · CÚCUTA',
  heroDescription:
    'Boutique de perfumería exclusiva para transformar el catálogo en una experiencia de deseo, rigor y autenticidad.',
  editorialQuote:
    '"Comprar un perfume debe sentirse tan íntimo, pausado y seguro en pantalla como frente al mostrador de una casa de alta perfumería."',
  assets: {
    logo: '/assets/brand/drea-logo.png',
  },

  contact: {
    headline: 'PERFUMERÍA ORIGINAL',
    showroom: 'Visita nuestro Showroom en Cúcuta 📍',
    schedule: 'Horario de atención 8am-8pm',
    advisory: 'Te brindamos asesoría personalizada',
    whatsappNumber: '573207683734',
    whatsappDisplay: '+57 320 768 3734',
    whatsappUrl:
      'https://api.whatsapp.com/send/?phone=573207683734&text&type=phone_number&app_absent=0&utm_source=ig',
    instagramHandle: '@perfumeshopcucuta',
    instagramUrl:
      'https://www.instagram.com/perfumeshopcucuta?obrf=MXR2bzJuNTk1eHQ1OQ%3D%3D',
  },

  /**
   * Paleta cromática oficial extraída del logo DREA PERFUMES y la Propuesta Digital
   */
  colors: {
    burgundy: {
      primary: '#7A0C35',   // Fondo principal del logo DREA PERFUMES
      deep: '#560724',      // Estados hover y fondos de acento profundo
      dark: '#3D0419',      // Sombras de vino oscuro
      crimson: '#8B1038',   // Acento carmesí en fotografía de producto
    },
    gold: {
      primary: '#D4AF37',   // Oro clásico de la tipografía DREA
      light: '#F5DF86',     // Brillo champagne del foliaje dorado
      metallic: '#E3BF52',  // Tono medio metálico (tapa de frascos y líneas de flujo)
      antique: '#B5892A',   // Oro envejecido para bordes e íconos de la Guía Sensorial
    },
    editorial: {
      canvas: '#F5F4F2',    // Fondo general alabastro cálido (calma visual)
      secondary: '#ECEAE6', // Fondo de paneles laterales ("CRITERIO DESEO")
      surface: '#FFFFFF',   // Tarjetas de producto y modales
      border: '#DCD8D0',    // Líneas sutiles de grilla y separadores
      ink: '#141414',       // Tinta principal y tarjetas de pilares (01, 02, 03)
      body: '#3D3B38',      // Texto corrido
      muted: '#6E6A64',     // Etiquetas secundarias y descripciones cortas
    },
  },

  /**
   * 4 Universos Esenciales (Accesos Rápidos - Página 3 y 4 de la propuesta)
   * Mapeados directamente a los parámetros del endpoint GET /api/productos
   */
  quickAccessUniverses: [
    {
      id: 'dama',
      label: 'Dama',
      description: 'Fragancias femeninas de diseñador, nicho y alta perfumería árabe.',
      apiQuery: { genero: 'Mujer' },
      route: '/catalogo?genero=Mujer',
    },
    {
      id: 'caballero',
      label: 'Caballero',
      description: 'Composiciones masculinas con carácter, proyección y elegancia.',
      apiQuery: { genero: 'Hombre' },
      route: '/catalogo?genero=Hombre',
    },
    {
      id: 'unisex',
      label: 'Unisex',
      description: 'Perfumería de autor sin etiquetas, versátil y sofisticada.',
      apiQuery: { genero: 'Unisex' },
      route: '/catalogo?genero=Unisex',
    },
    {
      id: 'sale',
      label: 'Sale',
      description: 'Oportunidades seleccionadas y presentaciones con descuento vigente.',
      apiQuery: { en_promocion: 1 },
      route: '/catalogo?en_promocion=1',
    },
  ],

  /**
   * Guía Sensorial de Familias Olfativas (Página 6 de la propuesta)
   * Con las microdescripciones exactas para orientar la decisión sin barreras técnicas
   */
  sensoryFamilies: [
    {
      nombre: 'Floral',
      microdescripcion: 'jazmín, rosa y delicadeza elegante',
      iconGeometry: 'petals',
    },
    {
      nombre: 'Cítrica',
      microdescripcion: 'bergamota, mandarina y vitalidad limpia',
      iconGeometry: 'citrus-hexagon',
    },
    {
      nombre: 'Amaderada',
      microdescripcion: 'cedro, sándalo y carácter sobrio',
      iconGeometry: 'diamond',
    },
    {
      nombre: 'Oriental',
      microdescripcion: 'ámbar, vainilla y seducción cálida',
      iconGeometry: 'octagram',
    },
    {
      nombre: 'Dulce',
      microdescripcion: 'acordes gourmand y presencia envolvente',
      iconGeometry: 'SoftHexagon',
    },
    {
      nombre: 'Fresca',
      microdescripcion: 'notas acuáticas, verdes y ligereza moderna',
      iconGeometry: 'wave-circle',
    },
  ],

  /**
   * Pilares de Posicionamiento (Página 2 de la propuesta)
   */
  pillars: [
    {
      number: '01',
      title: 'Calidad',
      description:
        'Marcas originales y reconocidas, ordenadas bajo criterios olfativos claros, sin saturación comercial.',
    },
    {
      number: '02',
      title: 'Servicio',
      description:
        'Estructura que resuelve dudas sobre notas, concentración y ocasión antes de la compra.',
    },
    {
      number: '03',
      title: 'Confianza',
      description:
        'Garantía total de autenticidad y asesoría directa personalizada para la clientela en Cúcuta.',
    },
  ],

  /**
   * Compromiso de Servicio en Ficha de Producto y Checkout (Páginas 7 y 8)
   */
  serviceCommitments: [
    {
      title: 'Envíos Cuidados · Cúcuta y País',
      description:
        'Entregas el mismo día en el área metropolitana de Cúcuta y despachos asegurados a nivel nacional (envío gratis a todo el país).',
    },
    {
      title: 'Autenticidad Garantizada',
      description:
        'Lotes certificados y trazabilidad directa con importadores oficiales de cada casa.',
    },
    {
      title: 'Asesoría de Estilo Personal',
      description:
        'Recomendación experta basada en clima, preferencias de estela y momentos de uso vía WhatsApp.',
    },
  ],
} as const;
