import { useState, useEffect } from "react";
import heroImage1 from "@/assets/hero_jewelry_1.jpg";
import heroImage2 from "@/assets/hero_jewelry_2.jpg";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const images = [heroImage1, heroImage2];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(0); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Images */}
        <div 
          className="relative w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute w-full transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{
                position: index === 0 ? "relative" : "absolute",
                top: index === 0 ? "auto" : 0,
                left: 0,
              }}
            >
              <img
                src={image}
                alt={`Jewellery Banner ${index + 1}`}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator - Below Image */}
      <div className="flex justify-center gap-2 md:gap-3 py-4 md:py-6 bg-gradient-to-b from-background/50 to-background">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-accent w-6 h-2 md:w-8 md:h-3"
                : "bg-gray-400 hover:bg-gray-500 w-2 h-2 md:w-3 md:h-3"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};


export default HeroSection;
