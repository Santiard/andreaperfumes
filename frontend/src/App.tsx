import React, { useEffect, useState, useMemo } from 'react';
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Header } from './components/layout/Header';
import { HeroBanner } from './components/home/HeroBanner';
import { HomeView } from './components/home/HomeView';
import { CatalogView } from './components/catalog/CatalogView';
import { ProductDetailView } from './components/catalog/ProductDetailView';
import { AdminPanel } from './components/admin/AdminPanel';
import { DREA_BRAND } from './config/brand.config';
import {
  CartItem,
  CatalogFiltersState,
  CatalogPublicFiltersMeta,
  FamiliaOlfativa,
  Producto,
  VarianteProducto,
} from './types/catalog';

function formatCop(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO');
}

export const App: React.FC = () => {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const isAdminRoute = pathname === '/drea-admin' || pathname === '/admin';

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  const initialProductSlug = pathname.startsWith('/perfume/')
    ? decodeURIComponent(pathname.replace(/^\/perfume\//, ''))
    : undefined;

  const [filters, setFilters] = useState<CatalogFiltersState>(
    initialProductSlug
      ? { view: 'producto', productoSlug: initialProductSlug }
      : { view: 'home' }
  );
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [catalogMeta, setCatalogMeta] = useState<CatalogPublicFiltersMeta | null>(null);
  const [familias, setFamilias] = useState<FamiliaOlfativa[]>([]);

  // Perfumes seleccionados por el Administrador para el Carrusel de Inicio (Home)
  const [featuredProductos, setFeaturedProductos] = useState<Producto[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);

  // Perfumes filtrados en la página de Catálogo
  const [productos, setProductos] = useState<Producto[]>([]);
  const [totalProductos, setTotalProductos] = useState<number>(0);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    DREA_BRAND.contact.whatsappNumber
  );

  // Estado del Carrito de Compras (Sin Login)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState<boolean>(false);

  // Cargar Metadatos de Filtros, Carrusel de Inicio y Contacto al iniciar
  useEffect(() => {
    fetch('/api/catalogo/filtros')
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && res.data) {
          setCatalogMeta(res.data as CatalogPublicFiltersMeta);
          if (Array.isArray(res.data.familias_olfativas)) {
            setFamilias(res.data.familias_olfativas);
          }
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

    setLoadingFeatured(true);
    fetch('/api/productos?destacado=1&per_page=15')
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && Array.isArray(res.data?.items)) {
          setFeaturedProductos(res.data.items);
        }
      })
      .finally(() => setLoadingFeatured(false));
  }, []);

  // Consultar el listado del Catálogo cuando el usuario está en la vista 'catalogo'
  useEffect(() => {
    if (filters.view !== 'catalogo') return;

    setLoadingCatalog(true);
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.genero) params.set('genero', filters.genero);
    if (filters.familia) params.set('familia', String(filters.familia));
    if (filters.marca) params.set('marca', filters.marca);
    if (filters.concentracion) params.set('concentracion', filters.concentracion);
    if (filters.tipo_presentacion) params.set('tipo_presentacion', filters.tipo_presentacion);
    if (filters.tamano_ml && filters.tamano_ml.length > 0) {
      params.set('tamano_ml', filters.tamano_ml.join(','));
    }
    if (filters.precio_min !== undefined) params.set('precio_min', String(filters.precio_min));
    if (filters.precio_max !== undefined) params.set('precio_max', String(filters.precio_max));
    if (filters.destacado) params.set('destacado', '1');
    if (filters.en_promocion) params.set('en_promocion', '1');
    if (filters.orden) params.set('orden', filters.orden);
    params.set('per_page', String(filters.per_page ?? 30));
    if (filters.page) params.set('page', String(filters.page));

    fetch(`/api/productos?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && Array.isArray(res.data?.items)) {
          setProductos(res.data.items);
          setTotalProductos(Number(res.data?.pagination?.total ?? res.data.items.length));
        }
      })
      .finally(() => setLoadingCatalog(false));
  }, [filters]);

  const handleNavigate = (next: CatalogFiltersState) => {
    setFilters(next);
    if (next.view !== 'producto' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProduct = (producto: Producto) => {
    setSelectedProduct(producto);
    setFilters((prev) => ({
      ...prev,
      view: 'producto',
      productoSlug: producto.slug,
    }));
    window.history.pushState({}, '', `/perfume/${producto.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleAddToCart = (
    producto: Producto,
    variante?: VarianteProducto,
    cantidad: number = 1
  ) => {
    const selectedVar = variante ?? producto.variantes[0];
    if (!selectedVar) return;
    const qtyToAdd = Math.max(1, cantidad);

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variante.id === selectedVar.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + qtyToAdd };
        return updated;
      }
      return [...prev, { producto, variante: selectedVar, cantidad: qtyToAdd }];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQty = (varianteId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.variante.id === varianteId
            ? { ...i, cantidad: Math.max(0, i.cantidad + delta) }
            : i
        )
        .filter((i) => i.cantidad > 0)
    );
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
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* 2. VISTA DE INICIO (HOME): HeroBanner + Carrusel de Seleccionados + Categorías + Información de Marca */}
      {filters.view === 'home' && (
        <main className="flex-1">
          <HeroBanner onActionClick={handleNavigate} />
          <HomeView
            featuredProductos={featuredProductos}
            loading={loadingFeatured}
            sendingWhatsapp={sendingWhatsapp}
            onNavigateCatalog={handleNavigate}
            onOpenProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onDirectWhatsApp={handleCheckoutWhatsApp}
          />
        </main>
      )}

      {/* 3. VISTA DE CATÁLOGO (Sin HeroBanner): Cabecera de Colección + Filtros Laterales + Grilla */}
      {filters.view === 'catalogo' && (
        <main className="flex-1">
          <CatalogView
            filters={filters}
            meta={catalogMeta}
            productos={productos}
            totalProductos={totalProductos}
            loading={loadingCatalog}
            sendingWhatsapp={sendingWhatsapp}
            onUpdateFilters={handleNavigate}
            onOpenProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onDirectWhatsApp={handleCheckoutWhatsApp}
          />
        </main>
      )}

      {/* 4. PÁGINA DEDICADA DE DETALLE DE PRODUCTO (/perfume/:slug) */}
      {filters.view === 'producto' && (
        <main className="flex-1">
          <ProductDetailView
            initialProducto={selectedProduct}
            productoSlug={filters.productoSlug ?? selectedProduct?.slug ?? ''}
            relatedProductos={productos.length > 0 ? productos : featuredProductos}
            sendingWhatsapp={sendingWhatsapp}
            onNavigate={handleNavigate}
            onOpenProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onDirectWhatsApp={handleCheckoutWhatsApp}
          />
        </main>
      )}

      {/* 5. DRAWER LATERAL DEL CARRITO DE COMPRAS -> WHATSAPP */}
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
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg font-semibold text-drea-ink truncate">
                        {item.producto.marca.nombre} · {item.producto.nombre}
                      </p>
                      <p className="text-xs text-drea-ink-muted">
                        {item.variante.etiqueta} ({item.variante.tamano_ml} ml)
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="inline-flex items-center border border-drea-canvas-border bg-[#FAF9F7]">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.variante.id, -1)}
                            className="px-2 py-1 text-drea-ink hover:text-drea-burgundy"
                            aria-label="Restar unidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-drea-ink">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.variante.id, 1)}
                            className="px-2 py-1 text-drea-ink hover:text-drea-burgundy"
                            aria-label="Sumar unidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-drea-burgundy">
                          {formatCop(item.variante.precio_final * item.cantidad)}
                        </p>
                      </div>
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

      {/* 5. BOTÓN FLOTANTE DE WHATSAPP */}
      <a
        href={DREA_BRAND.contact.whatsappUrl}
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
