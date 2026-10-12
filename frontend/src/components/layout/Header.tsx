import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { DREA_BRAND } from '../../config/brand.config';
import { CatalogFiltersState, FamiliaOlfativa } from '../../types/catalog';

interface HeaderProps {
  currentFilters: CatalogFiltersState;
  familiasOlfativas: FamiliaOlfativa[];
  cartCount: number;
  cartTotalCop: string;
  whatsappNumber: string;
  onNavigate: (nextFilters: CatalogFiltersState) => void;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFilters,
  familiasOlfativas,
  cartCount,
  cartTotalCop,
  whatsappNumber,
  onNavigate,
  onOpenCart,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'familias' | 'perfumes' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(currentFilters.q ?? '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Si estamos en la vista de inicio ('home'), ocultamos el enlace "INICIO" del menú
  const isHomePage = currentFilters.view === 'home';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    onNavigate({
      view: 'catalogo',
      tituloSeccion: trimmed ? `Resultados para "${trimmed}"` : 'Catálogo Completo',
      q: trimmed || undefined,
    });
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-drea-canvas-surface/95 backdrop-blur-md border-b border-drea-canvas-border transition-all">
      {/* 1. TOP BAR: Mensajes de Confianza + Redes Sociales (Estilo Cartier / Mafer / Real) */}
      <div className="bg-drea-burgundy text-drea-canvas text-[11px] tracking-editorial uppercase py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-drea-gold-light font-semibold">PERFUMERÍA ORIGINAL</span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden md:inline text-white/90">
              Visita nuestro Showroom en Cúcuta 📍 · Horario de atención 8am-8pm
            </span>
          </div>

          {/* Redes Sociales y Contacto Directo (Sin Login de usuario) */}
          <div className="flex items-center gap-4 ml-auto">
            <a
              href={DREA_BRAND.contact.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram DREA PERFUMES"
              className="hover:text-drea-gold-light transition-colors"
            >
              Instagram
            </a>
            <a
              href={DREA_BRAND.contact.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-drea-gold-light hover:underline font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Asesoría WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. CABECERA PRINCIPAL: Logo + Menú de Categorías con Dropdowns + Buscador y Carrito */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
        {/* Botón Menú Móvil */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-drea-ink hover:text-drea-burgundy transition-colors"
          aria-label="Abrir menú de navegación"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Identidad / Logotipo DREA PERFUMES (Siempre lleva al Inicio) */}
        <button
          type="button"
          onClick={() => {
            setOpenDropdown(null);
            onNavigate({ view: 'home' });
          }}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-12 h-12 rounded-sm overflow-hidden bg-drea-burgundy flex items-center justify-center shadow-sm border border-drea-gold/40">
            <img
              src={DREA_BRAND.assets.logo}
              alt={DREA_BRAND.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl tracking-wider font-semibold text-drea-ink leading-none">
              DREA
            </span>
            <span className="font-sans text-[9px] tracking-widest uppercase text-drea-burgundy font-semibold mt-1">
              PERFUMES · CÚCUTA
            </span>
          </div>
        </button>

        {/* Navegación Principal Desktop */}
        <nav className="hidden lg:flex items-center gap-7 text-xs uppercase tracking-wider font-medium text-drea-ink">
          {/* 1. INICIO: Se oculta automáticamente cuando estamos en la página principal */}
          {!isHomePage && (
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="py-2 hover:text-drea-burgundy transition-colors border-b-2 border-transparent hover:border-drea-burgundy"
            >
              Inicio
            </button>
          )}

          {/* 2. LANZAMIENTOS RECIENTES */}
          <button
            type="button"
            onClick={() =>
              onNavigate({
                view: 'catalogo',
                tituloSeccion: 'Lanzamientos Recientes',
                orden: 'recientes',
              })
            }
            className={`py-2 transition-colors border-b-2 ${
              currentFilters.orden === 'recientes'
                ? 'text-drea-burgundy border-drea-burgundy font-semibold'
                : 'border-transparent hover:text-drea-burgundy'
            }`}
          >
            Lanzamientos Recientes
          </button>

          {/* 3. FAMILIAS OLFATIVAS (Con Mega-Dropdown Dinámico) */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('familias')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === 'familias' ? null : 'familias')
              }
              className={`inline-flex items-center gap-1 py-2 transition-colors border-b-2 ${
                currentFilters.familia
                  ? 'text-drea-burgundy border-drea-burgundy font-semibold'
                  : 'border-transparent hover:text-drea-burgundy'
              }`}
            >
              <span>Familias Olfativas</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === 'familias' ? 'rotate-180 text-drea-burgundy' : ''
                }`}
              />
            </button>

            {openDropdown === 'familias' && (
              <div className="absolute left-0 top-full pt-2 w-[480px] z-50">
                <div className="bg-drea-canvas-surface border border-drea-canvas-border shadow-editorial-hover p-5 grid grid-cols-2 gap-3">
                  <div className="col-span-2 pb-2 mb-1 border-b border-drea-canvas-border flex items-center justify-between">
                    <span className="text-[10px] tracking-editorial uppercase text-drea-burgundy font-semibold">
                      Guía Sensorial · Explora por Familia
                    </span>
                  </div>
                  {familiasOlfativas.map((fam) => (
                    <button
                      key={fam.id}
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate({
                          view: 'catalogo',
                          tituloSeccion: `Familia Olfativa: ${fam.nombre}`,
                          familia: fam.id,
                        });
                      }}
                      className="text-left p-2.5 rounded-sm hover:bg-drea-canvas transition-colors group border border-transparent hover:border-drea-gold/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-base font-semibold text-drea-ink group-hover:text-drea-burgundy capitalize">
                          {fam.nombre}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-drea-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {fam.descripcion && (
                        <p className="text-[11px] normal-case tracking-normal text-drea-ink-muted mt-0.5 line-clamp-2">
                          ({fam.descripcion})
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. PERFUMES (Dropdown por Género, Nicho/Árabes y Presentaciones) */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('perfumes')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === 'perfumes' ? null : 'perfumes')
              }
              className={`inline-flex items-center gap-1 py-2 transition-colors border-b-2 ${
                currentFilters.genero || currentFilters.tipo_presentacion
                  ? 'text-drea-burgundy border-drea-burgundy font-semibold'
                  : 'border-transparent hover:text-drea-burgundy'
              }`}
            >
              <span>Perfumes</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === 'perfumes' ? 'rotate-180 text-drea-burgundy' : ''
                }`}
              />
            </button>

            {openDropdown === 'perfumes' && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50">
                <div className="bg-drea-canvas-surface border border-drea-canvas-border shadow-editorial-hover py-3 px-4 flex flex-col gap-1">
                  <span className="text-[10px] tracking-editorial uppercase text-drea-ink-muted py-1 border-b border-drea-canvas-border mb-1">
                    Por Universo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Perfumes para Mujer (Dama)',
                        genero: 'Mujer',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Mujer (Dama)</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Perfumes para Hombre (Caballero)',
                        genero: 'Hombre',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Hombre (Caballero)</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Perfumería Unisex',
                        genero: 'Unisex',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Unisex</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Colección Kits & Cofres de Regalo',
                        tipo_presentacion: 'Kit',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Kits &amp; Sets de Regalo</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Perfumería Nicho & Árabe',
                        marca: 'lattafa',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Nicho &amp; Árabes</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>

                  <span className="text-[10px] tracking-editorial uppercase text-drea-ink-muted py-1 border-b border-drea-canvas-border mt-2 mb-1">
                    Presentaciones
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Decants Originales (10 ml)',
                        tipo_presentacion: 'Decant',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Decants</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({
                        view: 'catalogo',
                        tituloSeccion: 'Presentación Tester',
                        tipo_presentacion: 'Tester',
                      });
                    }}
                    className="text-left py-2 px-2 hover:bg-drea-canvas hover:text-drea-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>Testers</span>
                    <span className="text-[10px] text-drea-gold">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. CATÁLOGO (Ver Todos) */}
          <button
            type="button"
            onClick={() =>
              onNavigate({
                view: 'catalogo',
                tituloSeccion: 'Catálogo Completo',
              })
            }
            className={`py-2 transition-colors border-b-2 ${
              currentFilters.view === 'catalogo' &&
              !currentFilters.orden &&
              !currentFilters.familia &&
              !currentFilters.genero &&
              !currentFilters.en_promocion &&
              !currentFilters.tipo_presentacion
                ? 'text-drea-burgundy border-drea-burgundy font-semibold'
                : 'border-transparent hover:text-drea-burgundy'
            }`}
          >
            Catálogo
          </button>

          {/* 6. SALE (Selección Exclusiva con Descuento) */}
          <button
            type="button"
            onClick={() =>
              onNavigate({
                view: 'catalogo',
                tituloSeccion: 'Selección SALE · Piezas de Oportunidad',
                en_promocion: 1,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm transition-all tracking-widest ${
              currentFilters.en_promocion
                ? 'bg-drea-burgundy text-drea-gold-light font-semibold'
                : 'text-drea-burgundy bg-drea-burgundy/10 hover:bg-drea-burgundy hover:text-drea-gold-light font-semibold'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SALE</span>
          </button>
        </nav>

        {/* 3. ACCIONES DERECHA: Buscador Inteligente + Carrito con Total COP (Sin Login) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Buscar fragancia"
            className="p-2 text-drea-ink hover:text-drea-burgundy transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Abrir carrito de compras"
            className="inline-flex items-center gap-2.5 px-3.5 py-2 border border-drea-canvas-border bg-drea-canvas hover:border-drea-burgundy transition-colors rounded-sm group"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-drea-ink group-hover:text-drea-burgundy transition-colors" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-drea-burgundy text-drea-gold-light text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-drea-ink">
              {cartTotalCop}
            </span>
          </button>
        </div>
      </div>

      {/* 4. BARRA DESPLEGABLE DEL BUSCADOR INTELIGENTE */}
      {searchOpen && (
        <div className="border-t border-drea-canvas-border bg-drea-canvas py-4 px-4 sm:px-8">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-3xl mx-auto flex items-center gap-3"
          >
            <Search className="w-5 h-5 text-drea-ink-muted shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por perfume (ej. Khamrah, Sauvage), marca, nota olfativa (vainilla, cedro)..."
              className="w-full bg-white border border-drea-canvas-border px-4 py-2.5 text-sm text-drea-ink focus:outline-none focus:border-drea-burgundy"
              autoFocus
            />
            <button type="submit" className="drea-btn-primary py-2.5 px-5 shrink-0">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-drea-ink-muted hover:text-drea-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* 5. MENÚ DESPLEGABLE MÓVIL */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-drea-canvas-border bg-drea-canvas-surface px-6 py-5 space-y-4">
          <div className="flex flex-col space-y-2.5 text-xs uppercase tracking-wider font-semibold">
            {!isHomePage && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate({ view: 'home' });
                }}
                className="text-left py-2 border-b border-drea-canvas-border"
              >
                Inicio
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Lanzamientos Recientes',
                  orden: 'recientes',
                });
              }}
              className="text-left py-2 border-b border-drea-canvas-border"
            >
              Lanzamientos Recientes
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Perfumes para Mujer (Dama)',
                  genero: 'Mujer',
                });
              }}
              className="text-left py-2 border-b border-drea-canvas-border"
            >
              Perfumes · Mujer (Dama)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Perfumes para Hombre (Caballero)',
                  genero: 'Hombre',
                });
              }}
              className="text-left py-2 border-b border-drea-canvas-border"
            >
              Perfumes · Hombre (Caballero)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Perfumería Unisex',
                  genero: 'Unisex',
                });
              }}
              className="text-left py-2 border-b border-drea-canvas-border"
            >
              Perfumes · Unisex
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Catálogo Completo',
                });
              }}
              className="text-left py-2 border-b border-drea-canvas-border"
            >
              Catálogo Completo
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({
                  view: 'catalogo',
                  tituloSeccion: 'Selección SALE · Piezas de Oportunidad',
                  en_promocion: 1,
                });
              }}
              className="text-left py-2 text-drea-burgundy"
            >
              SALE
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
