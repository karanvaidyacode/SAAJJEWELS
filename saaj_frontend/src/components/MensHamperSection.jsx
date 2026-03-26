import React from "react";
import { User } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const MensHamperSection = () => {
  return (
    <ProductSlidingSection
      category="Men's Hamper"
      title="👔 Men's Hampers"
      subtitle="Sophisticated gift hampers curated for him"
      icon={User}
      badgeText="Gifts"
      badgeColor="bg-blue-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default MensHamperSection;
