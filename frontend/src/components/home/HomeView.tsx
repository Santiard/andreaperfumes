import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { DREA_BRAND } from '../../config/brand.config';
import {
  CatalogFiltersState,
  Producto,
  VarianteProducto,
} from '../../types/catalog';
import { ProgressiveImage } from '../common/ProgressiveImage';

interface HomeViewProps {
  featuredProductos: Producto[];
  loading: boolean;
  sendingWhatsapp: boolean;
  onNavigateCatalog: (next: CatalogFiltersState) => void;
  onOpenProduct: (producto: Producto) => void;
  onAddToCart: (producto: Producto, variante?: VarianteProducto) => void;
  onDirectWhatsApp: (items: { variante_id: number; cantidad: number }[]) => void;
}

function formatCop(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

export const HomeView: React.FC<HomeViewProps> = ({
  featuredProductos,
  loading,
  sendingWhatsapp,
  onNavigateCatalog,
  onOpenProduct,
  onAddToCart,
  onDirectWhatsApp,
}) => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [selectedVariantByProd, setSelectedVariantByProd] = useState<Record<number, number>>({});
  const [loadedCategories, setLoadedCategories] = useState<Record<string, boolean>>({});

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollAmount = Math.max(container.clientWidth * 0.78, 300);
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const openProductDetail = (prod: Producto) => {
    onOpenProduct(prod);
  };

  // Los 4 Recuadros de Categorías en el Home: Hombre, Mujer, Unisex y Kits
  const categoryBoxes = [
    {
      id: 'hombre',
      title: 'HOMBRE',
      imageUrl: '/assets/categorias/caballero.webp',
      bgGradient:
        'linear-gradient(145deg, #141414 0%, #2B1921 55%, #560724 100%)',
      filterAction: {
        view: 'catalogo' as const,
        tituloSeccion: 'Perfumes para Hombre',
        subtituloSeccion:
          'Composiciones masculinas con maderas especiadas, cuero, ámbar y acordes aromáticos de gran fijación.',
        genero: 'Hombre',
      },
    },
    {
      id: 'mujer',
      title: 'MUJER',
      imageUrl: '/assets/categorias/dama.webp',
      bgGradient:
        'linear-gradient(145deg, #3D0419 0%, #7A0C35 55%, #8B1038 100%)',
      filterAction: {
        view: 'catalogo' as const,
        tituloSeccion: 'Perfumes para Mujer',
        subtituloSeccion:
          'Estelas florales, orientales y gourmand seleccionadas para destacar con sofisticación.',
        genero: 'Mujer',
      },
    },
    {
      id: 'unisex',
      title: 'UNISEX',
      imageUrl: '/assets/categorias/sale.webp',
      bgGradient:
        'linear-gradient(145deg, #0F0F0F 0%, #3D0419 50%, #141414 100%)',
      filterAction: {
        view: 'catalogo' as const,
        tituloSeccion: 'Perfumería Unisex',
        subtituloSeccion:
          'Fragancias versátiles y de autor concebidas para trascender géneros con carácter propio.',
        genero: 'Unisex',
      },
    },
    {
      id: 'sets',
      title: 'SETS',
      imageUrl: '/assets/categorias/sets.webp',
      bgGradient:
        'linear-gradient(145deg, #24211E 0%, #4A3E2D 55%, #8C6D32 100%)',
      filterAction: {
        view: 'catalogo' as const,
        tituloSeccion: 'Colección Sets & Cofres de Regalo',
        subtituloSeccion:
          'Estuches y sets de regalo originales acompañados de loción corporal, gel de ducha o atomizador de viaje.',
        tipo_presentacion: 'Kit',
      },
    },
  ];

  return (
    <div className="w-full space-y-20">
      {/* =====================================================================
          1. CARRUSEL DE PERFUMES SELECCIONADOS DESDE EL ADMINISTRADOR (Hasta 10+)
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-drea-canvas-border pb-5">
          <div>
            <span className="drea-eyebrow text-drea-burgundy">
              CURADURÍA DE LA BOUTIQUE · SELECCIÓN DREA
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-drea-ink mt-1">
              Fragancias Seleccionadas
            </h2>
            <p className="text-xs sm:text-sm text-drea-ink-muted mt-1">
              Nuestra selección exclusiva de perfumes destacados del momento. Desliza para explorar.
            </p>
          </div>

          {/* Controles de Deslizamiento del Carrusel + Botón Ver Catálogo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              aria-label="Deslizar a la izquierda"
              className="w-10 h-10 bg-white border border-drea-canvas-border hover:border-drea-burgundy hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              aria-label="Deslizar a la derecha"
              className="w-10 h-10 bg-white border border-drea-canvas-border hover:border-drea-burgundy hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigateCatalog({
                  view: 'catalogo',
                  tituloSeccion: 'Catálogo Completo',
                })
              }
              className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-xs uppercase tracking-editorial font-semibold text-drea-burgundy hover:underline"
            >
              <span>Ver Todo el Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pista Horizontal Deslizable del Carrusel */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-[410px] bg-white border border-drea-canvas-border animate-pulse p-6"
              />
            ))}
          </div>
        ) : featuredProductos.length === 0 ? (
          <div className="bg-white border border-drea-canvas-border p-10 text-center space-y-3">
            <p className="font-serif text-2xl text-drea-ink">
              Aún no hay perfumes marcados para el carrusel de inicio.
            </p>
            <p className="text-xs text-drea-ink-muted">
              Desde el panel <strong>/drea-admin</strong> puedes activar hasta 10 o más perfumes con
              un clic para que se deslicen en esta vitrina principal.
            </p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {featuredProductos.map((prod) => {
              const activeVariants = prod.variantes.filter((v) => v.disponible !== false);
              const variantsList = activeVariants.length > 0 ? activeVariants : prod.variantes;

              const chosenVarId = selectedVariantByProd[prod.id];
              const selectedVar =
                variantsList.find((v) => v.id === chosenVarId) ?? variantsList[0];

              const finalPrices = variantsList.map((v) => v.precio_final);
              const minPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
              const maxPrice = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;
              const hasPriceRange = variantsList.length > 1 && minPrice !== maxPrice;

              const promoVariant = variantsList.find((v) => v.tiene_promocion && v.promocion);
              const discountBadgeText = promoVariant?.promocion?.etiqueta
                ? `SALE ${promoVariant.promocion.etiqueta}`
                : 'SALE';

              return (
                <article
                  key={prod.id}
                  className="snap-start shrink-0 w-[275px] sm:w-[295px] bg-white border border-drea-canvas-border hover:border-drea-gold hover:shadow-luxury transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="flex flex-col flex-1">
                    {/* Imagen del Perfume adaptada hasta el borde del contenedor */}
                    <div
                      onClick={() => openProductDetail(prod)}
                      className="relative aspect-square sm:aspect-[4/5] w-full bg-[#F7F6F4] overflow-hidden cursor-pointer"
                    >
                      {/* Distintivos superiores flotantes sobre la imagen */}
                      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                        <div>
                          {prod.tiene_promocion ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-drea-burgundy text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                              {discountBadgeText}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] uppercase tracking-editorial text-drea-ink font-semibold shadow-xs border border-white/60">
                              {prod.marca.nombre}
                            </span>
                          )}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center shadow-xs border border-white/60">
                          <Flame className="w-3.5 h-3.5 fill-drea-burgundy text-drea-burgundy" />
                        </div>
                      </div>

                      <ProgressiveImage
                        src={prod.imagen.url}
                        alt={prod.nombre}
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Contenido inferior con padding */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Selector rápido de tamaños en la tarjeta */}
                        {variantsList.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
                            {variantsList.map((v) => {
                              const isCurrent = selectedVar?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVariantByProd((prev) => ({
                                      ...prev,
                                      [prod.id]: v.id,
                                    }))
                                  }
                                  className={`text-[11px] px-2 py-0.5 transition-colors ${
                                    isCurrent
                                      ? 'font-bold text-drea-ink border-b-2 border-drea-burgundy'
                                      : 'text-drea-ink-muted hover:text-drea-ink'
                                  }`}
                                >
                                  {v.tamano_ml}ml
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Nombre y Familia */}
                        <div className="text-center px-1">
                          <h3
                            onClick={() => openProductDetail(prod)}
                            className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-drea-ink group-hover:text-drea-burgundy transition-colors cursor-pointer line-clamp-1"
                          >
                            {prod.nombre}
                          </h3>
                          <p className="text-[11px] text-drea-ink-muted mt-1 font-serif italic">
                            {prod.marca.nombre} · {prod.concentracion}
                            {prod.familia_olfativa ? ` · ${prod.familia_olfativa.nombre}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Precio en COP y Botones */}
                      <div className="mt-4 pt-3 border-t border-drea-canvas-border/70 text-center space-y-2.5">
                        {selectedVar ? (
                          <div>
                            {selectedVar.tiene_promocion ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs text-drea-ink-muted line-through">
                                  {selectedVar.precio_base_cop}
                                </span>
                                <span className="text-sm sm:text-base font-bold text-drea-ink">
                                  {selectedVar.precio_final_cop} COP
                                </span>
                              </div>
                            ) : hasPriceRange && !chosenVarId ? (
                              <div className="text-sm font-bold text-drea-ink">
                                {formatCop(minPrice)} - {formatCop(maxPrice)} COP
                              </div>
                            ) : (
                              <div className="text-sm sm:text-base font-bold text-drea-ink">
                                {selectedVar.precio_final_cop} COP
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-drea-ink">Consultar</div>
                        )}

                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-drea-ink-muted">
                          <span>
                            {variantsList.length}{' '}
                            {variantsList.length === 1 ? 'Opción disponible' : 'Opciones disponibles'}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-drea-gold inline-block" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onAddToCart(prod, selectedVar)}
                            className="drea-btn-dark py-2 px-2.5 text-[10px]"
                          >
                            + Carrito
                          </button>
                          <button
                            type="button"
                            disabled={!selectedVar || sendingWhatsapp}
                            onClick={() =>
                              selectedVar &&
                              onDirectWhatsApp([{ variante_id: selectedVar.id, cantidad: 1 }])
                            }
                            className="drea-btn-primary py-2 px-2.5 text-[10px]"
                          >
                            Comprar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          2. RECUADROS DE CATEGORÍAS: HOMBRE · MUJER · KITS · NICHO
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="drea-eyebrow text-drea-burgundy">
            UNIVERSOS OLFATIVOS · EXPLORACIÓN POR ESTILO
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-drea-ink mt-1">
            Explora por Categoría
          </h2>
          <p className="text-xs sm:text-sm text-drea-ink-muted mt-2">
            Selecciona el universo que deseas descubrir para ingresar al catálogo con nuestros
            filtros especializados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryBoxes.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigateCatalog(cat.filterAction)}
              style={{ background: cat.bgGradient }}
              className="group relative h-80 sm:h-96 p-3.5 text-left overflow-hidden border border-drea-gold/30 hover:border-drea-gold transition-all duration-500 shadow-editorial hover:shadow-luxury"
            >
              {/* Contenedor interior delimitado por la línea dorada: de la línea hacia afuera queda el degradado; de la línea hacia adentro va la imagen */}
              <div className="relative w-full h-full border border-drea-gold/35 group-hover:border-drea-gold transition-colors overflow-hidden flex flex-col justify-end p-5">
                {/* Imagen responsiva dentro del marco interior (Sin degradado encima para ver la foto natural) */}
                {/* Skeleton Shimmer mientras descarga la foto de la categoría */}
                {!loadedCategories[cat.id] && (
                  <div className="absolute inset-0 z-0 flex items-center justify-center bg-black/40">
                    <div className="w-full h-full animate-pulse bg-gradient-to-t from-[#2B1921] to-[#141414]" />
                    <div className="absolute w-6 h-6 rounded-full border-2 border-drea-gold/30 border-t-drea-gold animate-spin" />
                  </div>
                )}

                <img
                  src={cat.imageUrl}
                  alt={cat.title}
                  loading="lazy"
                  onLoad={() => setLoadedCategories((prev) => ({ ...prev, [cat.id]: true }))}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0';
                  }}
                  className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out ${
                    loadedCategories[cat.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Título limpio sobre la imagen (CABALLERO · DAMA · KITS · NICHO) */}
                <div className="relative z-10 flex items-end justify-between gap-2 pt-2">
                  <h3 className="font-serif text-3xl sm:text-4xl font-semibold tracking-wider text-white group-hover:text-drea-gold-light transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                    {cat.title}
                  </h3>
                  <ArrowRight className="w-5 h-5 text-drea-gold-light mb-1.5 group-hover:translate-x-1 transition-transform drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================================
          3. INFORMACIÓN DE LA MARCA, SHOWROOM, HORARIO Y REDES SOCIALES
      ===================================================================== */}
      <section className="bg-drea-ink text-white border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 space-y-12">
          {/* Estructura dividida en 2 Columnas Principales: 1) Datos / Redes  2) Reel Vertical */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            
            {/* COLUMNA 1: Datos de la Marca + WhatsApp + Instagram (7 columnas) */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-8 text-left">
              {/* Identidad de Marca & Showroom */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-sm overflow-hidden bg-drea-burgundy flex items-center justify-center border border-drea-gold/40 shadow-lg shrink-0">
                    <img
                      src={DREA_BRAND.assets.logo}
                      alt={DREA_BRAND.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-xs sm:text-sm uppercase tracking-[0.26em] text-drea-gold-light font-semibold block font-sans">
                      {DREA_BRAND.contact.headline}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1 text-sm text-white/85">
                  <p className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-drea-gold-light shrink-0" />
                    <span>{DREA_BRAND.contact.showroom}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-drea-gold-light shrink-0" />
                    <span>{DREA_BRAND.contact.schedule}</span>
                  </p>
                </div>
              </div>

              {/* Tarjetas de Contacto: WhatsApp e Instagram en 1 Columna estructurada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Tarjeta WhatsApp */}
                <div className="bg-white/[0.03] border border-white/15 hover:border-white/35 p-6 flex flex-col justify-between space-y-5 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-white/60 text-[11px] uppercase tracking-editorial font-semibold">
                      <Phone className="w-3.5 h-3.5 text-white/70" />
                      <span>WhatsApp Oficial</span>
                    </div>
                    <h3 className="font-sans text-xl sm:text-2xl font-semibold tracking-wider tabular-nums text-white">
                      {DREA_BRAND.contact.whatsappDisplay}
                    </h3>
                  </div>
                  <a
                    href={DREA_BRAND.contact.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-drea-burgundy hover:bg-drea-burgundy-dark text-white border border-white/15 text-xs uppercase tracking-editorial font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Escribir por WhatsApp</span>
                  </a>
                </div>

                {/* Tarjeta Instagram */}
                <div className="bg-white/[0.03] border border-white/15 hover:border-white/35 p-6 flex flex-col justify-between space-y-5 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-white/60 text-[11px] uppercase tracking-editorial font-semibold">
                      <Instagram className="w-3.5 h-3.5 text-white/70" />
                      <span>Instagram Oficial</span>
                    </div>
                    <h3 className="font-sans text-xl sm:text-2xl font-semibold tracking-wide text-white">
                      {DREA_BRAND.contact.instagramHandle}
                    </h3>
                  </div>
                  <a
                    href={DREA_BRAND.contact.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-drea-burgundy text-white border border-white/25 hover:border-drea-burgundy text-xs uppercase tracking-editorial font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md"
                  >
                    <Instagram className="w-4 h-4 text-white" />
                    <span>Seguir en Instagram</span>
                  </a>
                </div>
              </div>

              {/* Beneficios de Confianza: +5 Años, Envíos 72h, Pagos Seguros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 5 Años de Experiencia */}
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/15 hover:border-white/30 p-3.5 transition-colors">
                  <Award className="w-5 h-5 text-drea-gold-light shrink-0" />
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white tracking-wide">
                      +5 Años
                    </p>
                    <p className="text-[11px] text-white/60">
                      De experiencia
                    </p>
                  </div>
                </div>

                {/* Envíos Rápidos */}
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/15 hover:border-white/30 p-3.5 transition-colors">
                  <Truck className="w-5 h-5 text-drea-gold-light shrink-0" />
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white tracking-wide">
                      Envíos Rápidos
                    </p>
                    <p className="text-[11px] text-white/60">
                      Máximo 72 horas
                    </p>
                  </div>
                </div>

                {/* Pagos Seguros */}
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/15 hover:border-white/30 p-3.5 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-drea-gold-light shrink-0" />
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white tracking-wide">
                      Pagos Seguros
                    </p>
                    <p className="text-[11px] text-white/60">
                      100% garantizados
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: Reproductor de Reel en Formato Vertical (5 columnas) */}
            <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
              <a
                href={DREA_BRAND.contact.instagramUrl}
                target="_blank"
                rel="noreferrer"
                title="Ver Reel en Instagram (@perfumeshopcucuta)"
                aria-label="Reproducir Reel en Instagram"
                className="group relative block w-full max-w-[270px] sm:max-w-[290px] aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-[#2B1921] to-[#141414] border border-white/20 hover:border-drea-gold/60 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(122,12,53,0.4)]"
              >
                {/* Video del Reel en Loop Silenciado */}
                <video
                  src="/assets/videos/reel.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Badge Superior Izquierdo: Instagram Handle */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-medium shadow-md">
                  <Instagram className="w-3.5 h-3.5 text-drea-gold-light" />
                  <span>{DREA_BRAND.contact.instagramHandle}</span>
                </div>

                {/* Badge Superior Derecho: Indicador de Reproducción Activa */}
                <div className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                </div>

                {/* Overlay Inferior: Gradiente y Botón Flotante para ir a Instagram */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col items-center gap-2 text-center">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/80 font-semibold drop-shadow-sm">
                    Reel Oficial DREA
                  </span>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-drea-burgundy/90 group-hover:bg-drea-burgundy text-white text-[11px] font-bold tracking-wider uppercase rounded-full border border-white/30 transition-all duration-300 group-hover:scale-105 shadow-lg">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Ver en Instagram</span>
                  </div>
                </div>
              </a>
            </div>

          </div>

          {/* Derechos Reservados & Enlaces */}
          <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-white/50">
            <span>
              © {new Date().getFullYear()} {DREA_BRAND.name} · Cúcuta. Todos los derechos
              reservados.
            </span>
            <div className="flex items-center gap-6 font-sans tabular-nums">
              <a
                href={DREA_BRAND.contact.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram ({DREA_BRAND.contact.instagramHandle})
              </a>
              <a
                href={DREA_BRAND.contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp ({DREA_BRAND.contact.whatsappDisplay})
              </a>
            </div>
          </div>

          {/* Franja Oficial de Autoría: INNOVA */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="italic leading-snug">
              <span className="block text-white/90 text-sm sm:text-base font-normal tracking-wide">
                Las ideas no tienen límites,
              </span>
              <span className="block text-[#B81B4F] text-sm sm:text-base font-bold tracking-wide">
                nosotros les damos forma.
              </span>
            </div>

            <div className="flex items-center text-xs sm:text-sm text-white/75 tracking-wide font-sans">
              <span>
                Diseñado y desarrollado por{' '}
                <strong className="text-white font-extrabold tracking-wider">INNOVA</strong>
              </span>
              <span className="mx-3 text-white/30 font-light">|</span>
              <span className="tabular-nums">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
