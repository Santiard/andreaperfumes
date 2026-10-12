export interface FamiliaOlfativa {
  id: number;
  nombre: string;
  descripcion: string | null;
  total_productos?: number;
}

export interface Marca {
  id: number;
  nombre: string;
  slug: string;
  total_productos?: number;
}

export interface VarianteProducto {
  id: number;
  producto_id: number;
  tamano_ml: number;
  tipo_presentacion: 'Regular' | 'Tester' | 'Decant' | 'Kit';
  etiqueta: string;
  sku: string | null;
  precio_base: number;
  precio_base_cop: string;
  precio_final: number;
  precio_final_cop: string;
  ahorro: number;
  ahorro_cop: string;
  tiene_promocion: boolean;
  promocion: {
    id: number;
    nombre: string;
    etiqueta: string;
  } | null;
  disponible: boolean;
}

export interface PiramideNotaItem {
  id: number;
  nota_id: number;
  nombre: string;
  tipo_etapa: 'Salida' | 'Corazón' | 'Fondo';
}

export interface PiramideOlfativa {
  Salida: PiramideNotaItem[];
  Corazón: PiramideNotaItem[];
  Fondo: PiramideNotaItem[];
}

export interface Producto {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  genero: 'Hombre' | 'Mujer' | 'Unisex';
  concentracion: string;
  ocasion_uso: string | null;
  marca: {
    id: number;
    nombre: string;
    slug: string;
  };
  familia_olfativa: {
    id: number;
    nombre: string;
  } | null;
  imagen: {
    url: string;
    mime: string;
    tamano_bytes: number;
  };
  destacado: boolean;
  activo: boolean;
  precio_desde: number | null;
  precio_desde_cop: string | null;
  tiene_promocion: boolean;
  variantes: VarianteProducto[];
  piramide_olfativa?: PiramideOlfativa | null;
}

export interface TamanoFiltro {
  tamano_ml: number;
  total_productos: number;
}

export interface CatalogPublicFiltersMeta {
  marcas: Marca[];
  familias_olfativas: FamiliaOlfativa[];
  tamanos_ml: TamanoFiltro[];
  generos: string[];
  generos_conteo: { genero: string; total_productos: number }[];
  concentraciones: string[];
  concentraciones_conteo: { concentracion: string; total_productos: number }[];
  tipos_presentacion: string[];
  rango_precios: {
    min: number;
    min_cop: string;
    max: number;
    max_cop: string;
  };
}

export interface CatalogFiltersState {
  view: 'home' | 'catalogo' | 'producto';
  productoSlug?: string;
  tituloSeccion?: string;
  subtituloSeccion?: string;
  q?: string;
  genero?: string;
  familia?: number;
  marca?: string;
  concentracion?: string;
  tipo_presentacion?: string;
  tamano_ml?: number[];
  precio_min?: number;
  precio_max?: number;
  destacado?: number;
  en_promocion?: number;
  orden?: string;
  per_page?: number;
  page?: number;
}

export interface CartItem {
  variante: VarianteProducto;
  producto: Producto;
  cantidad: number;
}

export interface BannerSlide {
  id: number;
  imageUrl: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  filterAction: Partial<CatalogFiltersState>;
}
