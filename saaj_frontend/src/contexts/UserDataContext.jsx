import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchApi } from "@/lib/api";

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [personalInfo, setPersonalInfo] = useState({
    phone: "",
    alternateEmail: "",
    dateOfBirth: "",
    gender: "",
  });

  const userEmail = user?.email || null;

  // Load user data from backend on mount and when user changes
  useEffect(() => {
    if (userEmail) {
      // Fetch addresses from backend
      fetchApi("/api/addresses", { headers: { "x-user-email": userEmail } })
        .then((data) => {
          const addrs = Array.isArray(data) ? data : [];
          setAddresses(addrs);
          localStorage.setItem(`addresses_${userEmail}`, JSON.stringify(addrs));
        })
        .catch((error) => {
          console.warn("Could not fetch addresses from backend, using localStorage fallback:", error.message);
          const saved = localStorage.getItem(`addresses_${userEmail}`);
          if (saved) {
            try { setAddresses(JSON.parse(saved)); } catch { setAddresses([]); }
          }
        });

      // Fetch orders from backend
      fetchApi("/api/orders", { headers: { "x-user-email": userEmail } })
        .then((data) => {
          const ords = Array.isArray(data) ? data : [];
          setOrders(ords);
          localStorage.setItem(`orders_${userEmail}`, JSON.stringify(ords));
        })
        .catch((error) => {
          console.warn("Could not fetch orders from backend, using localStorage fallback:", error.message);
          const saved = localStorage.getItem(`orders_${userEmail}`);
          if (saved) {
            try { setOrders(JSON.parse(saved)); } catch { setOrders([]); }
          }
        });

      // Personal info stays localStorage-only (no backend endpoint for it)
      const savedPersonalInfo = localStorage.getItem(`personalInfo_${userEmail}`);
      if (savedPersonalInfo) {
        try { setPersonalInfo(JSON.parse(savedPersonalInfo)); } catch { /* ignore */ }
      }
    } else {
      setAddresses([]);
      setOrders([]);
      setPersonalInfo({
        phone: "",
        alternateEmail: "",
        dateOfBirth: "",
        gender: "",
      });
    }
  }, [userEmail]);

  // Save personalInfo to localStorage whenever it changes
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(
        `personalInfo_${userEmail}`,
        JSON.stringify(personalInfo)
      );
    }
  }, [personalInfo, userEmail]);

  const addAddress = async (address) => {
    const newAddress = { ...address, id: String(Date.now()) };
    // Optimistic update
    setAddresses((prev) => [...prev, newAddress]);

    if (userEmail) {
      try {
        const saved = await fetchApi("/api/addresses", {
          method: "POST",
          headers: { "x-user-email": userEmail },
          body: JSON.stringify(address),
        });
        // Backend returns the address with its id; update state
        if (saved && saved.id) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === newAddress.id ? saved : a))
          );
        }
      } catch (error) {
        console.error("Failed to save address to backend:", error);
      }
    }
    // Also update localStorage as fallback
    setAddresses((prev) => {
      localStorage.setItem(`addresses_${userEmail}`, JSON.stringify(prev));
      return prev;
    });
  };

  const updateAddress = async (id, updatedAddress) => {
    // Optimistic update
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...updatedAddress, id } : addr))
    );

    if (userEmail) {
      try {
        await fetchApi(`/api/addresses/${id}`, {
          method: "PUT",
          headers: { "x-user-email": userEmail },
          body: JSON.stringify(updatedAddress),
        });
      } catch (error) {
        console.error("Failed to update address on backend:", error);
      }
    }
    setAddresses((prev) => {
      localStorage.setItem(`addresses_${userEmail}`, JSON.stringify(prev));
      return prev;
    });
  };

  const deleteAddress = async (id) => {
    // Optimistic update
    setAddresses((prev) => prev.filter((addr) => addr.id !== id));

    if (userEmail) {
      try {
        await fetchApi(`/api/addresses/${id}`, {
          method: "DELETE",
          headers: { "x-user-email": userEmail },
        });
      } catch (error) {
        console.error("Failed to delete address on backend:", error);
      }
    }
    setAddresses((prev) => {
      localStorage.setItem(`addresses_${userEmail}`, JSON.stringify(prev));
      return prev;
    });
  };

  const updatePersonalInfo = (info) => {
    setPersonalInfo((prev) => ({ ...prev, ...info }));
  };

  const addOrder = async (order) => {
    const newOrder = { ...order, id: String(Date.now()), date: new Date().toISOString() };
    // Optimistic update
    setOrders((prev) => [...prev, newOrder]);

    if (userEmail) {
      try {
        const saved = await fetchApi("/api/orders", {
          method: "POST",
          headers: { "x-user-email": userEmail },
          body: JSON.stringify(order),
        });
        // Backend returns the order with its id; update state
        if (saved && saved.id) {
          setOrders((prev) =>
            prev.map((o) => (o.id === newOrder.id ? saved : o))
          );
        }
      } catch (error) {
        console.error("Failed to save order to backend:", error);
      }
    }
    setOrders((prev) => {
      localStorage.setItem(`orders_${userEmail}`, JSON.stringify(prev));
      return prev;
    });
  };

  return (
    <UserDataContext.Provider
      value={{
        addresses,
        orders,
        personalInfo,
        addAddress,
        updateAddress,
        deleteAddress,
        updatePersonalInfo,
        addOrder,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};
