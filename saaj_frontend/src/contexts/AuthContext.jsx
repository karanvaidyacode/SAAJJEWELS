import React, { createContext, useContext, useMemo } from "react";
import { useUser } from "@clerk/react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isSignedIn, user: clerkUser, isLoaded } = useUser();

  const user = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null;
    return {
      id: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      name:
        clerkUser.fullName ||
        clerkUser.firstName ||
        (clerkUser.primaryEmailAddress?.emailAddress
          ? clerkUser.primaryEmailAddress.emailAddress.split("@")[0]
          : "User"),
      profilePicture: clerkUser.imageUrl || null,
      clerkId: clerkUser.id,
    };
  }, [isSignedIn, clerkUser]);

  const value = {
    user,
    loading: !isLoaded,
    isAuthenticated: !!isSignedIn,
    // login/logout are now handled by Clerk components (<SignInButton>, <UserButton>)
    login: () => {},
    logout: () => {},
  };

  // Always render children — individual components can check `loading` if needed.
  // Blocking render here causes a white screen if Clerk is slow to initialize.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
