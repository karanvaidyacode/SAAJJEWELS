import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SlidingSection = ({ 
  children, 
  title, 
  subtitle, 
  viewAllLink, 
  viewAllText = "View All",
  itemsPerView = { mobile: 2, tablet: 3, desktop: 4 },
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(itemsPerView.mobile);
  const scrollContainerRef = useRef(null);

  // Update items per slide based on screen size
  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerSlide(itemsPerView.desktop);
      } else if (window.innerWidth >= 768) {
        setItemsPerSlide(itemsPerView.tablet);
      } else {
        setItemsPerSlide(itemsPerView.mobile);
      }
    };

    updateItemsPerSlide();
    window.addEventListener('resize', updateItemsPerSlide);
    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, [itemsPerView]);

  const totalItems = React.Children.count(children);
  const maxIndex = Math.max(0, totalItems - itemsPerSlide);

  const scrollToIndex = (index) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.scrollWidth / totalItems;
      const scrollPosition = index * itemWidth;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.scrollWidth / totalItems;
      const newIndex = Math.round(container.scrollLeft / itemWidth);
      setCurrentIndex(newIndex);
    }
  };

  return (
    <section className={`py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30 ${className}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="h-10 w-10 hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="h-10 w-10 hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* View All Button */}
            {viewAllLink && (
              <Button
                variant="outline"
                onClick={viewAllLink}
                className="hidden md:flex items-center gap-2 hover:bg-accent hover:text-white transition-colors"
              >
                {viewAllText}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sliding Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {React.Children.map(children, (child, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0"
                  style={{ 
                    minWidth: '180px',
                    maxWidth: '250px'
                  }}
                >
                  {child}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View All Button */}
        {viewAllLink && (
          <div className="flex justify-center mt-8 md:hidden">
            <Button
              variant="outline"
              onClick={viewAllLink}
              className="w-full max-w-xs flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-colors"
            >
              {viewAllText}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Dots Indicator */}
        {totalItems > itemsPerSlide && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-accent w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SlidingSection;