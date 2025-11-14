import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import NecklaceSection from "@/components/NecklaceSection";
import BraceletSection from "@/components/BraceletSection";
import EarringsSection from "@/components/EarringsSection";
import CustomPackagingSection from "@/components/CustomPackagingSection";
import JustDropSection from "@/components/JustDropSection";
import FreeGiftSection from "@/components/FreeGiftSection";
import OfferSection from "@/components/OfferSection";
import React from 'react';
import useHashScroll from '@/hooks/useHashScroll';

const quotes = [
  "💎 Premium-Look, Pocket-Friendly",
  "🚚 Fast, Pan-India Shipping",
  "❤️ Curated With Love",
  "✨ Handpicked Collections",
  "🎉 For Every Celebration",
  "👑 Style Meets Affordability"
];

function RunningQuotesBar() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-50/90 via-rose-50/90 to-amber-50/90 py-3 overflow-hidden border-y border-amber-200 backdrop-blur-sm">
      <div className="flex gap-12 animate-marquee whitespace-nowrap text-rose-900 font-serif text-base sm:text-lg tracking-wider items-center">
        {quotes.concat(quotes).map((quote, i) => (
          <span 
            key={i} 
            className="mx-4 px-4 py-2 rounded-full bg-white/70 border border-rose-200 shadow-sm hover:bg-rose-50/80 transition-all duration-300 ease-in-out font-medium"
          >
            {quote}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}

const Index = () => {
  // Use the hash scroll hook to handle scrolling to sections
  useHashScroll();

  return (
    <div className="w-full">
      <CategoriesSection />
      <HeroSection />
      <JustDropSection />
      <OfferSection />
      <NecklaceSection />
      <RunningQuotesBar />
      <BraceletSection />
      <FreeGiftSection />
      <CustomPackagingSection />
    </div>
  );
};

export default Index;