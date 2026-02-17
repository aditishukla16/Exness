"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Minimal User shape for the app. Extend as needed.
 */
interface User {
  id: string;
  username: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, userId: string, token:string) => void;
  logout: () => Promise<void>;
  fetchBalance: () => Promise<void>;
} 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Helper: resolve API base URL. Prefer a central lib/url export in the project if available.
 * Fallback to NEXT_PUBLIC_API_SERVER if not using a shared url file.
 */
const API_BASE =
  (process.env.NEXT_PUBLIC_API_SERVER as string | undefined) ?? "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define this helper before useEffect so the effect can call it.
  const fetchUserBalance = async (userId: string) => {
    if (!API_BASE) {
      console.warn("API base URL is not configured (NEXT_PUBLIC_API_SERVER). Skipping balance fetch.");
      return;
    }

    try {
      // If running on server or userId is empty, skip.
      if (typeof window === "undefined" || !userId) return;

      const res = await fetch(`${API_BASE}/api/v1/user/balance`, {
        credentials: "include",
        // If your backend requires token-based auth, include the Authorization header here.
        // headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn("fetchUserBalance: server returned", res.status);
        return;
      }

      const data = await res.json();

      setUser((prev) => (prev ? { ...prev, balance: Number(data.usd_balance) } : prev));
    } catch (err) {
      console.error("Failed to fetch balance for user:", userId, err);
    }
  };

  // Run once on client mount: hydrate user from localStorage and fetch balance
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const userId = window.localStorage.getItem("userId");
        const username = window.localStorage.getItem("username");

        if (userId && username) {
          setUser({ id: userId, username });
          // fetch balance but don't block rendering
          await fetchUserBalance(userId);
        }
      } catch (err) {
        console.error("AuthProvider hydration error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
    // empty deps: run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (username: string, userId: string, token:string) =>  {
    const newUser = { id: userId, username };
    setUser(newUser);

    // Write to localStorage on client only
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("token", token);
        window.localStorage.setItem("userId", userId);
        window.localStorage.setItem("username", username);
      } catch (err) {
        console.warn("Unable to persist user to localStorage", err);
      }
    }

    // Fetch balance after login
    fetchUserBalance(userId).catch((e) => {
      console.warn("fetchUserBalance after login failed:", e);
    });
  };

  const logout = async () => {
    try {
      if (API_BASE) {
        await fetch(`${API_BASE}/api/v1/user/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (err) {
      console.error("Logout error (server call):", err);
    }

    // Clear client state and localStorage safely
    setUser(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("userId");
        window.localStorage.removeItem("username");
      } catch (err) {
        console.warn("Unable to clear localStorage during logout", err);
      }
    }
  };

  const fetchBalance = async () => {
    if (!user) {
      console.warn("fetchBalance called but user is null");
      return;
    }
    await fetchUserBalance(user.id);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    fetchBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
