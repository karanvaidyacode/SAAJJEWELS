import React from "react";
import { Diamond } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const NecklaceSection = () => {
  return (
    <ProductSlidingSection
      category="Necklace"
      title="💎 Necklaces"
      subtitle="Exquisite necklaces to enhance your neckline with timeless beauty"
      icon={Diamond}
      badgeText="Necklace"
      badgeColor="bg-emerald-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default NecklaceSection;

