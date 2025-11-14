import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user session in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = {
          id: parsed.id || parsed._id,
          email: parsed.email,
          name:
            parsed.name || (parsed.email ? parsed.email.split("@")[0] : "User"),
          token: parsed.token || parsed.accessToken || null,
          isGoogle: !!parsed.isGoogle,
          ...parsed,
        };
        setUser(normalized);
      } catch (err) {
        // corrupt localStorage, clear it
        console.error("Failed to parse stored user", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, redirectPath = "/") => {
    // Normalize user object to ensure UI fields exist (name/email/token)
    const normalized = {
      id: userData.id || userData._id,
      email: userData.email,
      name:
        userData.name ||
        (userData.email ? userData.email.split("@")[0] : "User"),
      token: userData.token || userData.accessToken || null,
      isGoogle: !!userData.isGoogle,
      // keep any other fields
      ...userData,
    };

    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    navigate(redirectPath);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
