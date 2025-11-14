import React from "react";
import { Gem } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const EarringsSection = () => {
  return (
    <ProductSlidingSection
      category="Earrings"
      title="✨ Earrings"
      subtitle="Stunning earrings to frame your face with beauty and elegance"
      icon={Gem}
      badgeText="Earrings"
      badgeColor="bg-purple-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default EarringsSection;

