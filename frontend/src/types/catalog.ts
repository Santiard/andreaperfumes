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
  tipo_presentacion: 'Regular' | 'Tester' | 'Decant';
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
}

export interface CatalogFiltersState {
  view: 'home' | 'catalogo';
  tituloSeccion?: string;
  q?: string;
  genero?: string;
  familia?: number;
  marca?: string;
  tipo_presentacion?: string;
  en_promocion?: number;
  orden?: string;
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
