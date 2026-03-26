import React from "react";
import { Gem } from "lucide-react";
import ProductSlidingSection from "./ProductSlidingSection";

const JhumkaBoxSection = () => {
  return (
    <ProductSlidingSection
      category="Jhumka Box"
      title="🎁 Jhumka Boxes"
      subtitle="Exquisite Jhumka collections in beautifully crafted boxes"
      icon={Gem}
      badgeText="New Arrival"
      badgeColor="bg-purple-600"
      itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
      maxItems={6}
    />
  );
};

export default JhumkaBoxSection;
