import { createContext, useContext, useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";

// Offer context
const OfferContext = createContext();

const OFFER_STORAGE_KEY = "saaj_jewels_claimed_offer";
const REMAINING_OFFERS_KEY = "saaj_jewels_remaining_offers";

// Offer provider component
export const OfferProvider = ({ children }) => {
  // Initialize remaining offers from localStorage or default to 30
  const [remainingOffers, setRemainingOffers] = useState(() => {
    const stored = localStorage.getItem(REMAINING_OFFERS_KEY);
    return stored ? parseInt(stored, 10) : 30;
  });

  // Track if current user has claimed an offer
  const [hasClaimedOffer, setHasClaimedOffer] = useState(() => {
    const stored = localStorage.getItem(OFFER_STORAGE_KEY);
    return stored === "true";
  });

  const pollingIntervalRef = useRef(null);

  // Fetch remaining offers from backend on mount and set up polling
  useEffect(() => {
    const fetchRemainingOffers = async () => {
      try {
        const data = await fetchApi("/offers/remaining");
        if (data && data.remainingOffers !== undefined) {
          setRemainingOffers(data.remainingOffers);
          localStorage.setItem(REMAINING_OFFERS_KEY, data.remainingOffers.toString());
        }
      } catch (err) {
        // If backend is not available, use localStorage fallback
        console.warn("Could not fetch remaining offers from backend, using localStorage");
        const stored = localStorage.getItem(REMAINING_OFFERS_KEY);
        if (stored) {
          setRemainingOffers(parseInt(stored, 10));
        }
      }
    };

    // Initial fetch
    fetchRemainingOffers();

    // Check if user has claimed offer
    const claimed = localStorage.getItem(OFFER_STORAGE_KEY);
    setHasClaimedOffer(claimed === "true");

    // Set up polling to sync with backend every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchRemainingOffers();
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Function to claim an offer (decrease the count and mark as claimed)
  const claimOffer = async () => {
    if (remainingOffers > 0 && !hasClaimedOffer) {
      try {
        // Sync with backend first
        const response = await fetchApi("/offers/claim", {
          method: "POST",
        });
        
        if (response && response.success) {
          // Update from backend response
          setRemainingOffers(response.remainingOffers);
          localStorage.setItem(REMAINING_OFFERS_KEY, response.remainingOffers.toString());
        } else {
          // Fallback to local update if backend fails
          const newRemaining = remainingOffers - 1;
          setRemainingOffers(newRemaining);
          localStorage.setItem(REMAINING_OFFERS_KEY, newRemaining.toString());
        }
      } catch (err) {
        // If backend is not available, use local update
        console.warn("Could not sync with backend, using local update");
        const newRemaining = remainingOffers - 1;
        setRemainingOffers(newRemaining);
        localStorage.setItem(REMAINING_OFFERS_KEY, newRemaining.toString());
      }
      
      setHasClaimedOffer(true);
      localStorage.setItem(OFFER_STORAGE_KEY, "true");
      
      return true; // Offer successfully claimed
    }
    return false; // No offers left or already claimed
  };

  // Function to set offer as claimed (used when user logs in or claims via modal)
  const setOfferClaimed = async (couponCode = null) => {
    if (!hasClaimedOffer) {
      try {
        // Sync with backend first
        if (remainingOffers > 0) {
          const response = await fetchApi("/offers/claim", {
            method: "POST",
          });
          
          if (response && response.success) {
            // Update from backend response
            setRemainingOffers(response.remainingOffers);
            localStorage.setItem(REMAINING_OFFERS_KEY, response.remainingOffers.toString());
          } else {
            // Fallback to local update if backend fails
            const newRemaining = remainingOffers - 1;
            setRemainingOffers(newRemaining);
            localStorage.setItem(REMAINING_OFFERS_KEY, newRemaining.toString());
          }
        }
      } catch (err) {
        // If backend is not available, use local update
        console.warn("Could not sync with backend, using local update");
        if (remainingOffers > 0) {
          const newRemaining = remainingOffers - 1;
          setRemainingOffers(newRemaining);
          localStorage.setItem(REMAINING_OFFERS_KEY, newRemaining.toString());
        }
      }
      
      setHasClaimedOffer(true);
      localStorage.setItem(OFFER_STORAGE_KEY, "true");
      if (couponCode) {
        localStorage.setItem("saaj_jewels_coupon_code", couponCode);
      }
      return true;
    }
    return false;
  };

  // Function to check if user has claimed offer (without claiming)
  const checkClaimedOffer = () => {
    return hasClaimedOffer || localStorage.getItem(OFFER_STORAGE_KEY) === "true";
  };

  // Function to reset offers (for testing/admin purposes)
  const resetOffers = () => {
    setRemainingOffers(30);
    setHasClaimedOffer(false);
    localStorage.removeItem(OFFER_STORAGE_KEY);
    localStorage.setItem(REMAINING_OFFERS_KEY, "30");
  };

  // Helper function to update remaining offers (used when backend already decremented)
  const updateRemainingOffers = (count) => {
    setRemainingOffers(count);
    localStorage.setItem(REMAINING_OFFERS_KEY, count.toString());
  };

  // Helper function to mark offer as claimed without decrementing (used when backend already decremented)
  const markOfferAsClaimed = (couponCode = null) => {
    setHasClaimedOffer(true);
    localStorage.setItem(OFFER_STORAGE_KEY, "true");
    if (couponCode) {
      localStorage.setItem("saaj_jewels_coupon_code", couponCode);
    }
  };

  const value = {
    remainingOffers,
    hasClaimedOffer,
    claimOffer,
    setOfferClaimed,
    checkClaimedOffer,
    resetOffers,
    updateRemainingOffers,
    markOfferAsClaimed
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
};

// Custom hook to use offer context
export const useOffer = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffer must be used within an OfferProvider');
  }
  return context;
};