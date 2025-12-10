"use client";

import { create } from "zustand";
import axios from "axios";
import { backendUrl } from "../../lib/url";
import { UUID } from "crypto";

export interface Position {
  orderId: UUID;
  userId: UUID;
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
      // Next.js safety: server side pe ye function run ho to skip
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("fetchOpenOrders: No token found, skipping request");
        return;
      }

      console.log("Fetching Open Orders");
      console.log("backendUrl:", backendUrl);
      console.log("token (first 10 chars):", token.slice(0, 10), "...");

      const res = await axios.get<GetOpenOrdersResponse>(
        `${backendUrl}/order/getOpenOrder`,
        {
          headers: {
            // yahi format zyada common hai:
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const ordersArray = res.data.position ?? [];
      console.log("Fetched Open Orders:", ordersArray);

      set({ openOrders: ordersArray });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Failed to fetch open orders – status:", err.response?.status);
        console.error("Failed to fetch open orders – data:", err.response?.data);
      } else {
        console.error("Failed to fetch open orders – unknown error:", err);
      }
    }
  },
}));
