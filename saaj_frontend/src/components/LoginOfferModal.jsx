import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOffer } from "@/contexts/OfferContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function LoginOfferModal() {
  const { isAuthenticated, user } = useAuth();
  const { hasClaimedOffer, markOfferAsClaimed, updateRemainingOffers, remainingOffers, setOfferClaimed } = useOffer();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic popup config fetched from backend
  const [popupConfig, setPopupConfig] = useState(null);

  // Fetch the active popup configuration from backend
  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const data = await fetchApi("/api/popups/active");
        if (data && data.id) {
          setPopupConfig(data);
        }
      } catch {
        // No active popup or backend unavailable — fall back to legacy behavior
        setPopupConfig({
          title: "Claim 10% OFF",
          description: "Enter your Gmail to receive the coupon code for your order",
          couponCode: "SAAJ10",
          couponDiscountType: "percentage",
          couponDiscountValue: 10,
          delaySeconds: 5,
        });
      }
    };
    fetchPopup();
  }, []);

  // Show after configured delay if conditions are met
  useEffect(() => {
    if (!popupConfig) return;
    if (!isAuthenticated && !hasClaimedOffer && remainingOffers > 0) {
      const delay = (popupConfig.delaySeconds ?? 5) * 1000;
      const t = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(t);
    } else if (hasClaimedOffer || remainingOffers <= 0) {
      setOpen(false);
    }
  }, [isAuthenticated, hasClaimedOffer, remainingOffers, popupConfig]);

  // Auto-claim when user is authenticated
  useEffect(() => {
    const autoClaim = async () => {
      if (isAuthenticated && user?.email && !hasClaimedOffer && remainingOffers > 0) {
        const code = popupConfig?.couponCode || "SAAJ10";
        await setOfferClaimed(code, user.email);
        setOpen(false);
      }
    };
    autoClaim();
  }, [isAuthenticated, user, hasClaimedOffer, remainingOffers, setOfferClaimed, popupConfig]);

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
      const response = await fetchApi("/offers/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: lower }),
      });

      const couponCode = popupConfig?.couponCode || response?.couponCode || "SAAJ10";
      setCoupon(couponCode);

      if (response?.remainingOffers !== undefined) {
        updateRemainingOffers(response.remainingOffers);
      }
      markOfferAsClaimed(couponCode);
      setClaimed(true);
    } catch (err) {
      if (err.message.includes("404")) {
        const code = popupConfig?.couponCode || "SAAJ10";
        setCoupon(code);
        await setOfferClaimed(code);
        setClaimed(true);
      } else if (err.message.includes("already claimed")) {
        setError("This email has already claimed the offer.");
      } else {
        setError(err.message || "Failed to record your email. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyCoupon = async () => {
    try { await navigator.clipboard.writeText(coupon); } catch {}
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen && !claimed && !hasClaimedOffer) {
      localStorage.setItem("saaj_jewels_offer_declined", "true");
    }
  };

  const title = popupConfig?.title || "Claim 10% OFF";
  const description = popupConfig?.description || "Enter your Gmail to receive the coupon code for your order";
  const discountLabel = popupConfig?.couponDiscountType === "fixed"
    ? `₹${popupConfig.couponDiscountValue} off`
    : `${popupConfig?.couponDiscountValue || 10}% off`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 bg-transparent">
        <div className="bg-[#071226] rounded-xl p-6 text-[#e6e1d9] shadow-[0_20px_60px_rgba(2,6,23,0.6)]">
          <div className="text-center mb-6">
            <div className="mb-3">
              <Gift className="h-16 w-16 text-[#c6a856] mx-auto drop-shadow-[0_6px_20px_rgba(198,168,86,0.25)]" />
            </div>
            <DialogTitle className="text-2xl font-playfair font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c6a856] via-[#f4e4bc] to-[#c6a856]">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#cbd5e1]">
              {description}
            </DialogDescription>

            {remainingOffers > 0 && (
              <div className="mt-4 px-4 py-2 bg-gradient-to-r from-[#c6a856]/20 to-[#f4e4bc]/20 rounded-lg border border-[#c6a856]/30">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c6a856] animate-pulse"></div>
                  <span className="text-xs font-medium text-[#f4e4bc]">
                    Limited Time Offer - Only {remainingOffers} {remainingOffers === 1 ? "customer" : "customers"} left!
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
                Apply this code at checkout to get {discountLabel} your order.
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