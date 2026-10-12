import React, { useEffect, useState, useMemo } from 'react';
import { MessageCircle, ShoppingBag, Trash2, X, Sparkles } from 'lucide-react';
import { Header } from './components/layout/Header';
import { HeroBanner } from './components/home/HeroBanner';
import { DREA_BRAND } from './config/brand.config';
import {
  CartItem,
  CatalogFiltersState,
  FamiliaOlfativa,
  Producto,
  VarianteProducto,
} from './types/catalog';

function formatCop(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO');
}

export const App: React.FC = () => {
  const [filters, setFilters] = useState<CatalogFiltersState>({ view: 'home' });
  const [familias, setFamilias] = useState<FamiliaOlfativa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('573000000000');

  // Estado del Carrito de Compras (Sin Login)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState<boolean>(false);

  // Cargar Familias Olfativas y Configuración de Contacto al iniciar
  useEffect(() => {
    fetch('/api/catalogo/filtros')
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && Array.isArray(res.data?.familias_olfativas)) {
          setFamilias(res.data.familias_olfativas);
        }
      })
      .catch(() => {});

    fetch('/api/contacto')
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && res.data?.numero_whatsapp) {
          setWhatsappNumber(res.data.numero_whatsapp);
        }
      })
      .catch(() => {});
  }, []);

  // Consultar productos cada vez que cambie algún filtro del Header
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.genero) params.set('genero', filters.genero);
    if (filters.familia) params.set('familia', String(filters.familia));
    if (filters.marca) params.set('marca', filters.marca);
    if (filters.tipo_presentacion) params.set('tipo_presentacion', filters.tipo_presentacion);
    if (filters.en_promocion) params.set('en_promocion', '1');
    if (filters.orden) params.set('orden', filters.orden);

    fetch(`/api/productos?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && Array.isArray(res.data?.items)) {
          setProductos(res.data.items);
        }
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.cantidad, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + item.variante.precio_final * item.cantidad,
        0
      ),
    [cart]
  );

  const handleAddToCart = (producto: Producto, variante?: VarianteProducto) => {
    const selectedVar = variante ?? producto.variantes[0];
    if (!selectedVar) return;

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variante.id === selectedVar.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
        return updated;
      }
      return [...prev, { producto, variante: selectedVar, cantidad: 1 }];
    });
    setCartOpen(true);
  };

  const handleRemoveFromCart = (varianteId: number) => {
    setCart((prev) => prev.filter((i) => i.variante.id !== varianteId));
  };

  const handleCheckoutWhatsApp = async (itemsPayload: { variante_id: number; cantidad: number }[]) => {
    setSendingWhatsapp(true);
    try {
      const res = await fetch('/api/checkout/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });
      const json = await res.json();
      if (json?.ok && json.data?.whatsapp_url) {
        window.open(json.data.whatsapp_url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setSendingWhatsapp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-drea-canvas text-drea-ink">
      {/* 1. COMPONENTE HEADER CONSTANTE */}
      <Header
        currentFilters={filters}
        familiasOlfativas={
          familias.length > 0
            ? familias
            : DREA_BRAND.sensoryFamilies.map((f, i) => ({
                id: i + 1,
                nombre: f.nombre,
                descripcion: f.microdescripcion,
              }))
        }
        cartCount={cartCount}
        cartTotalCop={formatCop(cartTotal)}
        whatsappNumber={whatsappNumber}
        onNavigate={(next) => setFilters(next)}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* 2. COMPONENTE HERO BANNER (Se muestra en la vista principal 'home') */}
      {filters.view === 'home' && (
        <HeroBanner onActionClick={(next) => setFilters(next)} />
      )}

      {/* 3. SECCIÓN PRINCIPAL DE PREVISUALIZACIÓN DE PRODUCTOS / FILTROS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-drea-canvas-border pb-4">
          <div>
            <span className="drea-eyebrow text-drea-burgundy">
              {filters.view === 'home'
                ? 'SELECCIÓN DESTACADA · MOSTADOR DIGITAL'
                : 'EXPLORACIÓN DEL CATÁLOGO'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-drea-ink mt-1">
              {filters.tituloSeccion ?? 'Fragancias Destacadas'}
            </h2>
          </div>

          {filters.view !== 'home' && (
            <button
              type="button"
              onClick={() => setFilters({ view: 'home' })}
              className="text-xs uppercase tracking-wider text-drea-burgundy hover:underline font-semibold"
            >
              ← Volver al Inicio
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 bg-white border border-drea-canvas-border animate-pulse p-6"
              />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="bg-white border border-drea-canvas-border p-12 text-center space-y-4">
            <p className="font-serif text-2xl text-drea-ink">
              No encontramos fragancias con este filtro específico.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({ view: 'catalogo', tituloSeccion: 'Catálogo Completo' })
              }
              className="drea-btn-primary"
            >
              Ver Todo el Catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {productos.map((prod) => {
              const mainVar = prod.variantes[0];
              return (
                <article
                  key={prod.id}
                  className="drea-product-card flex flex-col justify-between p-6 group"
                >
                  <div>
                    {/* Distintivos superiores */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] uppercase tracking-editorial text-drea-ink-muted font-semibold">
                        {prod.marca.nombre} · {prod.concentracion}
                      </span>
                      {prod.tiene_promocion ? (
                        <span className="drea-badge-sale">Oferta</span>
                      ) : prod.destacado ? (
                        <span className="drea-badge-featured">Destacado</span>
                      ) : null}
                    </div>

                    {/* Imagen del Producto (con fallback elegante) */}
                    <div className="relative h-56 w-full bg-drea-canvas flex items-center justify-center mb-5 overflow-hidden">
                      <img
                        src={prod.imagen.url}
                        alt={prod.nombre}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Nombre, Familia y Género */}
                    <h3 className="font-serif text-2xl font-semibold text-drea-ink group-hover:text-drea-burgundy transition-colors">
                      {prod.nombre}
                    </h3>
                    <p className="text-xs text-drea-ink-muted mt-1">
                      {prod.genero}
                      {prod.familia_olfativa ? ` · Familia ${prod.familia_olfativa.nombre}` : ''}
                    </p>
                    {prod.descripcion && (
                      <p className="text-xs text-drea-ink-body mt-2.5 line-clamp-2 leading-relaxed">
                        {prod.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Precio en COP y Acciones */}
                  <div className="mt-6 pt-4 border-t border-drea-canvas-border space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-drea-ink-muted">
                        Desde
                      </span>
                      <span className="font-sans text-lg font-bold text-drea-ink">
                        {prod.precio_desde_cop ?? 'Consultar'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(prod, mainVar)}
                        className="drea-btn-dark py-2.5 px-3 text-[11px]"
                      >
                        + Carrito
                      </button>
                      <button
                        type="button"
                        disabled={!mainVar || sendingWhatsapp}
                        onClick={() =>
                          mainVar &&
                          handleCheckoutWhatsApp([{ variante_id: mainVar.id, cantidad: 1 }])
                        }
                        className="drea-btn-primary py-2.5 px-3 text-[11px]"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. DRAWER LATERAL DEL CARRITO DE COMPRAS -> WHATSAPP */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-drea-canvas-border pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-drea-burgundy" />
                <h3 className="font-serif text-2xl font-semibold">Tu Selección</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-drea-ink-muted hover:text-drea-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-drea-ink-muted text-center py-12">
                  Tu bolsa de compras está vacía. Explora el catálogo para agregar fragancias.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variante.id}
                    className="flex items-center justify-between gap-3 border-b border-drea-canvas-border pb-3"
                  >
                    <div>
                      <p className="font-serif text-lg font-semibold text-drea-ink">
                        {item.producto.marca.nombre} · {item.producto.nombre}
                      </p>
                      <p className="text-xs text-drea-ink-muted">
                        {item.variante.etiqueta} · Cant: {item.cantidad}
                      </p>
                      <p className="text-xs font-bold text-drea-burgundy mt-1">
                        {formatCop(item.variante.precio_final * item.cantidad)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.variante.id)}
                      className="p-1.5 text-drea-ink-muted hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-drea-canvas-border pt-4 space-y-4">
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total Estimado (COP)</span>
                  <span className="text-drea-burgundy">{formatCop(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  disabled={sendingWhatsapp}
                  onClick={() =>
                    handleCheckoutWhatsApp(
                      cart.map((i) => ({
                        variante_id: i.variante.id,
                        cantidad: i.cantidad,
                      }))
                    )
                  }
                  className="w-full drea-btn-primary py-3.5 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Confirmar Pedido por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. BOTÓN FLOTANTE DE WHATSAPP (Como en los pantallazos de Mafer y Real) */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Atención directa por WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-3 rounded-full shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline text-xs font-semibold tracking-wide">
          ¿Dudas? Escríbenos
        </span>
      </a>
    </div>
  );
};
