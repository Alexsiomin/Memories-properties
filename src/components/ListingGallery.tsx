import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Thumbnail from '@/components/Thumbnail';

type Props = {
  images: string[];
  alt: string;
  eager?: boolean;
};

const ListingGallery = ({ images, alt, eager }: Props) => {
  const total = images.length;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (total <= 1) {
    return (
      <div className="relative overflow-hidden">
        <Thumbnail
          src={images[0]}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          wrapperClassName="aspect-[4/3]"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
      </div>
    );
  }


  return (
    <div className="relative overflow-hidden">
      <div className="overflow-hidden aspect-[4/3]" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, i) => (
            <div className="min-w-0 shrink-0 grow-0 basis-full h-full" key={`${img}-${i}`}>
              <Thumbnail
                src={img}
                alt={`${alt} ${i + 1}`}
                loading={eager && i === 0 ? 'eager' : 'lazy'}
                wrapperClassName="h-full"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous image"
        onClick={(e) => {
          e.stopPropagation();
          scrollPrev();
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={(e) => {
          e.stopPropagation();
          scrollNext();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300"
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        {images.slice(0, 6).map((_, d) => (
          <span
            key={d}
            className={`rounded-full transition-all ${
              d === selectedIndex ? 'w-1.5 h-1.5 bg-white' : 'w-1 h-1 bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ListingGallery;
