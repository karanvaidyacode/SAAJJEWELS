import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";
import { useAuth } from "../contexts/AuthContext";
import { SEO } from "@/components/SEO";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50">
      <SEO title="Login" description="Sign in to your SAAJJEWELS account to manage orders, cart, and addresses." url="/login" noindex />
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 mx-4">
        <div className="text-center mb-8">
          <img
            src="/icon.png"
            alt="SaajJewels"
            className="w-28 h-28 rounded-full object-cover mx-auto mb-4 ring-4 ring-pink-100 border-collapse shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-primary via-rose-600 to-primary bg-clip-text text-transparent mb-2">
            Welcome
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your SAAJJEWELS account
          </p>
        </div>

        <Show when="signed-out">
          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full bg-gradient-to-r from-rose-600 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="w-full bg-white/60 border border-gray-200 rounded-lg py-3 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md">
                Create Account
              </button>
            </SignUpButton>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center">
              <UserButton
                afterSignOutUrl="/login"
                appearance={{
                  elements: {
                    avatarBox: "w-16 h-16",
                  },
                }}
              />
            </div>
            <h3 className="text-lg font-semibold">You're signed in!</h3>
            <p className="text-sm text-gray-500 mt-2">
              You can now access your account.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-rose-600 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Continue Shopping
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Login;
