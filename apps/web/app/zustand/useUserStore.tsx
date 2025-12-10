"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type Decimal from "decimal.js"; // type-only import

// UUID as a plain string alias — safer for browser/TS usage
export type UUID = string;

export type User = {
  username: string;
  password: string;
  balance: Map<string, Balance>; // key = asset symbol value = balance
};

export type CreateUserResponse = {
  userId: UUID;
  user: User;
  token: string;
};

export type Balance = {
  asset: string;
  quantity: Decimal;
  locked: Decimal;
};

export interface UserState {
  token: string | null;
  user: Map<UUID, User>;
  setUser: (userResponse: CreateUserResponse) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null, // Safe SSR handling
  user: new Map<UUID, User>(),

  setUser: (userResponse: CreateUserResponse) => {
    console.log(userResponse, "this is user response");

    const userMap = new Map(get().user); // Clone existing Map
    userMap.set(userResponse.userId, userResponse.user);

    // Save token in store + localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("token", userResponse.token);
    }

    set({
      user: userMap,
      token: userResponse.token,
    });

    toast.success("User created successfully");
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({
      token: null,
      user: new Map<UUID, User>(),
    });

    toast.success("Logged out successfully");
  },
}));
