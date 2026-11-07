import React, { useState } from 'react';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  skeletonType?: 'dark' | 'light';
  showSpinner?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt = 'Perfume DREA',
  className = '',
  containerClassName = '',
  skeletonType = 'light',
  showSpinner = false,
  loading = 'lazy',
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Animación Skeleton Shimmer de Alta Perfumería */}
      {!isLoaded && !hasError && (
        <div
          className={`absolute inset-0 z-0 flex items-center justify-center ${
            skeletonType === 'dark'
              ? 'bg-gradient-to-r from-[#171615] via-[#2D1620] to-[#171615] animate-pulse'
              : 'bg-gradient-to-r from-[#F5F4F2] via-[#EAE7E1] to-[#F5F4F2] animate-pulse'
          }`}
        >
          {showSpinner && (
            <div className="w-6 h-6 rounded-full border-2 border-drea-gold/30 border-t-drea-gold animate-spin" />
          )}
        </div>
      )}

      {/* Imagen real con fundido progresivo sin renderizado por bloques */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />
    </div>
  );
};
