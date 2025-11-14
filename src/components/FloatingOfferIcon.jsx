import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOffer } from "@/contexts/OfferContext";
import { Gift, X } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function FloatingOfferIcon() {
  const { isAuthenticated } = useAuth();
  const { hasClaimedOffer, setOfferClaimed, remainingOffers, updateRemainingOffers, markOfferAsClaimed } = useOffer();
  const [showIcon, setShowIcon] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [coupon, setCoupon] = useState("SAAJ10");

  useEffect(() => {
    // Show icon if user hasn't claimed offer, isn't authenticated, has declined the modal, and hasn't permanently dismissed
    const hasDeclined = localStorage.getItem("saaj_jewels_offer_declined");
    const permanentlyDismissed = localStorage.getItem("saaj_jewels_offer_permanently_dismissed");
    
    if (!isAuthenticated && !hasClaimedOffer && hasDeclined === "true" && permanentlyDismissed !== "true") {
      // Show icon after a delay
      const timer = setTimeout(() => {
        setShowIcon(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowIcon(false);
    }
  }, [isAuthenticated, hasClaimedOffer]);

  const handleClaim = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your Gmail address.");
      return;
    }
    const lower = email.trim().toLowerCase();
    if (!lower.endsWith("@gmail.com")) {
      setError("Please provide a Gmail address (example@gmail.com).");
      return;
    }

    try {
      const response = await fetchApi("/offers/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: lower }),
      });
      
      const couponCode = response?.couponCode || "SAAJ10";
      setCoupon(couponCode);
      
      // Mark as claimed (subscribe endpoint already decremented the count on backend)
      // Update remaining offers from response if available
      if (response?.remainingOffers !== undefined) {
        updateRemainingOffers(response.remainingOffers);
      }
      
      // Mark offer as claimed (backend already decremented, so we just mark locally)
      markOfferAsClaimed(couponCode);
      
      setClaimed(true);
      setShowIcon(false);
      localStorage.removeItem("saaj_jewels_offer_declined");
    } catch (err) {
      if (err.message.includes("404")) {
        console.warn("Offers API not available, using client-side fallback");
        setCoupon("SAAJ10");
        await setOfferClaimed("SAAJ10");
        setClaimed(true);
        setShowIcon(false);
        localStorage.removeItem("saaj_jewels_offer_declined");
      } else {
        setError(err.message || "Failed to record your email. Please try again later.");
      }
    }
  };

  // Don't show if user has claimed offer or is authenticated
  if (isAuthenticated || hasClaimedOffer || !showIcon) {
    return null;
  }

  return (
    <>
      {/* Floating Icon */}
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={() => setShowModal(true)}
          className="group relative bg-gradient-to-r from-[#c6a856] to-[#f4e4bc] rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
          aria-label="Get 10% OFF"
        >
          <Gift className="w-6 h-6 text-[#062132] group-hover:animate-pulse" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-[#071226] text-[#e6e1d9] px-4 py-2 rounded-lg shadow-xl text-sm font-medium">
              <div className="text-center">
                <div className="font-bold text-[#c6a856]">Get 10% OFF</div>
                {remainingOffers > 0 && (
                  <div className="text-xs text-[#cbd5e1] mt-1">
                    {remainingOffers} customers left!
                  </div>
                )}
              </div>
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#071226]"></div>
            </div>
          </div>
          
          {/* Pulse animation ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#c6a856] to-[#f4e4bc] animate-ping opacity-20"></div>
        </button>
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowIcon(false);
            localStorage.setItem("saaj_jewels_offer_permanently_dismissed", "true");
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div 
            className="bg-[#071226] rounded-xl p-6 text-[#e6e1d9] shadow-[0_20px_60px_rgba(2,6,23,0.6)] max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="mb-3">
                <Gift className="h-12 w-12 text-[#c6a856] mx-auto drop-shadow-[0_6px_20px_rgba(198,168,86,0.25)]" />
              </div>
              <h3 className="text-xl font-playfair font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c6a856] via-[#f4e4bc] to-[#c6a856]">
                Claim 10% OFF
              </h3>
              <p className="text-xs text-[#cbd5e1] mt-2">
                Enter your Gmail to receive the coupon code
              </p>
              
              {/* Offer Info - Remaining Customers */}
              {remainingOffers > 0 && (
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-[#c6a856]/20 to-[#f4e4bc]/20 rounded-lg border border-[#c6a856]/30">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c6a856] animate-pulse"></div>
                    <span className="text-xs font-medium text-[#f4e4bc]">
                      Limited Time Offer - Only {remainingOffers} {remainingOffers === 1 ? 'customer' : 'customers'} left!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!claimed ? (
              <form onSubmit={handleClaim} className="space-y-3">
                <input
                  className="w-full bg-[rgba(11,20,32,0.6)] border border-[#c6a856]/30 text-[#e6e1d9] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a856]/30 placeholder:text-[#cbd5e1]"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <div className="text-xs text-red-300">{error}</div>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#c6a856] to-[#f4e4bc] text-[#062132] py-2 rounded-lg text-sm font-medium hover:from-[#d4b56e] hover:to-[#f8ecd0] transition-all duration-200"
                  >
                    Get Coupon
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 bg-transparent text-[#c6a856] rounded-lg text-sm font-medium border border-[#c6a856]/30 hover:bg-[#0b1420]/40 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-xs text-[#cbd5e1]">Your coupon code</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="px-3 py-1 rounded-md bg-[#062132] border border-[#c6a856]/20 text-[#f4e4bc] font-medium tracking-wider">
                    {coupon}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowIcon(false);
                    localStorage.removeItem("saaj_jewels_offer_declined");
                  }}
                  className="px-4 py-2 bg-transparent text-[#c6a856] rounded-lg text-sm font-medium border border-[#c6a856]/30 hover:bg-[#0b1420]/40 transition"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

