import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Check, RefreshCw } from "lucide-react";
import PriceWithDiscount from "@/components/ui/Price";
import SlidingSection from "@/components/ui/SlidingSection";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { fetchApi } from "@/lib/api";

const BestSellerSection = () => {
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
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get best sellers (products with rating >= 4.8 and high review count)
  const getBestSellers = (allProducts) => {
    return allProducts
      .filter(
        (product) =>
          (product.rating && product.rating >= 4.8) ||
          (product.reviews && product.reviews >= 100)
      )
      .sort((a, b) => {
        // Sort by rating first, then by review count
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return (b.reviews || 0) - (a.reviews || 0);
      })
      .slice(0, 8);
  };

  const bestSellers = getBestSellers(products);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1); // Pass quantity as second parameter
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
      title="Best Sellers"
      subtitle="Our most loved pieces"
      badgeText="Popular"
      badgeColor="bg-rose-500"
      loading={loading}
    >
      {bestSellers.map((product) => (
        <Card
          key={product.id || product._id}
          className="group overflow-hidden rounded-xl hover:shadow-xl transition-all cursor-pointer flex-shrink-0 w-[150px] sm:w-[180px] md:w-[220px]"
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

            <div className="absolute top-2 left-2">
              <Badge className="bg-rose-500">Best Seller</Badge>
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

export default BestSellerSection;