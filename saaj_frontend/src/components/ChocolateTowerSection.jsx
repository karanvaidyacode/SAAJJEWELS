import React from "react";
import { Package } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const ChocolateTowerSection = () => {
  return (
    <ProductSlidingSection
      category="Chocolate Tower"
      title="🍫 Chocolate Towers"
      subtitle="Decadent chocolate towers for your sweet celebrations"
      icon={Package}
      badgeText="Best Seller"
      badgeColor="bg-amber-700"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default ChocolateTowerSection;
