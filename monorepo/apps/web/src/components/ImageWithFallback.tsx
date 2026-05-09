import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function ImageWithFallback({
  src, alt, width, height, className,
  loading = 'lazy',
  fetchPriority,
}: Props) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? '/placeholder.png' : src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
      onError={() => setError(true)}
    />
  );
}
