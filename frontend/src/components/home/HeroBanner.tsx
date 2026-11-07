import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerSlide, CatalogFiltersState } from '../../types/catalog';

/**
 * Slides oficiales DREA PERFUMES — Colección 2026
 * Imágenes de alta resolución en WebP:
 * frontend/public/assets/banners/BANNERS-01.webp hasta BANNERS-06.webp
 */
export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 2,
    imageUrl: '/assets/banners/BANNERS-02.webp?v=4',
    title: 'FRAGANCIAS PARA HOMBRE',
    ctaLabel: 'ADQUIÉRELOS AQUÍ',
    position: 'right',
    filterAction: {
      view: 'catalogo',
      genero: 'Hombre',
      tituloSeccion: 'Fragancias para Hombre',
    },
  },
  {
    id: 3,
    imageUrl: '/assets/banners/BANNERS-03.webp?v=4',
    title: 'SETS DE REGALO',
    ctaLabel: 'ADQUIÉRELOS AQUÍ',
    position: 'right',
    filterAction: {
      view: 'catalogo',
      tipo_presentacion: 'Kit',
      tituloSeccion: 'Sets de Regalo & Cofres',
    },
  },
  {
    id: 4,
    imageUrl: '/assets/banners/BANNERS-04.webp?v=4',
    title: 'AROMAS DE LOS QUE TODOS HABLAN',
    ctaLabel: 'ADQUIÉRELOS AQUÍ',
    position: 'right',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Aromas de los que Todos Hablan',
    },
  },
  {
    id: 5,
    imageUrl: '/assets/banners/BANNERS-05.webp?v=4',
    title: '',
    ctaLabel: '',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Catálogo Completo',
    },
  },
  {
    id: 6,
    imageUrl: '/assets/banners/BANNERS-06.webp?v=4',
    title: 'FRAGANCIAS PARA MUJER',
    ctaLabel: 'ADQUIÉRELOS AQUÍ',
    position: 'left',
    filterAction: {
      view: 'catalogo',
      genero: 'Mujer',
      tituloSeccion: 'Fragancias para Mujer',
    },
  },
  {
    id: 1,
    imageUrl: '/assets/banners/BANNERS-01.webp?v=5',
    title: 'SENSUALIDAD Y ELEGANCIA\nRUBY KAJAL',
    ctaLabel: 'ADQUIÉRELO AQUÍ',
    position: 'left',
    filterAction: {
      view: 'producto',
      productoSlug: 'kajal-ruby-100ml',
    },
  },
];

interface HeroBannerProps {
  slides?: BannerSlide[];
  autoPlayMs?: number;
  onActionClick: (filterAction: CatalogFiltersState) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  slides = DEFAULT_BANNER_SLIDES,
  autoPlayMs = 6000,
  onActionClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedSlides, setLoadedSlides] = useState<Record<number, boolean>>({});

  // Pre-carga silenciosa de todas las diapositivas para navegación instantánea
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.imageUrl;
      img.onload = () => {
        setLoadedSlides((prev) => ({ ...prev, [slide.id]: true }));
      };
    });
  }, [slides]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(nextSlide, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoPlayMs, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full aspect-[5000/2084] min-h-[260px] sm:min-h-[340px] md:min-h-0 max-h-[820px] overflow-hidden bg-drea-ink select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Imágenes del Carrusel con Overlay Editorial */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          onClick={() =>
            onActionClick({
              view: 'catalogo',
              ...slide.filterAction,
            })
          }
          className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Animación Skeleton Shimmer mientras descarga la fotografía del banner */}
          {!loadedSlides[slide.id] && (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#141414]">
              <div className="w-full h-full animate-pulse bg-gradient-to-r from-[#171615] via-[#2A151F] to-[#171615]" />
              <div className="absolute flex flex-col items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-drea-gold/30 border-t-drea-gold animate-spin" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-sans">
                  DREA PERFUMES
                </span>
              </div>
            </div>
          )}

          <img
            src={slide.imageUrl}
            alt={slide.title || 'DREA PERFUMES Banner'}
            loading={idx === 0 ? 'eager' : 'lazy'}
            onLoad={() => setLoadedSlides((prev) => ({ ...prev, [slide.id]: true }))}
            className={`w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${
              loadedSlides[slide.id] ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Overlay de Frase y Botón Editorial estilo Alta Perfumería */}
          {slide.title && (
            <div
              className={`absolute inset-0 flex items-center p-6 sm:p-12 md:p-16 lg:p-20 z-20 pointer-events-none ${
                slide.position === 'left'
                  ? 'justify-start'
                  : slide.position === 'center'
                  ? 'justify-center'
                  : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[280px] sm:max-w-md lg:max-w-lg flex flex-col gap-3 sm:gap-4 ${
                  slide.position === 'left'
                    ? 'items-start text-left'
                    : slide.position === 'center'
                    ? 'items-center text-center'
                    : 'items-end text-right'
                }`}
              >
                <h2 className="text-white font-sans text-xl sm:text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-[0.14em] sm:tracking-[0.16em] uppercase leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] whitespace-pre-line">
                  {slide.title}
                </h2>

                {slide.ctaLabel && (
                  <button
                    type="button"
                    className="pointer-events-auto border-2 border-white hover:border-drea-burgundy bg-black/40 hover:bg-drea-burgundy text-white hover:text-white px-5 py-2.5 sm:px-7 sm:py-3 text-[10px] sm:text-xs font-bold tracking-[0.22em] uppercase transition-all duration-300 backdrop-blur-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick({
                        view: 'catalogo',
                        ...slide.filterAction,
                      });
                    }}
                  >
                    {slide.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Controles Laterales (< y >) e Indicadores Inferiores */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente banner"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Indicadores Inferiores */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir al banner ${idx + 1}`}
                className={`h-1.5 transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-9 bg-drea-gold'
                    : 'w-3 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
