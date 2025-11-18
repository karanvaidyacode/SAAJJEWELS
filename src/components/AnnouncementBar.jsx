import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const announcements = [
  "🎁 Free shipping on prepaid orders above ₹799/-",
  "📢 Cash on delivery [COD] available on orders above ₹449/-",
  "📦 Order delivery time 5-7 working days",
  "📹 Note: Unboxing video compulsory for claims"
];

const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % announcements.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);

  return (
    <div className="bg-[hsl(var(--announcement-bg))] text-[hsl(var(--announcement-fg))] py-2 px-4">
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        <button
          onClick={prev}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Previous announcement"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex-1 text-center">
          <p className="text-sm font-inter animate-fade-in">
            {announcements[currentIndex]}
          </p>
        </div>
        
        <button
          onClick={next}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Next announcement"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
