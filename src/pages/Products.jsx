import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import PriceWithDiscount from "@/components/ui/Price";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Check, Star } from "lucide-react";

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [addedItems, setAddedItems] = useState(new Set());
  const { addToCart } = useCart();

  const categories = [
    "All",
    "Necklace",
    "Bracelet",
    "Earrings",
    "Rings",
    "Pendants",
    "Scrunchies",
    "Claws",
    "Hairbows",
    "Hairclips",
    "Studs",
    "Jhumka",
    "Hamper",
    "Custom Packaging",
    "Bouquet",
  ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Handle URL parameters for category filtering
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && categories.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

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

  // Filter products based on selected category
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-primary mb-4">
            Our Collection
          </h1>
          <p className="text-lg font-inter text-muted-foreground max-w-2xl mx-auto">
            Discover our exquisite handcrafted jewellery collection
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  if (category === "All") {
                    setSearchParams({});
                  } else {
                    setSearchParams({ category });
                  }
                }}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => (
              <Card
                key={product.id || product._id}
                className="group overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/products/${product.id || product._id}`)}
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
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addedItems.has(product.id || product._id)}
                    className={`w-full h-8 text-xs sm:h-9 sm:text-sm transition-all duration-300 ${
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
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              Try selecting a different category or check back later
            </p>
            <Button onClick={() => setSelectedCategory("All")}>
              View All Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;