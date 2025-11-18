import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
} from "react";
import { computeDiscountedPrice, getDiscountRate } from "@/lib/pricing";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const CartContext = createContext();

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

function computeTotals(items) {
  let totalItems = 0,
    totalPrice = 0;
  items.forEach((item) => {
    totalItems += item.quantity;
    // Use the pricing library functions to get correct prices
    const originalPrice = item.originalPrice || item.price || 0;
    const discountedPrice = item.discountedPrice || originalPrice;
    totalPrice += discountedPrice * item.quantity;
  });
  return { totalItems, totalPrice };
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_CART": {
      const { totalItems, totalPrice } = computeTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        totalItems,
        totalPrice,
      };
    }
    case "RESET_CART": {
      return initialState;
    }
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartState, dispatch] = useReducer(cartReducer, initialState);
  const userEmail = user?.email || null;

  // Load cart from backend on mount/login
  useEffect(() => {
    if (userEmail) {
      fetchApi("/api/cart", { headers: { "x-user-email": userEmail } })
        .then((data) => {
          dispatch({
            type: "SET_CART",
            payload: Array.isArray(data) ? data : [],
          });
        })
        .catch((error) => {
          // Handle specific error cases
          if (error.message.includes("User not found")) {
            console.warn("User not found in database, initializing empty cart");
            dispatch({ type: "RESET_CART" });
          } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            console.warn("Backend not available, using local cart state");
            // Try to load from localStorage as fallback
            const localCart = localStorage.getItem("cart");
            if (localCart) {
              try {
                const parsedCart = JSON.parse(localCart);
                dispatch({ type: "SET_CART", payload: Array.isArray(parsedCart) ? parsedCart : [] });
              } catch (e) {
                dispatch({ type: "RESET_CART" });
              }
            } else {
              dispatch({ type: "RESET_CART" });
            }
          } else {
            console.error("Error loading cart:", error);
            dispatch({ type: "RESET_CART" });
          }
        });
    } else {
      // For non-logged-in users, try to load from localStorage
      const localCart = localStorage.getItem("cart");
      if (localCart) {
        try {
          const parsedCart = JSON.parse(localCart);
          dispatch({ type: "SET_CART", payload: Array.isArray(parsedCart) ? parsedCart : [] });
        } catch (e) {
          dispatch({ type: "RESET_CART" });
        }
      } else {
        dispatch({ type: "RESET_CART" });
      }
    }
  }, [userEmail]);

  // Helper to persist cart to backend
  const updateCartBackend = async (items) => {
    // Also save to localStorage as fallback
    localStorage.setItem("cart", JSON.stringify(items));
    
    if (!userEmail) return;
    try {
      await fetchApi("/api/cart", {
        method: "POST",
        headers: { "x-user-email": userEmail },
        body: JSON.stringify(items),
      });
    } catch (error) {
      if (error.message.includes("User not found")) {
        console.warn("User not found, cart saved locally only");
      } else {
        console.error("Failed to update cart on backend:", error);
      }
      // We'll still update the frontend state even if backend fails
    }
  };

  const addToCart = async (product, quantity = 1) => {
    let items = [...cartState.items];
    // Use _id for database products, fallback to id for static data
    const productId = product._id || product.id;
    const idx = items.findIndex((i) => (i._id || i.id) === productId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
    } else {
      // Ensure product has both id and _id for consistency
      const cartItem = { ...product, quantity };
      if (product._id && !product.id) {
        cartItem.id = product._id;
      } else if (product.id && !product._id) {
        cartItem._id = product.id;
      }
      items.push(cartItem);
    }
    await updateCartBackend(items);
    dispatch({ type: "SET_CART", payload: items });
  };

  const removeFromCart = async (productId) => {
    let items = [...cartState.items];
    // Handle both _id and id
    const idx = items.findIndex((i) => (i._id || i.id) === productId);
    if (idx !== -1) {
      if (items[idx].quantity > 1) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity - 1 };
      } else {
        items = items.filter((i) => (i._id || i.id) !== productId);
      }
      await updateCartBackend(items);
      dispatch({ type: "SET_CART", payload: items });
    }
  };

  const clearCart = async () => {
    if (userEmail) {
      try {
        await fetchApi("/api/cart", {
          method: "DELETE",
          headers: { "x-user-email": userEmail },
        });
      } catch (error) {
        console.error("Failed to clear cart on backend:", error);
        // We'll still clear the frontend state even if backend fails
      }
    }
    dispatch({ type: "RESET_CART" });
  };

  const value = {
    ...cartState,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};