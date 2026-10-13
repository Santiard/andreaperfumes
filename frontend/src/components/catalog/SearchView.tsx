import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  CatalogFiltersState,
  FamiliaOlfativa,
  Producto,
  VarianteProducto,
} from '../../types/catalog';

interface SearchViewProps {
  initialQuery?: string;
  familiasOlfativas: FamiliaOlfativa[];
  featuredProductos: Producto[];
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

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onNavigate,
  onGoBack,
  onOpenProduct,
}) => {
  const [inputText, setInputText] = useState<string>(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>(
    initialQuery.trim()
  );
  const [results, setResults] = useState<Producto[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const runSearch = (term: string) => {
    const clean = term.trim();
    setInputText(term);
    setSubmittedQuery(clean);

    if (!clean) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.set('q', clean);
    params.set('per_page', '48');

    fetch(`/api/productos?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && Array.isArray(res.data?.items)) {
          setResults(res.data.items);
          setTotalResults(
            Number(res.data?.pagination?.total ?? res.data.items.length)
          );
        } else {
          setResults([]);
          setTotalResults(0);
        }
      })
      .catch(() => {
        setResults([]);
        setTotalResults(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      runSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(inputText);
  };

  const handleClear = () => {
    setInputText('');
    setSubmittedQuery('');
    setResults([]);
    setTotalResults(0);
  };

  return (
    <div className="min-h-[75vh] bg-drea-canvas text-drea-ink pb-20">
      {/* =====================================================================
          BARRA DE BÚSQUEDA ESTILO LOUIS VUITTON INTEGRADA BAJO EL HEADER DREA
          Barra ovalada centrada + Búsquedas de tendencias
      ===================================================================== */}
      <div className="w-full bg-white border-b border-drea-canvas-border py-8 sm:py-10 px-4 sm:px-10">
        {/* Barra de búsqueda ovalada centrada (Se ejecuta al presionar Enter o el ícono de buscar) */}
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto"
        >
          <div className="relative flex items-center w-full rounded-full border border-drea-ink/80 focus-within:border-drea-ink bg-white px-5 sm:px-6 py-2.5 sm:py-3 transition-colors">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Buscar perfume, marca o nota olfativa..."
              autoFocus
              className="w-full text-xs sm:text-sm text-drea-ink placeholder:text-drea-ink-muted/80 italic font-light focus:outline-none bg-transparent pr-14"
            />

            <div className="absolute right-4 flex items-center gap-1.5">
              {inputText && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Limpiar texto"
                  className="p-1 text-drea-ink-muted hover:text-drea-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                aria-label="Buscar"
                className="p-1 text-drea-ink hover:text-drea-burgundy transition-colors"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.6]" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* =====================================================================
          RESULTADOS DE PRODUCTOS (Solo aparecen cuando se ha realizado una búsqueda)
      ===================================================================== */}
      {submittedQuery !== '' && (
        <section className="w-full pt-4">
          <div className="px-4 sm:px-10 mb-4 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-normal text-drea-ink">
              {loading
                ? `Buscando “${submittedQuery}”...`
                : `Resultados para “${submittedQuery}” (${totalResults})`}
            </h2>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] uppercase tracking-wider text-drea-ink-muted hover:text-drea-ink underline"
            >
              Limpiar
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-[1px] gap-y-6 bg-[#EAE8E4] border-t border-b border-[#EAE8E4]">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white">
                  <div className="aspect-square sm:aspect-[4/5] bg-[#F2F1EF] animate-pulse" />
                  <div className="h-16 p-3 bg-white animate-pulse" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
              <p className="font-serif text-2xl text-drea-ink">
                No se encontraron resultados para “{submittedQuery}”.
              </p>
              <p className="text-xs text-drea-ink-muted">
                Intenta con otro nombre de perfume, marca o selecciona una de las búsquedas de
                tendencia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-[1px] gap-y-8 bg-[#EAE8E4] border-t border-b border-[#EAE8E4]">
              {results.map((prod) => {
                const activeVariants = prod.variantes.filter(
                  (v) => v.disponible !== false
                );
                const variantsList =
                  activeVariants.length > 0 ? activeVariants : prod.variantes;
                const selectedVar = variantsList[0];

                const finalPrices = variantsList.map((v) => v.precio_final);
                const minPrice =
                  finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
                const maxPrice =
                  finalPrices.length > 0 ? Math.max(...finalPrices) : 0;
                const hasPriceRange =
                  variantsList.length > 1 && minPrice !== maxPrice;

                return (
                  <article
                    key={prod.id}
                    onClick={() => onOpenProduct(prod)}
                    className="bg-white flex flex-col justify-between cursor-pointer group select-none"
                  >
                    {/* Imagen limpia en lienzo gris perla suave estilo LV */}
                    <div className="relative w-full aspect-square sm:aspect-[4/5] bg-[#EFECE8] flex items-center justify-center overflow-hidden">
                      {prod.tiene_promocion && (
                        <span className="absolute top-2.5 left-3 z-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-drea-burgundy">
                          SALE
                        </span>
                      )}

                      <img
                        src={prod.imagen.url}
                        alt={prod.nombre}
                        className="w-full h-full object-contain p-4 sm:p-7 mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    {/* Nombre y Precio debajo estilo Louis Vuitton */}
                    <div className="bg-white px-3 sm:px-4 py-3 space-y-1">
                      <h3 className="text-[11px] sm:text-xs font-medium text-drea-ink group-hover:text-drea-burgundy transition-colors line-clamp-1">
                        {prod.nombre} · {prod.marca.nombre}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-drea-ink-muted font-normal">
                        {selectedVar
                          ? hasPriceRange
                            ? `${formatCop(minPrice)} - ${formatCop(maxPrice)} COP`
                            : `${selectedVar.precio_final_cop} COP`
                          : 'Consultar'}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
