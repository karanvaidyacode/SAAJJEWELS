import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useHashScroll = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollToSection = () => {
      const { hash } = location;
      if (hash) {
        // Remove the # from the hash
        const elementId = hash.replace('#', '');
        const element = document.getElementById(elementId);
        
        if (element) {
          // Account for sticky header (approximately 80px)
          const headerHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    };

    // Scroll immediately if there's a hash
    if (location.hash) {
      // Wait a bit for DOM to render
      setTimeout(scrollToSection, 100);
    }
  }, [location]);

  return null;
};

export default useHashScroll;