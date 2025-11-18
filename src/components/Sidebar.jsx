import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  X,
  User,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Home,
  ShoppingBag,
  Star,
  ChevronDown,
  ChevronUp,
  Diamond,
  Gem,
  CircleDot,
  Crown,
  Package,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, ShoppingCart, LogOut } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };
  // Collection categories with icons
  const collections = [
    { name: "Necklace", icon: Diamond },
    { name: "Bracelet", icon: CircleDot },
    { name: "Earrings", icon: Gem },
    { name: "Rings", icon: Crown },
    { name: "Pendants", icon: Star },
    { name: "Scrunchies", icon: Sparkles },
    { name: "Claws", icon: Diamond },
    { name: "Hairbows", icon: Sparkles },
    { name: "Hairclips", icon: Star },
    { name: "Studs", icon: Gem },
    { name: "Jhumka", icon: CircleDot },
    { name: "Hamper", icon: Package },
    { name: "Custom Packaging", icon: Package },
    { name: "Bouquet", icon: Package },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${categoryName}`);
    onClose();
  };

  const socialLinks = [
    { name: "Instagram", icon: Instagram, url: "https://www.instagram.com/saaj__jewels?igsh=MWUxb3F2YzVxN3M2dA==" },
  ];

  return (
    <>
      {/* Overlay with blur effect - Mobile Only */}
      {isOpen && (
        <div
          className="md:hidden fixed top-[73px] left-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Mobile Only, Below Navbar */}
      <aside
        className={`
        md:hidden fixed top-[73px] left-0 h-[calc(100vh-73px)] w-full bg-background shadow-2xl z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Main Navigation */}
          <nav className="flex-1 px-6 pt-20 pb-6">
            {user && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-pink-500">
                      {(user?.name || user?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-medium">{user?.name || user?.email}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Separator className="mb-4" />
              </div>
            )}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Menu
            </h3>
            <div className="space-y-1">
              {/* Home */}
              <button
                onClick={() => handleNavigation("/")}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all duration-200 group"
              >
                <Home className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="group-hover:text-accent transition-colors">
                  Home
                </span>
              </button>

              {/* Collections with Submenu */}
              <div>
                <button
                  onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    <span className="group-hover:text-accent transition-colors">
                      Collections
                    </span>
                  </div>
                  {isCollectionsOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Collections Submenu */}
                {isCollectionsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-secondary pl-2">
                    {collections.map((collection) => {
                      const Icon = collection.icon;
                      return (
                        <button
                          key={collection.name}
                          onClick={() => handleCategoryClick(collection.name)}
                          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-accent hover:bg-secondary/30 transition-all duration-200"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{collection.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Products */}
              <button
                onClick={() => handleNavigation("/products")}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all duration-200 group"
              >
                <Diamond className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="group-hover:text-accent transition-colors">
                  All Products
                </span>
              </button>

              {/* Contact Us */}
              <button
                onClick={() => handleNavigation("/contact-us")}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all duration-200 group"
              >
                <Mail className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="group-hover:text-accent transition-colors">
                  Contact Us
                </span>
              </button>
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              {user ? (
                <>
                  
                  
                  <button
                    onClick={() => handleNavigation("/cart")}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all duration-200 group"
                  >
                    <ShoppingCart className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    <span className="group-hover:text-accent transition-colors">
                      Cart
                    </span>
                  </button>

                  <Button
                    variant="destructive"
                    className="w-full justify-center gap-3 h-12"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm">Log out</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-center gap-3 h-12 bg-accent hover:bg-accent/90 text-white font-semibold"
                  onClick={() => handleNavigation("/login")}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">Log in</span>
                </Button>
              )}
            </div>
          </nav>

          {/* Footer - Social Media Icons */}
          <div className="px-6 py-6 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Follow Us
            </h3>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-secondary/50 hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-200 group"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Copyright */}
            <div className="mt-6 text-xs text-muted-foreground text-center space-y-1">
              <p>© 2025 SAAJJEWELS®</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
