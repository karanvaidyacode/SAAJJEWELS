import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

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

  // Load user data from localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      const savedAddresses = localStorage.getItem(`addresses_${user.email}`);
      const savedOrders = localStorage.getItem(`orders_${user.email}`);
      const savedPersonalInfo = localStorage.getItem(
        `personalInfo_${user.email}`
      );

      if (savedAddresses) setAddresses(JSON.parse(savedAddresses));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedPersonalInfo) setPersonalInfo(JSON.parse(savedPersonalInfo));
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
  }, [user]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `addresses_${user.email}`,
        JSON.stringify(addresses)
      );
      localStorage.setItem(`orders_${user.email}`, JSON.stringify(orders));
      localStorage.setItem(
        `personalInfo_${user.email}`,
        JSON.stringify(personalInfo)
      );
    }
  }, [addresses, orders, personalInfo, user]);

  const addAddress = (address) => {
    setAddresses((prev) => [...prev, { ...address, id: Date.now() }]);
  };

  const updateAddress = (id, updatedAddress) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...updatedAddress, id } : addr))
    );
  };

  const deleteAddress = (id) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id));
  };

  const updatePersonalInfo = (info) => {
    setPersonalInfo((prev) => ({ ...prev, ...info }));
  };

  const addOrder = (order) => {
    setOrders((prev) => [
      ...prev,
      { ...order, id: Date.now(), date: new Date().toISOString() },
    ]);
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
