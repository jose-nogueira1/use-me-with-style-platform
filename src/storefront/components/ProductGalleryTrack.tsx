import { useLayoutEffect, useRef } from 'react';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';
import type { ProductImage } from '../../types/product';

/** One image track for both layouts, so mobile swipes and desktop controls
 * share the selected photo instead of maintaining competing galleries. */
export function ProductGalleryTrack({ images, selectedIndex, onSelect, tone, lang }: {
  images: ProductImage[];
  selectedIndex: number;
  onSelect: (url: string) => void;
  tone: ProductTone;
  lang: 'pt' | 'en';
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reportedIndex = useRef<number | null>(null);
  const currentIndex = useRef(selectedIndex);

  useLayoutEffect(() => {
    currentIndex.current = selectedIndex;
    // A swipe already positioned the track. Do not snap it mid-gesture
    // when the parent accepts the newly visible photo.
    if (reportedIndex.current === selectedIndex) return;
    reportedIndex.current = selectedIndex;
    const track = trackRef.current;
    if (track) track.scrollLeft = Math.max(0, selectedIndex) * track.clientWidth;
  }, [selectedIndex]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let width = track.clientWidth;
    const observer = new ResizeObserver(() => {
      if (track.clientWidth === width) return;
      width = track.clientWidth;
      track.scrollLeft = Math.max(0, currentIndex.current) * width;
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={trackRef}
      className="ump-product-gallery-track"
      role="region"
      aria-label={lang === 'pt' ? 'Fotografias do produto' : 'Product photos'}
      tabIndex={images.length > 1 ? 0 : undefined}
      onKeyDown={event => {
        if (images.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        onSelect(images[(Math.max(0, selectedIndex) + (event.key === 'ArrowRight' ? 1 : -1) + images.length) % images.length].url);
      }}
      onScroll={event => {
        const track = event.currentTarget;
        if (!track.clientWidth) return;
        const index = Math.max(0, Math.min(images.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
        if (!images[index] || reportedIndex.current === index) return;
        reportedIndex.current = index;
        onSelect(images[index].url);
      }}
    >
      {(images.length ? images : [undefined]).map((image, index) => (
        <div className="ump-product-gallery-slide" key={image?.url ?? 'placeholder'}>
          <ProductPhoto tone={tone} radius={0} image={image} variant="full" priority={index === Math.max(0, selectedIndex)} />
        </div>
      ))}
    </div>
  );
}
