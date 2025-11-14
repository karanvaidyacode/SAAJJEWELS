import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Check,
  Search,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import PriceWithDiscount from "@/components/ui/Price";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q") || "";
  const [addedItems, setAddedItems] = useState(new Set());
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // If there's a search query, use the search endpoint
        if (searchQuery.trim() !== "") {
          const data = await fetchApi(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
          setProducts(Array.isArray(data) ? data : []);
        } else {
          // Otherwise fetch all products
          const data = await fetchApi("/api/products");
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchQuery]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product);
    setAddedItems((prev) => new Set([...prev, product._id]));

    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product._id);
        return newSet;
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">
            Search Results
          </h1>
          <p className="text-muted-foreground">
            {products.length} result{products.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((product, index) => (
              <Card
                key={product._id}
                className="group overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/products/${product._id}`)}
              >
                <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-rose-50 to-amber-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/400x400?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                <div className="p-3 sm:p-4">
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
                  
                  <h3 className="text-xs sm:text-sm md:text-base font-playfair font-semibold mb-1 sm:mb-2 group-hover:text-accent line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="mb-3">
                    <PriceWithDiscount product={product} size="sm" />
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product, e);
                      toast({
                        title: "Added to cart!",
                        description: `${product.name} has been added to your cart.`,
                      });
                    }}
                    disabled={addedItems.has(product._id)}
                    className={`w-full h-8 text-xs sm:h-9 sm:text-sm transition-all duration-300 ${
                      addedItems.has(product._id)
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }`}
                  >
                    {addedItems.has(product._id) ? (
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
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">
              No results found for "{searchQuery}"
            </h3>
            <p className="text-muted-foreground mb-6">
              Try different keywords or browse our collection
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;