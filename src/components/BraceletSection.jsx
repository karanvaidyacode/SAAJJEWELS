import React from "react";
import { CircleDot } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const BraceletSection = () => {
  return (
    <ProductSlidingSection
      category="Bracelet"
      title="💎 Bracelets"
      subtitle="Elegant bracelets to adorn your wrist with style and grace"
      icon={CircleDot}
      badgeText="Bracelet"
      badgeColor="bg-blue-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default BraceletSection;

