import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Grid,
  LayoutList,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CatalogFiltersState,
  CatalogPublicFiltersMeta,
  Producto,
  VarianteProducto,
} from '../../types/catalog';

interface CatalogViewProps {
  filters: CatalogFiltersState;
  meta: CatalogPublicFiltersMeta | null;
  productos: Producto[];
  totalProductos: number;
  loading: boolean;
  sendingWhatsapp: boolean;
  onUpdateFilters: (next: CatalogFiltersState) => void;
  onOpenProduct: (producto: Producto) => void;
  onAddToCart: (producto: Producto, variante?: VarianteProducto) => void;
  onDirectWhatsApp: (items: { variante_id: number; cantidad: number }[]) => void;
}

function formatCop(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  filters,
  meta,
  productos,
  totalProductos,
  loading,
  sendingWhatsapp,
  onUpdateFilters,
  onOpenProduct,
  onAddToCart,
  onDirectWhatsApp,
}) => {
  // Modo de visualización estilo Cartier: 'grid' (Cuadrícula 3-4 cols) o 'feed' (Feed 2 cols grandes)
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Acordeones colapsables de la barra lateral
  const [openSections, setOpenSections] = useState<{
    ordenar: boolean;
    precio: boolean;
    coleccion: boolean;
    tamano: boolean;
    familias: boolean;
    genero: boolean;
    marca: boolean;
    concentracion: boolean;
  }>({
    ordenar: true,
    precio: true,
    coleccion: true,
    tamano: true,
    familias: true,
    genero: false,
    marca: false,
    concentracion: false,
  });

  // Estado local para el slider de rango de precio (FILTRAR POR PRECIO)
  const catalogMinPrice = meta?.rango_precios?.min ? Math.floor(meta.rango_precios.min) : 35000;
  const catalogMaxPrice = meta?.rango_precios?.max ? Math.ceil(meta.rango_precios.max) : 2400000;

  const [priceMinInput, setPriceMinInput] = useState<number>(filters.precio_min ?? catalogMinPrice);
  const [priceMaxInput, setPriceMaxInput] = useState<number>(filters.precio_max ?? catalogMaxPrice);

  useEffect(() => {
    setPriceMinInput(filters.precio_min ?? catalogMinPrice);
    setPriceMaxInput(filters.precio_max ?? catalogMaxPrice);
  }, [filters.precio_min, filters.precio_max, catalogMinPrice, catalogMaxPrice]);

  // Variante seleccionada por tarjeta de producto (permite cambiar tamaño 10ml / 50ml / 100ml en la tarjeta)
  const [selectedVariantByProd, setSelectedVariantByProd] = useState<Record<number, number>>({});

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSize = (sizeMl: number) => {
    const current = filters.tamano_ml ?? [];
    const exists = current.includes(sizeMl);
    const nextSizes = exists ? current.filter((s) => s !== sizeMl) : [...current, sizeMl];
    onUpdateFilters({
      ...filters,
      view: 'catalogo',
      tamano_ml: nextSizes.length > 0 ? nextSizes : undefined,
      page: 1,
    });
  };

  const handleApplyPriceFilter = () => {
    onUpdateFilters({
      ...filters,
      view: 'catalogo',
      precio_min: priceMinInput,
      precio_max: priceMaxInput,
      page: 1,
    });
  };

  const handleClearAllFilters = () => {
    onUpdateFilters({
      view: 'catalogo',
      tituloSeccion: 'Catálogo Completo',
      orden: 'destacados',
      per_page: filters.per_page ?? 12,
    });
  };

  const openProductDetail = (prod: Producto) => {
    onOpenProduct(prod);
  };

  const activeFilterCount = [
    filters.q,
    filters.genero,
    filters.familia,
    filters.marca,
    filters.concentracion,
    filters.tipo_presentacion,
    filters.en_promocion,
    filters.destacado,
    filters.precio_min !== undefined || filters.precio_max !== undefined ? 'precio' : undefined,
    filters.tamano_ml && filters.tamano_ml.length > 0 ? 'tamano' : undefined,
  ].filter(Boolean).length;

  const currentPerPage = filters.per_page ?? 30;
  const currentSort = filters.orden ?? 'destacados';

  // Panel de filtros reutilizable en Desktop Sidebar y Mobile Drawer
  const renderSidebarContent = () => (
    <div className="space-y-6 select-none">
      {/* Cabecera de limpieza si hay filtros activos */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between bg-white border border-drea-canvas-border px-3.5 py-2.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-drea-ink">
            {activeFilterCount} {activeFilterCount === 1 ? 'Filtro activo' : 'Filtros activos'}
          </span>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-drea-burgundy hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        </div>
      )}

      {/* 1. ORDENAR POR (Estilo Cartier - Radio Buttons) */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('ordenar')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            ORDENAR POR
          </span>
          {openSections.ordenar ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.ordenar && (
          <div className="mt-3.5 space-y-2.5">
            {[
              { id: 'destacados', label: 'RECOMENDADO' },
              { id: 'precio_desc', label: 'PRECIO DESCENDENTE' },
              { id: 'precio_asc', label: 'PRECIO ASCENDENTE' },
              { id: 'recientes', label: 'LANZAMIENTOS RECIENTES' },
              { id: 'nombre_asc', label: 'ORDEN ALFABÉTICO (A - Z)' },
            ].map((opt) => {
              const isSelected = currentSort === opt.id;
              return (
                <label
                  key={opt.id}
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      view: 'catalogo',
                      orden: opt.id,
                      page: 1,
                    })
                  }
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-drea-ink bg-white'
                        : 'border-drea-ink-muted/60 group-hover:border-drea-ink'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-drea-ink" />}
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-wider transition-colors ${
                      isSelected
                        ? 'font-semibold text-drea-ink'
                        : 'text-drea-ink-body group-hover:text-drea-ink'
                    }`}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. FILTRAR POR PRECIO (Estilo Barra de Rango COP + Botón FILTRAR) */}
      <div className="border-b border-drea-canvas-border pb-6">
        <button
          type="button"
          onClick={() => toggleSection('precio')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            FILTRAR POR PRECIO
          </span>
          {openSections.precio ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.precio && (
          <div className="mt-4 space-y-4">
            {/* Barra visual interactiva de rango */}
            <div className="space-y-2">
              <div className="relative pt-1">
                <input
                  type="range"
                  min={catalogMinPrice}
                  max={catalogMaxPrice}
                  step={5000}
                  value={priceMaxInput}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), priceMinInput);
                    setPriceMaxInput(val);
                  }}
                  className="w-full h-1 bg-drea-ink accent-drea-burgundy cursor-pointer appearance-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted mb-1">
                    Mínimo (COP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={priceMinInput}
                    onChange={(e) => setPriceMinInput(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-drea-canvas-border px-2.5 py-1.5 text-xs font-medium text-drea-ink focus:outline-none focus:border-drea-burgundy"
                  />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-drea-ink-muted mb-1">
                    Máximo (COP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={priceMaxInput}
                    onChange={(e) => setPriceMaxInput(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-drea-canvas-border px-2.5 py-1.5 text-xs font-medium text-drea-ink focus:outline-none focus:border-drea-burgundy"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-drea-ink-body">
                Precio:{' '}
                <strong className="font-semibold text-drea-ink">
                  {formatCop(priceMinInput)} — {formatCop(priceMaxInput)}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyPriceFilter}
                className="px-4 py-2 bg-drea-canvas-subtle hover:bg-drea-ink hover:text-white text-drea-ink border border-drea-canvas-border text-[11px] font-semibold uppercase tracking-editorial transition-colors"
              >
                FILTRAR
              </button>
              {(filters.precio_min !== undefined || filters.precio_max !== undefined) && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      precio_min: undefined,
                      precio_max: undefined,
                      page: 1,
                    })
                  }
                  className="text-[11px] text-drea-burgundy hover:underline uppercase tracking-wider"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. FILTRAR POR (Colección / Edición Limitada / Novedad / SALE - Estilo Cartier) */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('coleccion')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            FILTRAR POR
          </span>
          {openSections.coleccion ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.coleccion && (
          <div className="mt-3.5 space-y-2.5">
            {/* Checkbox SALE */}
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={ Boolean(filters.en_promocion) }
                  onChange={(e) =>
                    onUpdateFilters({
                      ...filters,
                      view: 'catalogo',
                      en_promocion: e.target.checked ? 1 : undefined,
                      tituloSeccion: e.target.checked
                        ? 'Selección SALE · Piezas de Oportunidad'
                        : 'Catálogo Completo',
                      page: 1,
                    })
                  }
                  className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                />
                <span className="text-[11px] uppercase tracking-wider text-drea-burgundy font-semibold">
                  SELECCIÓN SALE
                </span>
              </span>
            </label>

            {/* Checkbox EDICIÓN DESTACADA */}
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={ Boolean(filters.destacado) }
                  onChange={(e) =>
                    onUpdateFilters({
                      ...filters,
                      view: 'catalogo',
                      destacado: e.target.checked ? 1 : undefined,
                      page: 1,
                    })
                  }
                  className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                />
                <span className="text-[11px] uppercase tracking-wider text-drea-ink-body group-hover:text-drea-ink">
                  EDICIÓN DESTACADA
                </span>
              </span>
            </label>

            {/* Tipos de Presentación: Regular / Kit / Decant / Tester */}
            {(meta?.tipos_presentacion ?? ['Regular', 'Kit', 'Decant', 'Tester']).map((tipo) => {
              const checked = filters.tipo_presentacion === tipo;
              return (
                <label
                  key={tipo}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onUpdateFilters({
                          ...filters,
                          view: 'catalogo',
                          tipo_presentacion: checked ? undefined : tipo,
                          tituloSeccion:
                            !checked && tipo === 'Kit'
                              ? 'Colección Kits & Cofres de Regalo'
                              : filters.tituloSeccion,
                          page: 1,
                        })
                      }
                      className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                    />
                    <span className="text-[11px] uppercase tracking-wider text-drea-ink-body group-hover:text-drea-ink">
                      {tipo === 'Kit'
                        ? 'KITS & SETS DE REGALO'
                        : tipo === 'Decant'
                        ? 'DECANTS (ATOMIZADORES)'
                        : tipo === 'Tester'
                        ? 'PRESENTACIÓN TESTER'
                        : 'BOTELLA REGULAR'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FILTRAR POR TAMAÑO (100ml (6), 200ml (5), 50ml (1), 10ml (25)...) */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('tamano')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            FILTRAR POR TAMAÑO
          </span>
          {openSections.tamano ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.tamano && (
          <div className="mt-3.5 space-y-2.5">
            {(meta?.tamanos_ml && meta.tamanos_ml.length > 0
              ? meta.tamanos_ml
              : [
                  { tamano_ml: 5, total_productos: 0 },
                  { tamano_ml: 10, total_productos: 0 },
                  { tamano_ml: 50, total_productos: 0 },
                  { tamano_ml: 75, total_productos: 0 },
                  { tamano_ml: 100, total_productos: 0 },
                  { tamano_ml: 125, total_productos: 0 },
                  { tamano_ml: 200, total_productos: 0 },
                ]
            ).map((item) => {
              const sizeVal = Number(item.tamano_ml);
              const isChecked = (filters.tamano_ml ?? []).includes(sizeVal);
              return (
                <label
                  key={sizeVal}
                  className="flex items-center justify-between cursor-pointer group text-xs"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSize(sizeVal)}
                      className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                    />
                    <span
                      className={`${
                        isChecked
                          ? 'font-semibold text-drea-ink'
                          : 'text-drea-ink-body group-hover:text-drea-ink'
                      }`}
                    >
                      {sizeVal}ml
                    </span>
                  </span>
                  <span className="text-[11px] text-drea-ink-muted">
                    ({item.total_productos})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CATEGORÍAS / FAMILIAS OLFATIVAS (con píldora de conteo a la derecha) */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('familias')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            FAMILIAS OLFATIVAS
          </span>
          {openSections.familias ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.familias && (
          <div className="mt-3.5 space-y-2">
            {(meta?.familias_olfativas ?? []).map((fam) => {
              const isSelected = Number(filters.familia) === Number(fam.id);
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      view: 'catalogo',
                      familia: isSelected ? undefined : Number(fam.id),
                      tituloSeccion: isSelected
                        ? 'Catálogo Completo'
                        : `Familia Olfativa: ${fam.nombre}`,
                      subtituloSeccion: isSelected ? undefined : fam.descripcion ?? undefined,
                      page: 1,
                    })
                  }
                  className={`w-full flex items-center justify-between py-1 text-left text-xs transition-colors ${
                    isSelected
                      ? 'font-semibold text-drea-burgundy'
                      : 'text-drea-ink-body hover:text-drea-ink'
                  }`}
                >
                  <span>{fam.nombre}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full border ${
                      isSelected
                        ? 'border-drea-burgundy bg-drea-burgundy text-white'
                        : 'border-drea-canvas-border bg-white text-drea-ink-muted'
                    }`}
                  >
                    {fam.total_productos ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. GÉNERO */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('genero')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            GÉNERO
          </span>
          {openSections.genero ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.genero && (
          <div className="mt-3.5 space-y-2.5">
            {['Mujer', 'Hombre', 'Unisex'].map((gen) => {
              const checked = filters.genero === gen;
              const countObj = meta?.generos_conteo?.find((g) => g.genero === gen);
              return (
                <label
                  key={gen}
                  className="flex items-center justify-between cursor-pointer group text-xs"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onUpdateFilters({
                          ...filters,
                          view: 'catalogo',
                          genero: checked ? undefined : gen,
                          tituloSeccion: checked ? 'Catálogo Completo' : `Perfumes para ${gen}`,
                          page: 1,
                        })
                      }
                      className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                    />
                    <span
                      className={`uppercase tracking-wider text-[11px] ${
                        checked ? 'font-semibold text-drea-ink' : 'text-drea-ink-body'
                      }`}
                    >
                      {gen}
                    </span>
                  </span>
                  {countObj && (
                    <span className="text-[11px] text-drea-ink-muted">
                      ({countObj.total_productos})
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. MARCA / CASA PERFUMISTA */}
      <div className="border-b border-drea-canvas-border pb-5">
        <button
          type="button"
          onClick={() => toggleSection('marca')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            MAISON / MARCA
          </span>
          {openSections.marca ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.marca && (
          <div className="mt-3.5 space-y-2">
            {(meta?.marcas ?? []).map((m) => {
              const checked =
                String(filters.marca) === String(m.id) || filters.marca === m.slug;
              return (
                <label
                  key={m.id}
                  className="flex items-center justify-between cursor-pointer group text-xs"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onUpdateFilters({
                          ...filters,
                          view: 'catalogo',
                          marca: checked ? undefined : m.slug,
                          tituloSeccion: checked ? 'Catálogo Completo' : `Maison ${m.nombre}`,
                          page: 1,
                        })
                      }
                      className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                    />
                    <span
                      className={`uppercase tracking-wider text-[11px] ${
                        checked ? 'font-semibold text-drea-ink' : 'text-drea-ink-body'
                      }`}
                    >
                      {m.nombre}
                    </span>
                  </span>
                  <span className="text-[11px] text-drea-ink-muted">
                    ({m.total_productos ?? 0})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. CONCENTRACIÓN (EDP, Parfum, Extrait...) */}
      <div className="pb-2">
        <button
          type="button"
          onClick={() => toggleSection('concentracion')}
          className="w-full flex items-center justify-between text-left py-1"
        >
          <span className="text-xs font-semibold uppercase tracking-editorial text-drea-ink">
            CONCENTRACIÓN
          </span>
          {openSections.concentracion ? (
            <ChevronUp className="w-4 h-4 text-drea-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-drea-ink-muted" />
          )}
        </button>

        {openSections.concentracion && (
          <div className="mt-3.5 space-y-2.5">
            {(meta?.concentraciones ?? ['EDP', 'Parfum', 'Extrait de Parfum', 'EDT']).map(
              (conc) => {
                const checked = filters.concentracion === conc;
                const countObj = meta?.concentraciones_conteo?.find(
                  (c) => c.concentracion === conc
                );
                return (
                  <label
                    key={conc}
                    className="flex items-center justify-between cursor-pointer group text-xs"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onUpdateFilters({
                            ...filters,
                            view: 'catalogo',
                            concentracion: checked ? undefined : conc,
                            page: 1,
                          })
                        }
                        className="w-3.5 h-3.5 accent-drea-burgundy rounded-none border-drea-canvas-border"
                      />
                      <span
                        className={`uppercase tracking-wider text-[11px] ${
                          checked ? 'font-semibold text-drea-ink' : 'text-drea-ink-body'
                        }`}
                      >
                        {conc}
                      </span>
                    </span>
                    {countObj && (
                      <span className="text-[11px] text-drea-ink-muted">
                        ({countObj.total_productos})
                      </span>
                    )}
                  </label>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* =====================================================================
          1. BANNER EDITORIAL DE CABECERA DEL CATÁLOGO (Estilo Cartier + Catálogo Oscuro)
      ===================================================================== */}
      {filters.view === 'catalogo' && (
        <section className="relative bg-drea-ink text-white overflow-hidden">
          {/* Imagen sutil de fondo con degradado oscuro luxury */}
          <div
            className="absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/banners/imagen2.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/75" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
            <span className="inline-block text-[10px] uppercase tracking-[0.28em] text-drea-gold mb-2">
              DREA PERFUMES · BOUTIQUE ARCHIVE
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-white uppercase">
              {filters.tituloSeccion ?? 'Catálogo'}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm text-white/80 font-light leading-relaxed italic font-serif">
              {filters.subtituloSeccion ??
                'Una curaduría de alta perfumería árabe, de diseñador y de autor concebida para evocar carácter, memoria y sofisticación.'}
            </p>
          </div>
        </section>
      )}

      {/* =====================================================================
          2. CONTENEDOR PRINCIPAL DEL CATÁLOGO (BREADCRUMB + SIDEBAR ESTÁTICA + PASARELAS BURBERRY)
      ===================================================================== */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Breadcrumb superior editorial */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-drea-canvas-border">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-editorial text-drea-ink-muted">
            <button
              type="button"
              onClick={() => onUpdateFilters({ view: 'home' })}
              className="hover:text-drea-burgundy transition-colors"
            >
              INICIO
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() =>
                onUpdateFilters({
                  view: 'catalogo',
                  tituloSeccion: 'Catálogo Completo',
                })
              }
              className="hover:text-drea-burgundy transition-colors"
            >
              COLECCIONES
            </button>
            <span>/</span>
            <span className="text-drea-ink font-semibold">
              {filters.tituloSeccion ?? 'Fragancias Destacadas'}
            </span>
          </nav>

          {/* Botón abrir filtros en móvil */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-drea-canvas-border text-xs uppercase tracking-wider font-semibold text-drea-ink"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-drea-burgundy" />
            Filtrar y Ordenar {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* COLUMNA IZQUIERDA ESTÁTICA / STICKY: BARRA LATERAL DE FILTROS (Desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto w-64 xl:w-72 shrink-0 bg-white border border-drea-canvas-border p-6">
            {renderSidebarContent()}
          </aside>

          {/* COLUMNA DERECHA: BARRA SUPERIOR + PASARELAS HORIZONTALES ESTILO BURBERRY */}
          <div className="flex-1 w-full min-w-0">
            {/* Barra superior: Conteo ("8 of 431 items" -> "X de Y fragancias") | Mostrar: 12/30/60/90 | Ordenar | Vista */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3.5 border-b border-drea-canvas-border">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-drea-ink tracking-wide">
                  {productos.length} de {totalProductos}{' '}
                  {totalProductos === 1 ? 'fragancia' : 'fragancias'}
                </span>

                {/* Chips de filtros rápidos */}
                {filters.en_promocion ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-drea-burgundy text-white text-[10px] uppercase tracking-wider font-semibold">
                    SALE
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFilters({ ...filters, en_promocion: undefined, page: 1 })
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null}

                {filters.q ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-drea-canvas-border text-[11px] text-drea-ink">
                    “{filters.q}”
                    <button
                      type="button"
                      onClick={() => onUpdateFilters({ ...filters, q: undefined, page: 1 })}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null}

                {(filters.tamano_ml ?? []).map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-drea-canvas-border text-[11px] text-drea-ink"
                  >
                    {sz}ml
                    <button type="button" onClick={() => handleToggleSize(sz)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Controles Derechos: Mostrar 12/30/60/90 | Selector Ordenar | Pasarela / Editorial */}
              <div className="flex flex-wrap items-center gap-5 text-xs">
                {/* Mostrar : 12 / 30 / 60 / 90 */}
                <div className="hidden sm:flex items-center gap-1.5 text-drea-ink-muted">
                  <span className="text-drea-ink font-medium">Mostrar :</span>
                  {[12, 30, 60, 90].map((num, idx, arr) => (
                    <React.Fragment key={num}>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateFilters({
                            ...filters,
                            view: 'catalogo',
                            per_page: num,
                            page: 1,
                          })
                        }
                        className={`hover:text-drea-ink transition-colors ${
                          currentPerPage === num ? 'font-bold text-drea-ink' : ''
                        }`}
                      >
                        {num}
                      </button>
                      {idx < arr.length - 1 && <span className="text-drea-canvas-border">/</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Dropdown rápido de ordenamiento (sincronizado con el sidebar) */}
                <div className="flex items-center">
                  <select
                    value={currentSort}
                    onChange={(e) =>
                      onUpdateFilters({
                        ...filters,
                        view: 'catalogo',
                        orden: e.target.value,
                        page: 1,
                      })
                    }
                    className="bg-transparent border-b border-drea-ink/40 pb-1 pr-4 text-xs font-medium text-drea-ink focus:outline-none focus:border-drea-burgundy cursor-pointer"
                  >
                    <option value="destacados">Ordenar por popularidad</option>
                    <option value="recientes">Ordenar por lanzamientos</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                    <option value="nombre_asc">Nombre: A - Z</option>
                  </select>
                </div>

                {/* Conmutador PASARELA (3-4 cols) / EDITORIAL (2 cols) */}
                <div className="hidden md:flex items-center gap-3 border-l border-drea-canvas-border pl-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-editorial transition-colors ${
                      viewMode === 'grid'
                        ? 'font-semibold text-drea-ink'
                        : 'text-drea-ink-muted hover:text-drea-ink'
                    }`}
                  >
                    <span>PASARELA</span>
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('feed')}
                    className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-editorial transition-colors ${
                      viewMode === 'feed'
                        ? 'font-semibold text-drea-ink'
                        : 'text-drea-ink-muted hover:text-drea-ink'
                    }`}
                  >
                    <span>EDITORIAL</span>
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================
                PASARELAS HORIZONTALES ESTILO BURBERRY (Mismas medidas, lienzo continuo)
            ================================================================= */}
            {loading ? (
              <div
                className={`grid gap-x-[1px] gap-y-8 bg-[#E8E6E1] border border-[#E8E6E1] ${
                  viewMode === 'feed'
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                }`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white flex flex-col">
                    <div className="aspect-[4/5] w-full bg-[#F7F6F4] animate-pulse" />
                    <div className="h-[88px] bg-white p-4 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <div className="bg-white border border-drea-canvas-border p-12 text-center space-y-4">
                <p className="font-serif text-2xl text-drea-ink">
                  No encontramos fragancias con los filtros seleccionados.
                </p>
                <p className="text-xs text-drea-ink-muted max-w-md mx-auto">
                  Puedes ampliar el rango de precios en COP o restablecer los filtros laterales para
                  explorar toda nuestra colección.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="drea-btn-primary"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-x-[1px] gap-y-10 bg-[#EAE8E4] border border-[#EAE8E4] ${
                  viewMode === 'feed'
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                }`}
              >
                {productos.map((prod) => {
                  const activeVariants = prod.variantes.filter((v) => v.disponible !== false);
                  const variantsList = activeVariants.length > 0 ? activeVariants : prod.variantes;

                  const chosenVarId = selectedVariantByProd[prod.id];
                  const selectedVar =
                    variantsList.find((v) => v.id === chosenVarId) ?? variantsList[0];

                  // Umbral de precios (ej. $ 45.000 - $ 380.000 COP) cuando hay varios tamaños
                  const finalPrices = variantsList.map((v) => v.precio_final);
                  const minPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
                  const maxPrice = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;
                  const hasPriceRange = variantsList.length > 1 && minPrice !== maxPrice;

                  // Etiqueta SALE si tiene promoción activa
                  const promoVariant = variantsList.find((v) => v.tiene_promocion && v.promocion);
                  const discountBadgeText = promoVariant?.promocion?.etiqueta
                    ? `SALE ${promoVariant.promocion.etiqueta}`
                    : 'SALE';

                  return (
                    <article
                      key={prod.id}
                      className="bg-white flex flex-col justify-between group relative select-none"
                    >
                      {/* 1. LIENZO SUPERIOR UNIFORME (Misma medida exacta aspect-[4/5] en toda la fila) */}
                      <div
                        onClick={() => openProductDetail(prod)}
                        className={`relative w-full bg-[#F7F6F4] flex items-center justify-center overflow-hidden cursor-pointer ${
                          viewMode === 'feed' ? 'aspect-[4/4.3]' : 'aspect-[4/5]'
                        }`}
                      >
                        {/* Etiqueta superior izquierda minimalista tipo Burberry ("New In" / "SALE -15%") */}
                        <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
                          {prod.tiene_promocion ? (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-drea-burgundy">
                              {discountBadgeText}
                            </span>
                          ) : prod.destacado ? (
                            <span className="text-[11px] font-semibold tracking-wide text-drea-ink">
                              Destacado
                            </span>
                          ) : null}
                        </div>

                        {/* Imagen en fondo blanco integrada al lienzo (mix-blend-multiply funde el blanco puro con #F7F6F4) */}
                        <img
                          src={prod.imagen.url}
                          alt={`${prod.marca.nombre} - ${prod.nombre}`}
                          className="w-full h-full object-contain p-7 sm:p-9 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                        />

                        {/* Barra sutil de acción rápida al hacer hover (No altera las medidas de la tarjeta) */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-x-0 bottom-0 z-10 bg-white/95 backdrop-blur-xs border-t border-[#EAE8E4] px-3 py-2.5 flex items-center justify-between gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <button
                            type="button"
                            onClick={() => onAddToCart(prod, selectedVar)}
                            className="flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-drea-ink hover:text-drea-burgundy border border-drea-canvas-border hover:border-drea-burgundy bg-white transition-colors"
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
                            className="flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-drea-burgundy hover:bg-drea-burgundy-dark transition-colors"
                          >
                            Comprar
                          </button>
                        </div>
                      </div>

                      {/* 2. FRANJA INFERIOR ARQUITECTÓNICA (Idéntica a Burberry: Izquierda Nombre + Swatches / Derecha Precio COP + Datos) */}
                      <div className="bg-white px-4 py-3.5 min-h-[86px] flex flex-col justify-between border-t border-[#F0EEEA]">
                        {/* Fila 1: Nombre del Perfume a la izquierda · Umbral de Precios / Precio COP a la derecha */}
                        <div
                          onClick={() => openProductDetail(prod)}
                          className="flex items-baseline justify-between gap-3 cursor-pointer"
                        >
                          <h3 className="font-sans text-[12px] sm:text-[13px] font-medium text-drea-ink group-hover:text-drea-burgundy transition-colors truncate">
                            {prod.nombre} · <span className="text-drea-ink-muted font-normal">{prod.marca.nombre}</span>
                          </h3>

                          {/* Precio o Umbral de Precios en COP alineado a la derecha */}
                          <div className="shrink-0 text-right">
                            {selectedVar ? (
                              chosenVarId && selectedVar.tiene_promocion ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] text-drea-ink-muted line-through">
                                    {selectedVar.precio_base_cop}
                                  </span>
                                  <span className="text-[12px] sm:text-[13px] font-semibold text-drea-burgundy">
                                    {selectedVar.precio_final_cop} COP
                                  </span>
                                </div>
                              ) : hasPriceRange && !chosenVarId ? (
                                <span className="text-[12px] sm:text-[13px] font-medium text-drea-ink">
                                  {formatCop(minPrice)} - {formatCop(maxPrice)} COP
                                </span>
                              ) : selectedVar.tiene_promocion ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] text-drea-ink-muted line-through">
                                    {selectedVar.precio_base_cop}
                                  </span>
                                  <span className="text-[12px] sm:text-[13px] font-semibold text-drea-burgundy">
                                    {selectedVar.precio_final_cop} COP
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[12px] sm:text-[13px] font-medium text-drea-ink">
                                  {selectedVar.precio_final_cop} COP
                                </span>
                              )
                            ) : (
                              <span className="text-[12px] text-drea-ink-muted">Consultar</span>
                            )}
                          </div>
                        </div>

                        {/* Fila 2: Swatches/Tamaños a la izquierda (como los cuadritos de Burberry) · Datos olfativos a la derecha */}
                        <div className="flex items-center justify-between gap-2 mt-2.5">
                          {/* Swatches de tamaños (10ml, 100ml, Kit) */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {variantsList.map((v) => {
                              const isSelected = chosenVarId
                                ? chosenVarId === v.id
                                : variantsList.length === 1 && selectedVar?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVariantByProd((prev) => ({
                                      ...prev,
                                      [prod.id]: prev[prod.id] === v.id ? 0 : v.id,
                                    }))
                                  }
                                  title={`${v.tamano_ml} ml (${v.tipo_presentacion}) - ${v.precio_final_cop} COP`}
                                  className={`px-1.5 py-0.5 text-[10px] leading-none border transition-all ${
                                    isSelected
                                      ? 'border-drea-ink bg-drea-ink text-white font-semibold'
                                      : 'border-[#D8D4CC] bg-[#FAF9F7] text-drea-ink hover:border-drea-ink'
                                  }`}
                                >
                                  {v.tipo_presentacion === 'Kit'
                                    ? `Kit ${v.tamano_ml}ml`
                                    : `${v.tamano_ml}ml`}
                                </button>
                              );
                            })}
                          </div>

                          {/* Micro-datos sensoriales a la derecha */}
                          <span className="text-[10px] text-drea-ink-muted truncate">
                            {prod.concentracion} · {prod.familia_olfativa?.nombre ?? prod.genero}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. DRAWER MÓVIL DE FILTROS (Para pantallas pequeñas)
      ===================================================================== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-drea-canvas h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-drea-canvas-border pb-4 mb-5">
                <span className="font-serif text-xl font-semibold text-drea-ink">
                  Filtros & Orden
                </span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-drea-ink-muted hover:text-drea-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarContent()}
            </div>

            <div className="pt-6 border-t border-drea-canvas-border mt-6">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full drea-btn-primary py-3"
              >
                Ver {totalProductos} Modelos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
