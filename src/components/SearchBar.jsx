import { useState, useRef, useEffect } from "react";
import { Search, X, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import PriceWithDiscount from "@/components/ui/Price";

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [addedItems, setAddedItems] = useState(new Set());
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

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
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchApi(`/api/products/search?q=${encodeURIComponent(term)}`);
      setSearchResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching products:", error);
      // Fallback to client-side search
      const filtered = products.filter(
        (item) =>
          item.name.toLowerCase().includes(term.toLowerCase()) ||
          item.category.toLowerCase().includes(term.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(term.toLowerCase()))
      );
      setSearchResults(filtered);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle search result click
  const handleResultClick = (item) => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
    setIsOpen(false);
    // Navigate to product detail page
    navigate(`/products/${item.id}`);
  };

  // Handle add to cart from search results
  const handleAddToCart = (item, event) => {
    event.stopPropagation(); // Prevent navigation when clicking add to cart
    addToCart(item);
    setAddedItems((prev) => new Set([...prev, item.id]));

    // Reset the "Added!" state after 2 seconds
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 2000);
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
        setIsOpen(false);
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
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Button */}
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-secondary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </Button>

      {/* Search Input */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 md:w-96 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <div className="flex items-center bg-background border border-border rounded-lg shadow-lg backdrop-blur-sm">
              <Search className="w-4 h-4 text-muted-foreground ml-3" />
              <Input
                type="text"
                placeholder="Search jewellery..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary mr-2"
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                  setShowResults(false);
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-background border border-border shadow-lg z-50">
                <div ref={resultsRef}>
                  {searchResults.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-b-0 transition-colors"
                      onClick={() => handleResultClick(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {item.name
                              .split(new RegExp(`(${searchTerm})`, "gi"))
                              .map((part, index) =>
                                part.toLowerCase() ===
                                searchTerm.toLowerCase() ? (
                                  <span
                                    key={index}
                                    className="bg-accent/20 text-accent font-semibold"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )
                              )}
                          </h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <span className="text-sm font-semibold text-accent mb-2">
                            <PriceWithDiscount product={item} size="sm" />
                          </span>
                          <Button
                            size="sm"
                            onClick={(e) => handleAddToCart(item, e)}
                            className={`h-7 px-2 text-xs animate-shake ${
                              addedItems.has(item.id)
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-accent hover:bg-accent/90"
                            }`}
                            disabled={addedItems.has(item.id)}
                          >
                            {addedItems.has(item.id) ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length > 5 && (
                    <div className="p-3 text-center border-t border-border">
                      <button
                        className="text-sm text-accent hover:text-accent/80 font-medium"
                        onClick={() => {
                          console.log("View all results for:", searchTerm);
                          setSearchTerm("");
                          setSearchResults([]);
                          setShowResults(false);
                          setIsOpen(false);
                          navigate("/products");
                        }}
                      >
                        View all {searchResults.length} results
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Popular Searches */}
            {!showResults && searchTerm.trim() === "" && (
              <Card className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg z-50">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Popular Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Diamond",
                      "Gold",
                      "Pearl",
                      "Silver",
                      "Wedding",
                      "Ruby",
                      "Emerald",
                      "Sapphire",
                      "Hamper",
                    ].map((term) => (
                      <button
                        key={term}
                        className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                        onClick={() => handleSearch(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* No Results */}
            {showResults &&
              searchResults.length === 0 &&
              searchTerm.trim() !== "" && (
                <Card className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg z-50">
                  <div className="p-3 text-center text-muted-foreground">
                    <p className="text-sm">
                      No jewellery found matching "{searchTerm}"
                    </p>
                    <p className="text-xs mt-1">
                      Try searching for "diamond", "gold", or "pearl"
                    </p>
                  </div>
                </Card>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
