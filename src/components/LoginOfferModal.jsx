import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOffer } from "@/contexts/OfferContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function LoginOfferModal() {
  const { isAuthenticated } = useAuth();
  const { setOfferClaimed, hasClaimedOffer, remainingOffers, updateRemainingOffers, markOfferAsClaimed } = useOffer();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [coupon, setCoupon] = useState("SAAJ10");
  const [isLoading, setIsLoading] = useState(false);

  // show after 5s if not authenticated and hasn't claimed offer
  useEffect(() => {
    if (!isAuthenticated && !hasClaimedOffer) {
      const t = setTimeout(() => setOpen(true), 5000);
      return () => clearTimeout(t);
    } else if (hasClaimedOffer) {
      setOpen(false);
    }
  }, [isAuthenticated, hasClaimedOffer]);

  // Auto-claim offer when user becomes authenticated
  useEffect(() => {
    const autoClaim = async () => {
      if (isAuthenticated && !hasClaimedOffer) {
        await setOfferClaimed("SAAJ10");
        setOpen(false);
      }
    };
    autoClaim();
  }, [isAuthenticated, hasClaimedOffer, setOfferClaimed]);

  // Check if email has already claimed offer
  const checkEmailClaimed = async (emailToCheck) => {
    try {
      const response = await fetchApi(`/offers/check?email=${encodeURIComponent(emailToCheck)}`);
      return response?.claimed || false;
    } catch (err) {
      console.warn("Could not check email claim status:", err);
      return false;
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your Gmail address.");
      setIsLoading(false);
      return;
    }
    
    const lower = email.trim().toLowerCase();
    if (!lower.endsWith("@gmail.com")) {
      setError("Please provide a Gmail address (example@gmail.com).");
      setIsLoading(false);
      return;
    }

    try {
      // Check if email has already claimed the offer
      const alreadyClaimed = await checkEmailClaimed(lower);
      if (alreadyClaimed) {
        setError("This email has already claimed the offer.");
        setIsLoading(false);
        return;
      }

      // send to backend to record subscription/claim
      const response = await fetchApi("/offers/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: lower }),
      });
      
      // Get coupon code from response or use default
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
    } catch (err) {
      // If we get a 404, the endpoint doesn't exist yet
      if (err.message.includes("404")) {
        // Fallback to client-side only mode
        console.warn("Offers API not available, using client-side fallback");
        setCoupon("SAAJ10");
        await setOfferClaimed("SAAJ10");
        setClaimed(true);
      } else if (err.message.includes("already claimed")) {
        setError("This email has already claimed the offer.");
      } else {
        setError(
          err.message || "Failed to record your email. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(coupon);
    } catch (err) {
      // ignore clipboard errors
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    // If user closes the modal (via X button or clicking outside) without claiming
    if (!isOpen && !claimed && !hasClaimedOffer) {
      // Mark as declined so floating icon can show
      localStorage.setItem("saaj_jewels_offer_declined", "true");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 bg-transparent">
        <div className="bg-[#071226] rounded-xl p-6 text-[#e6e1d9] shadow-[0_20px_60px_rgba(2,6,23,0.6)]">
          <div className="text-center mb-6">
            <div className="mb-3">
              <Gift className="h-16 w-16 text-[#c6a856] mx-auto drop-shadow-[0_6px_20px_rgba(198,168,86,0.25)]" />
            </div>
            <h3 className="text-2xl font-playfair font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c6a856] via-[#f4e4bc] to-[#c6a856]">
              Claim 10% OFF
            </h3>
            <p className="text-sm text-[#cbd5e1]">
              Enter your Gmail to receive the coupon code for your order
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

          {!claimed && (
            <form onSubmit={handleClaim} className="space-y-4">
              <input
                className="w-full bg-[rgba(11,20,32,0.6)] border border-[#c6a856]/30 text-[#e6e1d9] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c6a856]/30 placeholder:text-[#cbd5e1]"
                type="email"
                placeholder="yourname@gmail.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {error && <div className="text-sm text-red-300">{error}</div>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#c6a856] to-[#f4e4bc] text-[#062132] py-3 rounded-lg font-medium hover:from-[#d4b56e] hover:to-[#f8ecd0] transition-all duration-200 shadow-[0_10px_30px_rgba(2,6,23,0.45)] disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Get Coupon"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 bg-transparent text-[#c6a856] py-3 rounded-lg font-medium border border-[#c6a856]/30 hover:bg-[#0b1420]/40 transition-all duration-200"
                  disabled={isLoading}
                >
                  No Thanks
                </button>
              </div>
            </form>
          )}

          {claimed && (
            <div className="text-center space-y-4">
              <div className="text-sm text-[#cbd5e1]">Your coupon code</div>
              <div className="flex items-center justify-center gap-3">
                <div className="px-4 py-2 rounded-md bg-[#062132] border border-[#c6a856]/20 text-[#f4e4bc] font-medium tracking-wider text-lg">
                  {coupon}
                </div>
                <button
                  onClick={copyCoupon}
                  className="px-3 py-2 bg-[#c6a856] text-[#062132] rounded-md font-medium hover:brightness-95 transition"
                >
                  Copy
                </button>
              </div>
              <div className="text-sm text-[#cbd5e1]">
                Apply this code at checkout to get 10% off your order.
              </div>
              <div className="pt-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-6 py-2 bg-transparent text-[#c6a856] rounded-lg font-medium border border-[#c6a856]/30 hover:bg-[#0b1420]/40 transition"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}