import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { DREA_BRAND } from '../../config/brand.config';
import {
  CatalogFiltersState,
  Producto,
  VarianteProducto,
} from '../../types/catalog';

interface ProductDetailViewProps {
  productoSlug: string;
  initialProducto?: Producto | null;
  relatedProductos: Producto[];
  sendingWhatsapp: boolean;
  onNavigate: (next: CatalogFiltersState) => void;
  onGoBack?: () => void;
  onOpenProduct: (producto: Producto) => void;
  onAddToCart: (
    producto: Producto,
    variante?: VarianteProducto,
    cantidad?: number
  ) => void;
  onDirectWhatsApp: (
    items: { variante_id: number; cantidad: number }[]
  ) => void;
}

function formatCop(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productoSlug,
  initialProducto,
  relatedProductos,
  sendingWhatsapp,
  onNavigate,
  onGoBack,
  onOpenProduct,
  onAddToCart,
  onDirectWhatsApp,
}) => {
  const [producto, setProducto] = useState<Producto | null>(
    initialProducto ?? null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVarId, setSelectedVarId] = useState<number | null>(
    initialProducto?.variantes?.[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [openDescription, setOpenDescription] = useState<boolean>(true);
  const [openPiramide, setOpenPiramide] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQuantity(1);

    fetch(`/api/productos/${encodeURIComponent(productoSlug)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        if (res?.ok && res.data) {
          const loaded = res.data as Producto;
          setProducto(loaded);
          const firstAvail =
            loaded.variantes.find((v) => v.disponible !== false) ??
            loaded.variantes[0];
          setSelectedVarId(firstAvail?.id ?? null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productoSlug]);

  if (loading && !producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 h-[520px] bg-white border border-drea-canvas-border animate-pulse" />
          <div className="lg:col-span-6 space-y-6">
            <div className="h-6 w-48 bg-white border border-drea-canvas-border animate-pulse" />
            <div className="h-12 w-3/4 bg-white border border-drea-canvas-border animate-pulse" />
            <div className="h-24 w-full bg-white border border-drea-canvas-border animate-pulse" />
            <div className="h-14 w-full bg-white border border-drea-canvas-border animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl text-drea-ink">
          No encontramos este perfume en el catálogo.
        </h1>
        <button
          type="button"
          onClick={() =>
            onNavigate({ view: 'catalogo', tituloSeccion: 'Catálogo Completo' })
          }
          className="drea-btn-primary"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const activeVariants = producto.variantes.filter(
    (v) => v.disponible !== false
  );
  const variantsList =
    activeVariants.length > 0 ? activeVariants : producto.variantes;

  const selectedVar =
    variantsList.find((v) => v.id === selectedVarId) ?? variantsList[0];

  const finalPrices = variantsList.map((v) => v.precio_final);
  const minPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
  const maxPrice = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;
  const hasPriceRange = variantsList.length > 1 && minPrice !== maxPrice;

  const promoVariant =
    selectedVar?.tiene_promocion && selectedVar.promocion
      ? selectedVar
      : variantsList.find((v) => v.tiene_promocion && v.promocion);

  const discountBadgeText = promoVariant?.promocion?.etiqueta
    ? `SALE ${promoVariant.promocion.etiqueta}`
    : 'SALE';

  const hasPiramideNotes =
    producto.piramide_olfativa &&
    ((producto.piramide_olfativa.Salida?.length ?? 0) > 0 ||
      (producto.piramide_olfativa.Corazón?.length ?? 0) > 0 ||
      (producto.piramide_olfativa.Fondo?.length ?? 0) > 0);

  const filteredRelated = relatedProductos
    .filter((p) => p.id !== producto.id)
    .slice(0, 4);

  return (
    <div className="w-full pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
        {/* ===================================================================
             SECCIÓN PRINCIPAL DE 2 COLUMNAS: IMAGEN A LA IZQUIERDA | DETALLES A LA DERECHA
        =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* COLUMNA IZQUIERDA: IMAGEN ÚNICA DEL PRODUCTO CON BADGE DE DESCUENTO (Sin marco gris interno) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="relative bg-[#F7F6F4] border border-[#EAE8E4] aspect-[4/5] flex items-center justify-center overflow-hidden group">
              {/* Distintivos superiores sobre la imagen (SALE -15% / Destacado) */}
              <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
                <div>
                  {(selectedVar?.tiene_promocion || producto.tiene_promocion) && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-drea-burgundy text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                      <Tag className="w-3.5 h-3.5 text-drea-gold-light" />
                      <span>{discountBadgeText}</span>
                    </span>
                  )}
                </div>
                <div>
                  {producto.destacado && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 border border-drea-gold/50 text-[10px] uppercase tracking-editorial font-semibold text-drea-burgundy">
                      <Flame className="w-3.5 h-3.5 fill-drea-burgundy text-drea-burgundy" />
                      <span>Destacado</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Imagen adaptada al marco editorial con object-cover */}
              <img
                src={producto.imagen.url}
                alt={producto.nombre}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* COLUMNA DERECHA: NOMBRE, PRECIOS, TAMAÑOS, CANTIDAD, BOTONES Y DESCRIPCIÓN */}
          <div className="lg:col-span-6 space-y-6">
            {/* Breadcrumb + Botón Volver */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-drea-canvas-border pb-3">
              <nav className="flex flex-wrap items-center gap-1.5 text-xs text-drea-ink-muted">
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'home' })}
                  className="hover:text-drea-burgundy transition-colors"
                >
                  Inicio
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate({
                      view: 'catalogo',
                      genero: producto.genero,
                      tituloSeccion: `Perfumes para ${producto.genero}`,
                    })
                  }
                  className="hover:text-drea-burgundy transition-colors"
                >
                  {producto.genero}
                </button>
                <span>/</span>
                <span className="font-semibold text-drea-ink">
                  {producto.nombre}
                </span>
              </nav>

              <button
                type="button"
                onClick={() =>
                  onGoBack
                    ? onGoBack()
                    : onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Catálogo Completo',
                      })
                }
                className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-drea-burgundy hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            </div>

            {/* Marca, Nombre del Perfume y Subtítulo Olfativo */}
            <div>
              <span className="drea-eyebrow text-drea-burgundy">
                {producto.marca.nombre} · {producto.concentracion}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-drea-ink mt-1 leading-tight">
                {producto.nombre}{' '}
                {selectedVar ? `${selectedVar.tamano_ml} ml` : ''}
              </h1>
              <p className="text-xs sm:text-sm text-drea-ink-muted mt-1.5">
                Perfume 100% original · Género:{' '}
                <strong className="text-drea-ink">{producto.genero}</strong>
                {producto.familia_olfativa ? (
                  <>
                    {' '}
                    · Familia Olfativa:{' '}
                    <strong className="text-drea-ink">
                      {producto.familia_olfativa.nombre}
                    </strong>
                  </>
                ) : null}
              </p>
            </div>

            {/* Bloque de Precios y Descuento Activo (En Pesos Colombianos COP) */}
            <div className="bg-white border border-drea-canvas-border p-5 space-y-2">
              {hasPriceRange && (
                <p className="text-xs uppercase tracking-wider text-drea-ink-muted">
                  Rango por presentación:{' '}
                  <span className="font-semibold text-drea-ink">
                    {formatCop(minPrice)} – {formatCop(maxPrice)}
                  </span>
                </p>
              )}

              {selectedVar ? (
                <div className="space-y-1.5">
                  {selectedVar.tiene_promocion ? (
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-base sm:text-lg text-drea-ink-muted line-through">
                        {selectedVar.precio_base_cop}
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-drea-burgundy">
                        {selectedVar.precio_final_cop} COP
                      </span>
                      <span className="px-2.5 py-1 bg-drea-burgundy/10 border border-drea-burgundy/30 text-drea-burgundy text-[11px] font-bold uppercase tracking-wider">
                        {selectedVar.promocion?.etiqueta ?? 'SALE'} · Ahorras{' '}
                        {selectedVar.ahorro_cop}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-drea-ink">
                        {selectedVar.precio_final_cop} COP
                      </span>
                    </div>
                  )}

                  {quantity > 1 && (
                    <p className="text-xs text-drea-ink-muted pt-1">
                      Subtotal por {quantity} unidades:{' '}
                      <strong className="text-drea-ink font-bold">
                        {formatCop(selectedVar.precio_final * quantity)} COP
                      </strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xl font-bold text-drea-ink">
                  Consultar disponibilidad
                </p>
              )}
            </div>

            {/* Selector de Tamaño / Presentación (Recuadros con tamaño + precio marcables) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-editorial font-semibold text-drea-ink">
                  Tamaño y Presentación:
                </label>
                {selectedVar && (
                  <span className="text-xs text-drea-ink-muted">
                    Seleccionado:{' '}
                    <strong className="text-drea-ink">
                      {selectedVar.tamano_ml}ml ({selectedVar.tipo_presentacion})
                    </strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variantsList.map((v) => {
                  const isSelected = selectedVar?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVarId(v.id)}
                      className={`p-3.5 border text-left transition-all relative ${
                        isSelected
                          ? 'border-2 border-drea-burgundy bg-drea-burgundy/5 shadow-xs'
                          : 'border-drea-canvas-border bg-white hover:border-drea-gold'
                      }`}
                    >
                      {v.tiene_promocion && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-drea-burgundy text-white text-[9px] font-bold uppercase tracking-wider">
                          {v.promocion?.etiqueta ?? 'SALE'}
                        </span>
                      )}
                      <div className="text-xs font-bold text-drea-ink uppercase tracking-wider">
                        {v.tamano_ml} ml · {v.tipo_presentacion}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        {v.tiene_promocion && (
                          <span className="text-[10px] text-drea-ink-muted line-through">
                            {v.precio_base_cop}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-drea-burgundy' : 'text-drea-ink'
                          }`}
                        >
                          {v.precio_final_cop}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Cantidad (- 1 +) + Botones AÑADIR AL CARRITO y COMPRAR AHORA */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Control de Cantidad (- 1 +) */}
                <div className="inline-flex items-center justify-between border border-drea-canvas-border bg-white h-12 px-2 sm:w-36 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Disminuir cantidad"
                    className="w-9 h-9 flex items-center justify-center text-drea-ink hover:text-drea-burgundy transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-drea-ink px-3 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Aumentar cantidad"
                    className="w-9 h-9 flex items-center justify-center text-drea-ink hover:text-drea-burgundy transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Botón AÑADIR AL CARRITO */}
                <button
                  type="button"
                  disabled={!selectedVar}
                  onClick={() =>
                    selectedVar && onAddToCart(producto, selectedVar, quantity)
                  }
                  className="flex-1 h-12 drea-btn-dark text-xs tracking-editorial uppercase font-semibold"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>AÑADIR AL CARRITO</span>
                </button>
              </div>

              {/* Botón COMPRAR AHORA (Redirige a WhatsApp con el producto y cantidad seleccionada) */}
              <button
                type="button"
                disabled={!selectedVar || sendingWhatsapp}
                onClick={() =>
                  selectedVar &&
                  onDirectWhatsApp([
                    { variante_id: selectedVar.id, cantidad: quantity },
                  ])
                }
                className="w-full h-13 drea-btn-primary text-xs tracking-editorial uppercase font-semibold shadow-editorial"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {sendingWhatsapp
                    ? 'CONECTANDO CON WHATSAPP...'
                    : 'COMPRAR AHORA POR WHATSAPP'}
                </span>
              </button>
            </div>

            {/* ===============================================================
                DESCRIPCIÓN, FAMILIA OLFATIVA Y PIRÁMIDE DE NOTAS (Debajo de los botones)
            =============================================================== */}
            <div className="pt-4 border-t border-drea-canvas-border space-y-4">
              {/* Acordeón 1: Descripción & ¿A qué huele? */}
              <div className="border-b border-drea-canvas-border pb-4">
                <button
                  type="button"
                  onClick={() => setOpenDescription(!openDescription)}
                  className="w-full flex items-center justify-between py-2 text-left"
                >
                  <span className="text-xs uppercase tracking-editorial font-bold text-drea-ink">
                    Descripción &amp; Perfil Olfativo
                  </span>
                  {openDescription ? (
                    <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
                  )}
                </button>

                {openDescription && (
                  <div className="mt-3 space-y-4 text-xs sm:text-sm text-drea-ink-body leading-relaxed">
                    <h3 className="font-serif text-xl font-semibold text-drea-ink">
                      Conoce un poco más sobre {producto.nombre}
                    </h3>
                    <p>
                      {producto.descripcion ??
                        `${producto.nombre} de ${producto.marca.nombre} es una fragancia original en concentración ${producto.concentracion}, seleccionada por DREA PERFUMES por su carácter y excelente fijación.`}
                    </p>

                    {/* Ficha Técnica Rápida */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-white border border-drea-canvas-border p-3">
                        <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted">
                          Maison / Marca
                        </span>
                        <span className="font-semibold text-xs text-drea-ink">
                          {producto.marca.nombre}
                        </span>
                      </div>
                      <div className="bg-white border border-drea-canvas-border p-3">
                        <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted">
                          Familia Olfativa
                        </span>
                        <span className="font-semibold text-xs text-drea-burgundy">
                          {producto.familia_olfativa?.nombre ?? 'Selecta'}
                        </span>
                      </div>
                      <div className="bg-white border border-drea-canvas-border p-3">
                        <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted">
                          Concentración
                        </span>
                        <span className="font-semibold text-xs text-drea-ink">
                          {producto.concentracion}
                        </span>
                      </div>
                      <div className="bg-white border border-drea-canvas-border p-3">
                        <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted">
                          Género
                        </span>
                        <span className="font-semibold text-xs text-drea-ink">
                          {producto.genero}
                        </span>
                      </div>
                    </div>

                    {producto.ocasion_uso && (
                      <p className="text-xs text-drea-ink-muted">
                        <strong className="text-drea-ink uppercase tracking-wider">
                          Ocasión de uso recomendada:
                        </strong>{' '}
                        {producto.ocasion_uso}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Acordeón 2: Pirámide Olfativa (Notas de Salida, Corazón y Fondo) */}
              {hasPiramideNotes && (
                <div className="border-b border-drea-canvas-border pb-4">
                  <button
                    type="button"
                    onClick={() => setOpenPiramide(!openPiramide)}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-editorial font-bold text-drea-burgundy">
                      <Sparkles className="w-4 h-4" />
                      <span>Pirámide Olfativa (Composición de Notas)</span>
                    </span>
                    {openPiramide ? (
                      <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
                    )}
                  </button>

                  {openPiramide && (
                    <div className="mt-3 space-y-3 bg-white border border-drea-canvas-border p-4">
                      {(['Salida', 'Corazón', 'Fondo'] as const).map((etapa) => {
                        const notas = producto.piramide_olfativa?.[etapa] ?? [];
                        if (notas.length === 0) return null;
                        return (
                          <div
                            key={etapa}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 border-b last:border-b-0 border-drea-canvas-border/60 pb-2.5 last:pb-0"
                          >
                            <span className="w-28 shrink-0 text-[11px] uppercase tracking-wider font-bold text-drea-ink">
                              Notas de {etapa}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {notas.map((n) => (
                                <span
                                  key={n.id}
                                  className="px-2.5 py-1 bg-drea-canvas border border-drea-canvas-border text-xs text-drea-ink-body"
                                >
                                  {n.nombre}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sello de Showroom y Atención Personalizada DREA PERFUMES */}
              <div className="bg-drea-ink text-white p-5 border border-drea-gold/40 space-y-2 text-xs">
                <p className="text-drea-gold font-bold uppercase tracking-editorial">
                  {DREA_BRAND.contact.headline} · {DREA_BRAND.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/85 pt-1">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-drea-gold shrink-0" />
                    {DREA_BRAND.contact.showroom}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-drea-gold shrink-0" />
                    {DREA_BRAND.contact.schedule}
                  </span>
                </div>
                <p className="text-drea-gold-light pt-1">
                  ✨ {DREA_BRAND.contact.advisory}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECCIÓN INFERIOR: FRAGANCIAS RELACIONADAS
        =================================================================== */}
        {filteredRelated.length > 0 && (
          <section className="mt-20 pt-12 border-t border-drea-canvas-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="drea-eyebrow text-drea-burgundy">
                  DESCUBRE MÁS DE NUESTRA COLECCIÓN
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-drea-ink mt-1">
                  También te puede interesar
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredRelated.map((rel) => {
                const relVar = rel.variantes[0];
                return (
                  <article
                    key={rel.id}
                    onClick={() => onOpenProduct(rel)}
                    className="bg-white border border-drea-canvas-border hover:border-drea-gold hover:shadow-luxury transition-all p-3 sm:p-5 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square sm:aspect-[4/5] bg-[#F7F6F4] flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
                        <img
                          src={rel.imagen.url}
                          alt={rel.nombre}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-wider text-drea-ink group-hover:text-drea-burgundy text-center line-clamp-1">
                        {rel.nombre} · {rel.marca.nombre}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-drea-ink-muted text-center font-serif italic mt-0.5 sm:mt-1">
                        {rel.concentracion} · {rel.genero}
                      </p>
                    </div>
                    <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-drea-canvas-border text-center">
                      <span className="text-xs sm:text-sm font-bold text-drea-ink">
                        {relVar ? `${relVar.precio_final_cop} COP` : 'Consultar'}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
