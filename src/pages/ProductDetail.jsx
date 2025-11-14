import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Share2,
  Star,
  Check,
  ChevronLeft,
  Shield,
  Truck,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import PriceWithDiscount from "@/components/ui/Price";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { totalPrice } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Fetch the specific product
        const productData = await fetchApi(`/api/products/${id}`);
        
        // Check if the product image is a blob URL and replace it
        const processedProduct = productData.image && productData.image.startsWith('blob:') 
          ? { ...productData, image: '/images/placeholder.jpg' } 
          : productData;
          
        setProduct(processedProduct);
        
        // Fetch all products to get related products
        const allProducts = await fetchApi("/api/products");
        const related = allProducts
          .filter((p) => p.category === processedProduct.category && (p.id || p._id) !== (processedProduct.id || processedProduct._id))
          .map(p => p.image && p.image.startsWith('blob:') ? { ...p, image: '/images/placeholder.jpg' } : p)
          .slice(0, 8);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        });
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      navigate("/products");
    }
    
    window.scrollTo(0, 0);
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!product) return;
    
    // Fetch related products when product changes
    const fetchRelatedProducts = async () => {
      try {
        const allProducts = await fetchApi("/api/products");
        const related = allProducts
          .filter((p) => p.category === product.category && (p.id || p._id) !== (product.id || product._id))
          .map(p => p.image && p.image.startsWith('blob:') ? { ...p, image: '/images/placeholder.jpg' } : p)
          .slice(0, 8);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };
    
    fetchRelatedProducts();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    toast({
      title: "Redirecting to checkout...",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
    navigate("/cart");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard.",
      });
    }
  };

  const FREE_SHIP_LIMIT = 799;
  const left = Math.max(0, FREE_SHIP_LIMIT - totalPrice);
  const hasFreeShip = totalPrice >= FREE_SHIP_LIMIT;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-accent transition-colors">
            Products
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-accent transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <Card className="overflow-hidden rounded-3xl shadow-2xl sticky top-8 group">
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary/30 via-secondary/20 to-accent/10 relative">
                {/* Product Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/600x600?text=No+Image";
                  }}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 4.5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating || 4.5} ({product.reviews || 0} reviews)
                </span>
              </div>
              <div className="mb-6">
                <PriceWithDiscount product={product} size="xl" />
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-5 h-5 text-accent" />
                  {hasFreeShip ? (
                    <span className="text-accent font-semibold">
                      You unlock FREE SHIPPING!
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground font-semibold">
                      Add ₹{left.toFixed(2)} more to get{" "}
                      <span className="text-accent">FREE SHIPPING!</span>
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-accent transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (totalPrice / FREE_SHIP_LIMIT) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
             
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  className={`flex-1 h-14 text-lg animate-shake hover:animate-shake ${
                    isAdded ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={handleShare}
                >
                  <Share2 className="w-6 h-6" />
                </Button>
              </div>

              <Button
                onClick={handleBuyNow}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Buy It Now
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Shield,
                  title: "Authenticity",
                  desc: "Certified Genuine",
                },
                { icon: Truck, title: "Shipping", desc: "₹69 flat rate" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg"
                >
                  <Icon className="w-6 h-6 text-accent" />
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Information Sections */}
        <div className="mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-6">
            Product Information
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {/* Description Section */}
            <AccordionItem
              value="description"
              className="border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-lg font-semibold hover:text-accent">
                Description
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <p className="text-muted-foreground leading-relaxed">
                  {product.longDescription || product.description}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Care Instructions Section */}
            <AccordionItem
              value="care"
              className="border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-lg font-semibold hover:text-accent">
                Care Instructions
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <p className="text-muted-foreground leading-relaxed">
                  {product.care ||
                    "Clean with soft cloth. Avoid harsh chemicals. Store in jewelry box when not wearing."}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Shipping Information Section */}
            <AccordionItem
              value="shipping"
              className="border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-lg font-semibold hover:text-accent">
                Shipping & Delivery
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {product.shipping ||
                      "Standard shipping at ₹69 flat rate available. Free shipping on order above ₹799"}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Related Products - Horizontal Scroll */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-playfair font-bold mb-8">
              You May Also Like
            </h2>
            <div className="relative">
              <div
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {relatedProducts.map((item) => (
                  <Card
                    key={item._id}
                    className="group overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all cursor-pointer flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] snap-start"
                    onClick={() => navigate(`/products/${item._id}`)}
                  >
                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/300x300?text=No+Image";
                        }}
                      />
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3 className="text-xs sm:text-sm md:text-base font-playfair font-semibold mb-1 sm:mb-2 group-hover:text-accent line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="text-sm sm:text-base md:text-lg font-bold">
                        <PriceWithDiscount product={item} size="sm" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;