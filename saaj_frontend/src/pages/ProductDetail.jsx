import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  Upload,
  Image as ImageIcon,
  X as CloseIcon
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import PriceWithDiscount from "@/components/ui/Price";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";
import { SEO, ProductJsonLd, BreadcrumbJsonLd } from "@/components/SEO";

const categoryCareInstructions = {
  "Necklace": "Clean with a soft, dry cloth after each use. Avoid contact with perfumes, hairspray, and water. Store in an airtight pouch or a jewellery box to prevent oxidation and maintain its brilliant shine.",
  "Bracelet": "Gently wipe with a lint-free cloth. Remove before swimming, bathing, or sleeping. Keep away from harsh chemicals and store separately to avoid scratches from other jewellery pieces.",
  "Earrings": "Sanitize the posts before use. Wipe the jewellery with a dry cloth after wearing. Protect from moisture and keep in a cool, dry place to prevent any tarnishing.",
  "Rings": "Remove while performing household chores, exercising, or using hand sanitizer. Clean with a soft cloth and store in a padded jewellery box to protect the finish.",
  "Pendants": "Avoid tugging on the chain. Wipe the pendant and chain with a soft cloth after use. Store flat or hanging to avoid tangles and maintain the delicate details.",
  "Scrunchies": "Hand wash gently with mild detergent if needed. Air dry in shade. Avoid excessive stretching to maintain the elasticity and fabric richness.",
  "Claws": "Handle with care to avoid breaking the grip. Avoid dropping on hard surfaces. Wipe with a damp cloth if necessary and keep away from high heat.",
  "Hairbows": "Spot clean only with a damp cloth. Do not machine wash. Store in a way that preserves their shape and prevents creasing of the ribbon.",
  "Hairclips": "Keep away from hairspray and moisture to prevent tarnish or rust on the metal parts. Wipe clean after use and store in a dry place.",
  "Studs": "Clean the studs and backings regularly with a sanitizing wipe. Store in pairs in a dedicated jewellery organizer to avoid losing the backings.",
  "Jhumka": "Handle the delicate bells and beads with care. Keep away from water and humidity. Store in an airtight container to preserve the intricate traditional finish.",
  "Hamper": "Store in a cool, dry place away from direct sunlight. Handle the packaging with care to maintain its aesthetic appeal and the arrangement of items inside.",
  "Custom Packaging": "Handle gently to preserve the premium feel. Store in a dry environment to prevent any moisture damage to the boxes or wrapping materials.",
  "Bouquet": "Keep in a cool spot away from direct heat or AC vents. For preserved bouquets, avoid all moisture. Handle with care as these are delicate handmade items.",
  "Chocolate Tower": "Store in a cool, dry place (ideally 15-20°C). Keep away from direct sunlight and strong odors. Handle with care to maintain the tower structure during display.",
  "Jhumka Box": "Protect the box from moisture and dust. Handle the contents carefully. The box can be cleaned with a dry, soft fiber cloth to maintain its look.",
  "Men's Hamper": "Follow individual care labels for any clothing or accessories included. Store the hamper in a cool, dry place and handle the box gently."
};

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
  
  // New states for media and customization
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [customRequest, setCustomRequest] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [customPhotos, setCustomPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Image preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [api, setApi] = useState(null);

  // Dynamic shipping config
  const [shippingLabel, setShippingLabel] = useState("");
  useEffect(() => {
    fetchApi("/api/admin/branding/shipping/public")
      .then((data) => {
        setShippingLabel(data.enabled && data.cost > 0 ? `₹${data.cost} flat rate` : "Free shipping");
      })
      .catch(() => setShippingLabel(""));
  }, []);

  // Sync currentMediaIndex when carousel api changes
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentMediaIndex(api.selectedScrollSnap());
    });
  }, [api]);

  // Scroll carousel when currentMediaIndex changes externally (from thumbnails)
  useEffect(() => {
    if (api) {
      api.scrollTo(currentMediaIndex);
    }
  }, [currentMediaIndex, api]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Fetch the specific product
        const productData = await fetchApi(`/api/products/${id}`);
        
        // Derive image from media or legacy fields
        let imageUrl = productData.image || productData.imageUrl || productData.img;
        if (!imageUrl && Array.isArray(productData.media) && productData.media.length > 0) {
          const firstMedia = productData.media[0];
          imageUrl = typeof firstMedia === 'string' ? firstMedia : firstMedia.url;
        }

        // Check if the product image is a blob URL or invalid string
        const processedImageUrl = imageUrl && (imageUrl.startsWith('blob:') || imageUrl === 'undefined' || imageUrl === '/images/placeholder.jpg')
          ? '/images/placeholder.svg' 
          : imageUrl;

        const processedProduct = { ...productData, image: processedImageUrl };
          
        setProduct(processedProduct);
        
        // Fetch all products to get related products
        const allProducts = await fetchApi("/api/products");
        const related = allProducts
          .filter((p) => p.category === processedProduct.category && (p.id || p._id) !== (processedProduct.id || processedProduct._id))
          .map(p => {
            let pImg = p.image || p.imageUrl || p.img;
            if (!pImg && Array.isArray(p.media) && p.media.length > 0) {
              const firstM = p.media[0];
              pImg = typeof firstM === 'string' ? firstM : firstM.url;
            }
            if (pImg && (pImg.startsWith('blob:') || pImg === 'undefined' || pImg === '/images/placeholder.jpg')) {
              pImg = '/images/placeholder.svg';
            }
            return { ...p, image: pImg };
          })
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

  const isSoldOut = (product.quantity !== undefined && Number(product.quantity) <= 0);

  const handleCustomPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("media", file));

      const response = await fetchApi("/api/products/upload-media", {
        method: "POST",
        body: formData,
      });

      if (response && response.media) {
        setCustomPhotos(prev => [...prev, ...response.media.map(m => m.url)]);
        toast({ title: "Photos uploaded", description: `${files.length} photos added successfully.` });
      }
    } catch (error) {
      console.error("Custom photo upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload photos.", variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const getCustomizationData = () => {
    const data = {};
    if (customRequest) data.customRequest = customRequest;
    if (shirtSize) data.shirtSize = shirtSize;
    if (customPhotos.length > 0) data.customPhotos = customPhotos;
    return data;
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const customization = getCustomizationData();
    addToCart({ ...product, ...customization }, quantity);
    setIsAdded(true);
    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    const customization = getCustomizationData();
    addToCart({ ...product, ...customization }, quantity);
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

  const handleImageClick = (imageUrl) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  // Free shipping logic removed

  const productUrl = `/products/${product.id || product._id}`;
  const productImage = product.media?.[0]?.url || product.image;
  const productDescription = (product.description || "").slice(0, 160);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title={`${product.name} — ${product.category} Jewellery`}
        description={`Buy ${product.name} at ₹${Number(product.discountedPrice || product.originalPrice).toFixed(0)}. ${productDescription}`}
        image={productImage}
        url={productUrl}
        type="product"
      />
      <ProductJsonLd product={product} url={productUrl} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: product.category, url: `/products?category=${product.category}` },
          { name: product.name },
        ]}
      />
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
          <div className="relative space-y-4">
            <Card className="overflow-hidden rounded-3xl shadow-2xl group">
              <div className="aspect-square bg-gradient-to-br from-secondary/30 via-secondary/20 to-accent/10 relative">
                {/* Media Display Sliding */}
                <Carousel 
                  setApi={setApi} 
                  className="w-full h-full"
                  opts={{
                    loop: true,
                  }}
                >
                  <CarouselContent className="h-full -ml-0">
                    {Array.isArray(product.media) && product.media.length > 0 ? (
                      product.media.map((item, index) => (
                        <CarouselItem key={index} className="h-full pl-0">
                          <div className="h-full flex items-center justify-center cursor-pointer">
                            {item.type === "video" ? (
                              <video
                                src={item.url}
                                controls
                                autoPlay
                                muted
                                loop
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={`${product.name} - ${product.category} Image ${index + 1} | SAAJJEWELS`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onClick={() => handleImageClick(item.url)}
                                onError={(e) => {
                                  e.target.src = "https://placehold.co/600x600?text=No+Image";
                                }}
                              />
                            )}
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem className="h-full pl-0">
                        <div className="h-full flex items-center justify-center cursor-pointer">
                          <img
                            src={product.image || "https://placehold.co/600x600?text=No+Image"}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onClick={() => handleImageClick(product.image)}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/600x600?text=No+Image";
                            }}
                          />
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  
                  {Array.isArray(product.media) && product.media.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 bg-white/50 hover:bg-white/80 border-none shadow-md hidden sm:flex" />
                      <CarouselNext className="right-2 bg-white/50 hover:bg-white/80 border-none shadow-md hidden sm:flex" />
                    </>
                  )}
                </Carousel>
                
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                    <Badge variant="destructive" className="text-xl px-4 py-2 uppercase tracking-widest font-bold">Sold Out</Badge>
                  </div>
                )}
                
                {/* Click to preview hint */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Click to preview
                </div>
              </div>
            </Card>

            {/* Media Thumbnails */}
            {Array.isArray(product.media) && product.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.media.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentMediaIndex(i)}
                    className={`w-20 h-20 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      currentMediaIndex === i ? "border-accent scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {m.type === "video" ? (
                      <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-white">VIDEO</div>
                    ) : (
                      <img src={m.url} alt={`${product.name} thumbnail ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
                {product.media && product.media.length > 0 && product.media[0].type === "video" && (
                   <Badge variant="secondary" className="mb-2">Includes Video</Badge>
                )}
                <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-2">
                  {product.name}
                  {isSoldOut && <Badge variant="destructive" className="ml-3 animate-pulse">Sold Out</Badge>}
                  {!isSoldOut && Number(product.quantity) <= 5 && <Badge variant="warning" className="ml-3">Only {product.quantity} left!</Badge>}
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
              {/* Free shipping progress bar removed */}
             
            </div>

            <Separator />

            {/* Customization Fields */}
            {(product.category === "Hamper" || product.category === "Bouquet" || product.category === "Men's Hamper" || product.category === "Chocolate Tower" || product.category === "Jhumka Box") && (
              <div className="space-y-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <h3 className="font-semibold text-lg font-playfair flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  Customization Options
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block">
                    Customization Request (e.g. Message, Personalization)
                  </label>
                  <Textarea
                    placeholder="Enter your special instructions here..."
                    className="bg-background"
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                  />
                </div>

                {product.category === "Men's Hamper" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">
                      Men's Shirt Size (if applicable)
                    </label>
                    <Select value={shirtSize} onValueChange={setShirtSize}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">Small (S)</SelectItem>
                        <SelectItem value="M">Medium (M)</SelectItem>
                        <SelectItem value="L">Large (L)</SelectItem>
                        <SelectItem value="XL">Extra Large (XL)</SelectItem>
                        <SelectItem value="XXL">XXL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">
                    Upload Sample/Reference Photos
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="file"
                        id="custom-photo-upload"
                        multiple
                        accept="image/*"
                        onChange={handleCustomPhotoUpload}
                        disabled={uploadingPhotos}
                        className="hidden"
                      />
                      <Label
                        htmlFor="custom-photo-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                          uploadingPhotos 
                          ? "bg-secondary/20 border-accent/20 cursor-not-allowed" 
                          : "bg-background border-accent/20 hover:border-accent hover:bg-accent/5"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingPhotos ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-accent mb-2" />
                              <p className="text-sm font-medium text-foreground">Click to upload photos</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WebP (Max 10 images)</p>
                            </>
                          )}
                        </div>
                      </Label>
                    </div>

                    {customPhotos.length > 0 && (
                      <div className="grid grid-cols-5 gap-3">
                        {customPhotos.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-xl overflow-hidden shadow-md ring-1 ring-accent/10">
                            <img src={url} className="w-full h-full object-cover" alt="Customization" />
                            <button 
                              onClick={() => setCustomPhotos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              <CloseIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic bg-accent/5 p-2 rounded-lg border border-accent/10">
                    <span className="font-bold">Pro Tip:</span> For the most intricate designs, after placing your order, share high-resolution photos via <a href="https://wa.me/9921810182" className="text-accent underline font-semibold">WhatsApp</a> with your Order ID.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isSoldOut}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(Number(product.quantity) || 10, quantity + 1))}
                    disabled={isSoldOut}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdded || isSoldOut}
                  className={`flex-1 h-14 text-lg animate-shake hover:animate-shake ${
                    isAdded ? "bg-green-600 hover:bg-green-700" : ""
                  } ${isSoldOut ? "bg-muted cursor-not-allowed opacity-50" : ""}`}
                >
                  {isSoldOut ? (
                    "Out of Stock"
                  ) : isAdded ? (
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
                disabled={isSoldOut}
                className={`w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold ${isSoldOut ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSoldOut ? "Sold Out" : "Buy It Now"}
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
                { icon: Truck, title: "Shipping", desc: shippingLabel },
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
                   categoryCareInstructions[product.category] ||
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
                      `Standard shipping — ${shippingLabel}.`}
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
                {relatedProducts.map((item, idx) => (
                  <Card
                    key={item.id || item._id || idx}
                    className="group overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all cursor-pointer flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] snap-start"
                    onClick={() => navigate(`/products/${item.id || item._id}`)}
                  >
                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={`${item.name} - ${item.category || "Jewellery"} by SAAJJEWELS`}
                        loading="lazy"
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
      
      {/* Image Preview Modal */}
      <ImagePreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={previewImageUrl}
        altText={product.name}
      />
    </div>
  );
};

export default ProductDetail;