import React from "react";
import { Package } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const CustomPackagingSection = () => {
  return (
    <ProductSlidingSection
      category="Custom Packaging"
      title="📦 Custom Packaging"
      subtitle="Elegant packaging solutions to present your jewelry with style and sophistication"
      icon={Package}
      badgeText="Packaging"
      badgeColor="bg-amber-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default CustomPackagingSection;












