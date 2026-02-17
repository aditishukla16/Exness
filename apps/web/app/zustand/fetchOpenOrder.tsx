"use client";

import { create } from "zustand";
import axios from "axios";
import { backendUrl } from "../../lib/url";

export interface Position {
  orderId: string;       // client-side ID shape -> use string
  userId: string;
  asset: string;
  side: "Buy" | "Sell";
  leverage: string;
  volume: string;
  openPrice: string;
  margin: string;
  stopLoss: string;
  exposure: string;
  takeProfit: string;
  status: "open" | "closed" | "cancelled";
  createdAt: string;
}

interface GetOpenOrdersResponse {
  position: Position[];
}

interface OrderStore {
  openOrders: Position[];
  fetchOpenOrders: () => Promise<void>;
  setOpenOrders: (orders: Position[]) => void;
}

export const useOpenOrders = create<OrderStore>((set, get) => ({
  openOrders: [],

  setOpenOrders: (orders: Position[]) => set({ openOrders: orders }),

  fetchOpenOrders: async () => {
  try {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("token");
    if (!raw) {
      console.warn("fetchOpenOrders: No token found, skipping request");
      return;
    }
    const token = raw.trim();

    const res = await axios.get<GetOpenOrdersResponse>(
      `${backendUrl}/order/getOpenOrder`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const ordersArray = res.data.position ?? [];
    set({ openOrders: ordersArray });
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.error("Failed to fetch open orders – status:", err.response?.status);
      console.error("Failed to fetch open orders – data:", err.response?.data);

      //if (err.response?.status === 401) {
        // token invalid -> remove it and surface the issue
        //if (typeof window !== "undefined") window.localStorage.removeItem("token");
        //console.warn("Unauthorized — token cleared. Please login again.");
      //}
    } else {
      console.error("Failed to fetch open orders – unknown error:", err);
    }
  }
},

}));
