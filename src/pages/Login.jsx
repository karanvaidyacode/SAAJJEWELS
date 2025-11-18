import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useOffer } from "../contexts/OfferContext";
import { fetchApi } from "../lib/api";

// Use the IP address instead of localhost to avoid hosts file issues
const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { setOfferClaimed } = useOffer();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // email, otp, done
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await fetchApi("/auth/send-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      setSuccess("OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      console.error("OTP send error:", err);
      setError(err.message || "Network error");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await fetchApi("/auth/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      
      setSuccess("Login successful!");
      setStep("done");

      // Use the standardized user data format
      login({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        token: data.token,
        profilePicture: data.user.profilePicture,
      });

      // Auto-claim offer for logged-in users if not already claimed
      await setOfferClaimed("SAAJ10");

      // Short delay to show success message before redirect
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.message || "Invalid OTP");
    }
  };

  // Google OAuth removed — only OTP/email login remains

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 mx-4">
        <div className="text-center mb-8">
          <img
            src="/src/assets/logo.jpg"
            alt="SaajJewels"
            className="w-28 h-28 rounded-full object-cover mx-auto mb-4 ring-4 ring-pink-100 border-collapse shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-primary via-rose-600 to-primary bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your SAAJJEWELS account
          </p>
        </div>

        {success && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Google sign-in removed */}

        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              className="w-full bg-white/50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-200 placeholder:text-gray-400"
              type="email"
              placeholder="Enter your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-600 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Send OTP
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              className="w-full bg-white/50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-200 placeholder:text-gray-400"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              required
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Verify & Login
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="flex-1 bg-white/60 border border-gray-200 rounded-lg py-3 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <h3 className="text-lg font-semibold">Logged in</h3>
            <p className="text-sm text-gray-500 mt-2">
              You can now access your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

