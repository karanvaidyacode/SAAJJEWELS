import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Check } from "lucide-react";
import PriceWithDiscount from "@/components/ui/Price";
import SlidingSection from "@/components/ui/SlidingSection";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { fetchApi } from "@/lib/api";

const ProductSlidingSection = ({
  category,
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = "bg-accent",
  itemsPerView = { mobile: 2, tablet: 3, desktop: 4 },
  maxItems = 8,
  filterFunction = null,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState(new Set());

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchApi("/api/products");
        // Filter out any products with blob URLs and replace with placeholder
        const filteredData = Array.isArray(data) ? data.map(product => {
          // Check if the image is a blob URL
          if (product.image && product.image.startsWith('blob:')) {
            // Replace blob URLs with placeholder image
            return {
              ...product,
              image: '/images/placeholder.jpg'
            };
          }
          return product;
        }) : [];
        setProducts(filteredData);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get products based on category or custom filter
  let filteredProducts = products;

  if (filterFunction) {
    filteredProducts = filterFunction(products);
  } else if (category) {
    filteredProducts = products.filter(
      (product) => product.category === category
    );
  }

  // Limit products to maxItems
  const displayedProducts = filteredProducts.slice(0, maxItems);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product);
    setAddedItems((prev) => new Set([...prev, product.id || product._id]));
    
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });

    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id || product._id);
        return newSet;
      });
    }, 2000);
  };

  return (
    <SlidingSection
      title={title}
      subtitle={subtitle}
      icon={Icon}
      badgeText={badgeText}
      badgeColor={badgeColor}
      itemsPerView={itemsPerView}
      loading={loading}
    >
      {displayedProducts.map((product) => (
        <Card
          key={product.id || product._id}
          className="group overflow-hidden rounded-xl hover:shadow-xl transition-all cursor-pointer flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]"
          onClick={() => navigate(`/products/${product.id || product._id}`)}
        >
          <div className="relative">
            <div className="aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = "https://placehold.co/400x400?text=No+Image";
                }}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 4.5)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {product.rating || 4.5}
              </span>
            </div>
            
            <h3 className="text-sm font-playfair font-semibold mb-1 group-hover:text-accent line-clamp-2">
              {product.name}
            </h3>
            
            <div className="mb-2">
              <PriceWithDiscount product={product} size="sm" />
            </div>

            <Button
              onClick={(e) => handleAddToCart(product, e)}
              disabled={addedItems.has(product.id || product._id)}
              className={`w-full h-8 text-xs transition-all duration-300 ${
                addedItems.has(product.id || product._id)
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }`}
            >
              {addedItems.has(product.id || product._id) ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}
    </SlidingSection>
  );
};

export default ProductSlidingSection;