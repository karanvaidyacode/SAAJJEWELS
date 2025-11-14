import React, { useEffect } from "react";
import { Sparkles } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const JustDropSection = () => {
  // Function to get the newest products (based on ID as a proxy for recency)
  const getNewestProducts = (products) => {
    return [...products].sort((a, b) => b.id - a.id).slice(0, 8);
  };

  return (
    <div id="just-drops" className="scroll-mt-20">
      <ProductSlidingSection
        title="✨ Just Dropped"
        subtitle="Fresh arrivals you won't want to miss"
        icon={Sparkles}
        badgeText="New"
        badgeColor="bg-purple-600"
        itemsPerView={{ mobile: 2, tablet: 3, desktop: 6 }}
        maxItems={8}
        filterFunction={getNewestProducts}
      />
    </div>
  );
};

export default JustDropSection;