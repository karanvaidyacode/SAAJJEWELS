import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  Diamond,
  Gem,
  CircleDot,
  Crown,
  Star,
  Package,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

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
  ];

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${categoryName}`);
    setIsCollectionsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-primary/10"
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>

          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-bold font-playfair tracking-tight text-primary hover:text-primary/90 transition-colors"
          >
            SAAJJEWELS®
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              to="/"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {/* Collections Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <button className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 group">
                <span>Collections</span>
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>

              {isCollectionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border rounded-md shadow-lg py-2 z-50">
                  <div className="grid grid-cols-1 gap-1 px-2">
                    {collections.map((collection) => {
                      const Icon = collection.icon;
                      return (
                        <button
                          key={collection.name}
                          onClick={() => {
                            handleCategoryClick(collection.name);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-accent hover:bg-secondary/30 transition-all duration-200 text-left rounded-md"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{collection.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/products"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              All Products
            </Link>

            <Link
              to="/contact-us"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="hidden md:block relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                    aria-label={user?.name || user?.email}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-pink-500">
                        {(user?.name || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    {/* Hide the visible name; keep it for screen readers only */}
                    <span className="sr-only">{user?.name || user?.email}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-2 z-50"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="border-t mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            navigate("/");
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-primary"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="text-muted-foreground hover:text-primary relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 justify-center text-xs">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
