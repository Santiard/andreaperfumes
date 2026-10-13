import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerSlide, CatalogFiltersState } from '../../types/catalog';

/**
 * Slides por defecto que consumen las imágenes de:
 * frontend/public/assets/banners/imagen1.webp
 * frontend/public/assets/banners/imagen2.webp
 * frontend/public/assets/banners/imagen3.webp
 */
export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 1,
    imageUrl: '/assets/banners/imagen1.webp?v=2',
    eyebrow: 'DREA PERFUMES · CÚCUTA · COLECCIÓN 2026',
    title: 'Una selección de perfumes para cada estilo',
    subtitle:
      'Boutique digital de perfumería selectiva: Árabe, Nicho y Diseñador. Entregas el mismo día en Cúcuta y envíos asegurados a toda Colombia.',
    ctaLabel: 'Explorar Catálogo',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Catálogo Completo',
    },
  },
  {
    id: 2,
    imageUrl: '/assets/banners/imagen2.webp?v=2',
    eyebrow: 'PRIVATE SELECTION · SALE',
    title: 'Selección SALE en Perfumería Nicho, Diseñador y Árabe',
    subtitle:
      'Descubre fragancias 100% originales y cofres de regalo con privilegios exclusivos por tiempo limitado.',
    ctaLabel: 'Explorar SALE',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Selección SALE · Piezas de Oportunidad',
      en_promocion: 1,
    },
  },
  {
    id: 3,
    imageUrl: '/assets/banners/imagen3.webp?v=2',
    eyebrow: 'NOVEDADES & TENDENCIAS',
    title: 'Lanzamientos Recientes de Alta Perfumería',
    subtitle:
      'Conoce las últimas incorporaciones a nuestro mostrador con su pirámide olfativa detallada y compra asistida por WhatsApp.',
    ctaLabel: 'Ver Lanzamientos',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Lanzamientos Recientes',
      orden: 'recientes',
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
      className="relative w-full h-[260px] sm:h-[420px] lg:h-[560px] overflow-hidden bg-drea-ink select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Imágenes limpias del Carrusel (Sin textos HTML ni velos encima) */}
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
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      {/* Controles Laterales (< y >) e Indicadores Inferiores */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-colors shadow-md"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente banner"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-colors shadow-md"
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
