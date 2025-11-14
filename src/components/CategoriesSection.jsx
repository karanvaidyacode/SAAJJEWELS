import necklaceImg from "@/assets/Necklace.jpg";
import braceletImg from "@/assets/Bracelets.jpg";
import earringsImg from "@/assets/Earrings.jpg";
import ringsImg from "@/assets/Rings.jpg";
import hamperImg from "@/assets/Hamper.jpg";
import pendantsImg from "@/assets/Pendent.jpg";
import scrunchiesImg from "@/assets/Scrunchies.jpg";
import clawsImg from "@/assets/Claws.jpg";
import hairbowsImg from "@/assets/HairBows.jpg";
import hairclipsImg from "@/assets/Hairclips.jpg";
import studsImg from "@/assets/Studs.jpg";
import jhumkaImg from "@/assets/Jhumka.jpg";
import customPackagingImg from "@/assets/CustomPackaging.jpg";
import bouquetImg from "@/assets/Bouquet.jpg";
import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Necklace", image: necklaceImg },
  { name: "Bracelet", image: braceletImg },
  { name: "Earrings", image: earringsImg },
  { name: "Rings", image: ringsImg },
  { name: "Pendants", image: pendantsImg },
  { name: "Scrunchies", image: scrunchiesImg },
  { name: "Claws", image: clawsImg },
  { name: "Hairbows", image: hairbowsImg },
  { name: "Hairclips", image: hairclipsImg },
  { name: "Studs", image: studsImg },
  { name: "Jhumka", image: jhumkaImg },  
  { name: "Hamper", image: hamperImg },
  { name: "Custom Packaging", image: customPackagingImg },
  { name: "Bouquet", image: bouquetImg },
];

const CategoriesSection = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    // Navigate to products page with category filter
    navigate(`/products?category=${categoryName}`);
  };

  return (
    <section
      id="shop"
      className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-primary mb-4">
            ✨ Shop Categories !
          </h2>
          <p className="text-lg font-inter text-muted-foreground max-w-2xl mx-auto">
            Explore our exquisite collection of handcrafted jewellery
          </p>
        </div>

        {/* Mobile: Horizontal Scroll with Sliding */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 pb-4">
            {categories.map((category, index) => (
              <div
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className="group relative overflow-hidden rounded-lg bg-card shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in cursor-pointer flex-shrink-0 w-[150px]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-[150px] h-[150px] overflow-hidden">
                  <img
                    src={category.image}
                    alt={`${category.name} collection`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/150x150?text=No+Image";
                    }}
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-xs font-playfair font-bold text-white mb-1 drop-shadow-lg">
                    {category.name}
                  </h3>
                  <div className="h-0.5 w-6 bg-accent rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout with Sliding */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide scroll-smooth">
              <div className="flex gap-4 md:gap-6" style={{ width: 'max-content' }}>
                {categories.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex-shrink-0"
                    style={{ 
                      width: '150px',
                      minWidth: '150px'
                    }}
                  >
                    <div
                      onClick={() => handleCategoryClick(category.name)}
                      className="group relative overflow-hidden rounded-xl bg-card shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-500 animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-[150px] h-[150px] overflow-hidden">
                        <img
                          src={category.image}
                          alt={`${category.name} collection`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/150x150?text=No+Image";
                          }}
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-lg font-playfair font-bold text-white mb-1 drop-shadow-lg">
                          {category.name}
                        </h3>
                        <div className="h-0.5 w-12 bg-accent rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <p className="text-xs text-white/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to explore
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;