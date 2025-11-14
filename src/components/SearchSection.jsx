import { useState, useRef, useEffect } from "react";
import { Search, X, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

const SearchSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [addedItems, setAddedItems] = useState(new Set());
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchApi("/api/products");
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.category.toLowerCase().includes(term.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(term.toLowerCase()))
    );

    setSearchResults(filtered);
    setShowResults(true);
  };

  // Handle search result click
  const handleResultClick = (item) => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
    // Navigate to product detail page
    navigate(`/products/${item._id}`);
  };

  // Handle add to cart from search results
  const handleAddToCart = (item, event) => {
    event.stopPropagation();
    addToCart(item);
    setAddedItems((prev) => new Set([...prev, item._id]));

    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }, 2000);
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchTerm("");
    } else if (e.key === "Enter" && searchTerm.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  return (
    <div className="w-full bg-secondary/20 border-b border-border">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="relative" ref={resultsRef}>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for rings, necklaces, bracelets, earrings..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-12 h-12 text-base bg-background border-border focus-visible:ring-accent rounded-lg"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown - Only Product Names */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-2xl border-border">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""} - Press Enter to see
                  all
                </p>
                {searchResults.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleResultClick(item)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary rounded-lg cursor-pointer transition-colors group"
                  >
                    {/* Product Name */}
                    <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {item.name}
                    </span>

                    {/* Price */}
                    <span className="text-sm font-bold text-accent flex-shrink-0">
                      ${item.discountedPrice || item.originalPrice || item.price}
                    </span>
                  </div>
                ))}
                {searchResults.length > 8 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      +{searchResults.length - 8} more products. Press Enter to
                      see all.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* No Results */}
          {showResults && searchResults.length === 0 && searchTerm && (
            <Card className="absolute top-full mt-2 w-full z-50 shadow-2xl border-border">
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No products found for "
                  <span className="font-semibold text-foreground">
                    {searchTerm}
                  </span>
                  "
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try searching with different keywords
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchSection;
