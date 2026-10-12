import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
    imageUrl: '/assets/banners/imagen1.webp',
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
    imageUrl: '/assets/banners/imagen2.webp',
    eyebrow: 'SELECCIÓN ESPECIAL · SALE',
    title: 'Ofertas en Perfumes Nicho, Diseñador y Árabes',
    subtitle:
      'Descubre presentaciones regulares, testers y decants originales con precios especiales por tiempo limitado.',
    ctaLabel: 'Ver Ofertas',
    filterAction: {
      view: 'catalogo',
      tituloSeccion: 'Ofertas & Oportunidades (Sale)',
      en_promocion: 1,
    },
  },
  {
    id: 3,
    imageUrl: '/assets/banners/imagen3.webp',
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

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-drea-ink select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Imágenes del Carrusel (/assets/banners/imagen1.webp, imagen2.webp, imagen3.webp) */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Velo gradual oscuro/borgoña para garantizar lectura impecable de los textos */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
        </div>
      ))}

      {/* Contenido Editorial Superpuesto (Inspirado en Cartier / Mafer / Propuesta DREA) */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-center">
        <div className="max-w-2xl text-white space-y-4">
          <span className="inline-block text-[11px] sm:text-xs tracking-editorial uppercase text-drea-gold-light font-semibold">
            {currentSlide.eyebrow}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] text-white">
            {currentSlide.title}
          </h1>

          <div className="w-24 h-[1.5px] bg-drea-gold" />

          <p className="text-sm sm:text-base text-white/85 font-light leading-relaxed max-w-xl">
            {currentSlide.subtitle}
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={() =>
                onActionClick({
                  view: 'catalogo',
                  ...currentSlide.filterAction,
                })
              }
              className="inline-flex items-center gap-3 px-7 py-3.5 text-xs uppercase tracking-editorial font-semibold bg-drea-gold-gradient text-drea-ink hover:brightness-105 transition-all shadow-gold-glow"
            >
              <span>{currentSlide.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Controles Laterales (< y > como en los pantallazos de referencia) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-colors shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente banner"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/90 hover:bg-drea-burgundy text-drea-ink hover:text-white flex items-center justify-center transition-colors shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores Inferiores */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
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
