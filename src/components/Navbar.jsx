import { Link } from "react-router-dom";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, Settings, HelpCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const AccountNav = () => {
  const accountItems = [
    { path: "/account", label: "My Account", icon: User },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <User className="h-5 w-5" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[200px] p-2">
              {accountItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

const Navbar = () => {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="font-playfair font-bold text-xl">
            SAAJJEWELS®
          </Link>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className="font-medium">
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[200px] p-2">
                    <Link to="/products" className="block px-3 py-2 hover:bg-accent rounded-md">
                      All Products
                    </Link>
                    <Link to="/products/new" className="block px-3 py-2 hover:bg-accent rounded-md">
                      New Arrivals
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/contact-us" className="font-medium">
                  Contact
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <AccountNav />
          <Button variant="outline" size="icon" asChild>
            <Link to="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;