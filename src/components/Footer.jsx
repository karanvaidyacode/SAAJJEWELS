import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-primary to-primary/95 text-primary-foreground py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-3xl font-playfair font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-primary-foreground/90">
              SAAJJEWELS®
            </h3>
            <p className="font-inter text-base text-primary-foreground/90 leading-relaxed">
              Discover timeless elegance and modern design in our exquisite
              jewellery collection.
            </p>
            <div className="flex gap-4">
              
              <a
                href="https://www.instagram.com/saaj__jewels?igsh=MWUxb3F2YzVxN3M2dA=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 md:mt-0">
            <h4 className="text-xl font-playfair font-bold mb-6 text-primary-foreground/95">
              Explore
            </h4>
            <ul className="space-y-4 font-inter text-base">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/#just-drops"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Just Drops
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-us"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="mt-4 md:mt-0">
            <h4 className="text-xl font-playfair font-bold mb-6 text-primary-foreground/95">
              Customer Care
            </h4>
            <ul className="space-y-4 font-inter text-base">
              <li>
                <Link
                  to="/shipping-policy"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/return-policy"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Return Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  className="hover:text-primary-foreground/75 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"></span>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="text-center font-inter text-sm text-primary-foreground/80">
            © 2025 SAAJJEWELS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;