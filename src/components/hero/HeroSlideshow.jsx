import React, { useState, useEffect } from 'react';

const slides = [
  {
    url: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=2070&auto=format&fit=crop',
    alt: 'Afghanistan landscape'
  },
  {
    url: 'https://images.unsplash.com/photo-1552799446-159ba9523315?q=80&w=2070&auto=format&fit=crop',
    alt: 'Myanmar landscape'
  },
  {
    url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=2070&auto=format&fit=crop',
    alt: 'Rural Mexico'
  },
  {
    url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2071&auto=format&fit=crop',
    alt: 'Sub-Saharan Africa'
  }
];

export default function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-2000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-full h-full overflow-hidden">
            <img
              src={slide.url}
              alt={slide.alt}
              className="w-full h-full object-cover animate-slow-pan"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
      ))}
    </div>
  );
}