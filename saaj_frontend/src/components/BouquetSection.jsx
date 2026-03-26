import React from "react";
import { Sparkles } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const BouquetSection = () => {
  return (
    <ProductSlidingSection
      category="Bouquet"
      title="💐 Bouquets"
      subtitle="Exquisite bouquets perfect for every occasion"
      icon={Sparkles}
      badgeText="Bouquet"
      badgeColor="bg-rose-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default BouquetSection;
