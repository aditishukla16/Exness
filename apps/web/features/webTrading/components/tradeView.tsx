"use client";

import React, { useEffect, useRef } from "react";
import { ChartManager, UpdatedCandleData } from "../../../lib/chartManager";
import { CandleTick, GlobalTick, WSMessage } from "./interfaces";
import { backendUrl, KLINES_BASE } from "../../../lib/url";
import { useGlobalTickStore, useTickStore } from "../../../app/zustand/store";
import { useOpenOrders } from "../../../app/zustand/fetchOpenOrder";

interface KLine {
  close: string;
  end: string;
  high: string;
  low: string;
  open: string;
  quoteVolume: string;
  start: string;
  trades: string;
  time: string;
  volume: string;
  bucket: string;
}

interface TradeChartProps {
  selectedTick: string;
  className?: string;
}

type LocalCandle = {
  startTime: number; // ms epoch
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const INTERVAL_MAP_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
};

const UI_THROTTLE_MS = 200; // throttle chart updates to avoid jank

const TradeChart = ({ selectedTick, className }: TradeChartProps) => {
  const setTick = useTickStore((state) => state.setCandleTick);
  const { openOrders, fetchOpenOrders } = useOpenOrders();

  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [interval, setIntervalState] = React.useState("1m");
  let symbol = selectedTick.toString();
  const setGlobalTick = useGlobalTickStore((state) => state.setGlobalTick);

  // local candle state for aggregation when server only sends ticks
  const currentLocalCandle = useRef<LocalCandle | null>(null);
  const pendingLocalCandle = useRef<LocalCandle | null>(null);
  const lastPushTs = useRef<number>(0);
  const throttleTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchOpenOrders();
    let chartManager: ChartManager | null = null;

    const init = async () => {
      try {
        const params = new URLSearchParams();
        params.set("symbol", symbol);
        params.set("interval", interval);
        params.set("limit", "500");

        const res = await fetch(`${KLINES_BASE}?${params.toString()}`, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch k-lines data");
        }

        const data = await res.json();

        // Raw tuple -> normalized typed object
        type RawTuple = any[]; // typical exchange tuple [ts, open, high, low, close, ...]
        type RawKline = {
          timeMs: number; // keep ms for clarity
          open: number;
          high: number;
          low: number;
          close: number;
        };

        // Convert incoming tuples to typed RawKline[] and normalize to ms
        const candles: RawKline[] = Array.isArray(data)
          ? (data.map((d: RawTuple): RawKline => {
              const rawTs = Number(d[0]); // assume incoming timestamp is ms (adjust if your backend uses seconds)
              return {
                timeMs: rawTs,
                open: Number(d[1]),
                high: Number(d[2]),
                low: Number(d[3]),
                close: Number(d[4]),
              };
            }) as RawKline[])
          : [];

        if (!chartRef.current) return;
        chartManagerRef.current?.destroy();

        type Processed = {
          open: number;
          high: number;
          low: number;
          close: number;
          timestamp: number; // ms epoch
        };

        const processedCandles: Processed[] = candles
          .map((kline: RawKline) => {
            // kline.timeMs is already ms
            const ts = Number(kline.timeMs);
            return {
              open: Number(kline.open),
              high: Number(kline.high),
              low: Number(kline.low),
              close: Number(kline.close),
              timestamp: ts,
            } as Processed;
          })
          .filter((candle) => !isNaN(candle.timestamp))
          .sort((a, b) => a.timestamp - b.timestamp)
          .filter((candle, idx, arr) => idx === 0 || candle.timestamp > arr[idx - 1]!.timestamp);

        chartManager = new ChartManager(chartRef.current, processedCandles, {
          background: "#0a0e13",
          color: "#ffffff",
        });

        chartManagerRef.current = chartManager;
      } catch (err) {
        console.error("Error fetching k-lines data:", err);
      }
    };

    init();

    return () => {
      chartManager?.destroy();
      if (chartManagerRef.current === chartManager) {
        chartManagerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTick, interval]);

  useEffect(() => {
   // reset local candle state when symbol or interval changes
  currentLocalCandle.current = null;
  pendingLocalCandle.current = null;
  lastPushTs.current = 0;

  if (throttleTimer.current) {
    window.clearTimeout(throttleTimer.current);
    throttleTimer.current = null;
  }

  // close old socket if exists
  if (wsRef.current) {
    wsRef.current.close();
    wsRef.current = null;
  }

  const ws = new WebSocket(
    `ws://localhost:8080/${encodeURIComponent(symbol)}`
  );

  wsRef.current = ws;

  ws.onopen = () => {
    console.log("✅ WS Connected:", symbol);
  };

  ws.onerror = (e) => {
    console.error("❌ WS Error:", e);
  };

  ws.onclose = (e) => {
    console.log("⚠️ WS Closed:", e.code, e.reason);
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as any;

      // Server-supplied aggregated candle
      if (
        parsed?.type === "tick" &&
        parsed?.candles &&
        parsed.candles[interval]
      ) {
        const candle = parsed.candles[interval];

        const updated: UpdatedCandleData = {
          open: String(candle.open),
          high: String(candle.high),
          low: String(candle.low),
          close: String(candle.close),
          timestamp: new Date(candle.startTime),
        };

        setTick(parsed as CandleTick);
        chartManagerRef.current?.updateData(updated);
        return;
      }

      // Global tick
      if (parsed && (parsed.price !== undefined || parsed.p !== undefined)) {
        const price = Number(parsed.price ?? parsed.p);
        const tickTimeMs = parsed.time
          ? Number(parsed.time)
          : Date.now();

        handleLocalTick(price, tickTimeMs);
        setGlobalTick(parsed as GlobalTick);
        return;
      }

      // Ignore heartbeats
      if (
        parsed?.type &&
        (parsed.type === "info" || parsed.type === "heartbeat")
      ) {
        return;
      }

      // Alternate candle
      if (parsed && parsed.type === "candle_tick") {
        setTick(parsed as CandleTick);

        const c = parsed?.candles?.[interval];

        if (c) {
          const updated: UpdatedCandleData = {
            open: String(c.open),
            high: String(c.high),
            low: String(c.low),
            close: String(c.close),
            timestamp: new Date(c.startTime),
          };

          chartManagerRef.current?.updateData(updated);
        }
      }
    } catch (err) {
      console.error("Parse Error:", err);
    }
  };

  return () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };
}, [symbol, interval]);
  // Local aggregation logic: bucket ticks into interval-sized candle and push updates throttled
  function handleLocalTick(price: number, tickTimeMs: number) {
    const intervalMs = INTERVAL_MAP_MS[interval] ?? 60_000;
    const bucketStart = Math.floor(tickTimeMs / intervalMs) * intervalMs;

    // initialize new bucket
    if (!currentLocalCandle.current || currentLocalCandle.current.startTime !== bucketStart) {
      // push previous candle if exists
      if (currentLocalCandle.current) {
        const prev = currentLocalCandle.current;
        const updatedPrev: UpdatedCandleData = {
          open: String(prev.open),
          high: String(prev.high),
          low: String(prev.low),
          close: String(prev.close),
          timestamp: new Date(prev.startTime),
        };
        chartManagerRef.current?.updateData(updatedPrev);
      }

      currentLocalCandle.current = {
        startTime: bucketStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
      };
    } else {
      // update existing candle
      const c = currentLocalCandle.current!;
      if (price > c.high) c.high = price;
      if (price < c.low) c.low = price;
      c.close = price;
    }

    // schedule throttled update
    pendingLocalCandle.current = { ...currentLocalCandle.current! };
    const now = Date.now();
    const last = lastPushTs.current;

    if (now - last >= UI_THROTTLE_MS) {
      pushPendingLocalCandle();
      lastPushTs.current = now;
    } else {
      if (throttleTimer.current) window.clearTimeout(throttleTimer.current);
      throttleTimer.current = window.setTimeout(() => {
        pushPendingLocalCandle();
        lastPushTs.current = Date.now();
        throttleTimer.current = null;
      }, UI_THROTTLE_MS - (now - last));
    }

    updatePriceLabel(price);
  }

  function pushPendingLocalCandle() {
    const p = pendingLocalCandle.current;
    if (!p) return;
    const updated: UpdatedCandleData = {
      open: String(p.open),
      high: String(p.high),
      low: String(p.low),
      close: String(p.close),
      timestamp: new Date(p.startTime),
    };
    chartManagerRef.current?.updateData(updated);
  }

  function updatePriceLabel(price: number) {
    const el = document.getElementById("last-price");
    if (el) el.textContent = price.toFixed(2);
  }

  return (
    <div className="flex-1 bg-[#0a0e13] border-r border-[#2a3441] relative max-h-[28rem] ">
      <div className="absolute top-4 left-4 z-10 bg-[#141920]/90 backdrop-blur-sm rounded-lg p-2 border border-[#2a3441]">
        <div className="flex items-center space-x-2">
          {["1m", "5m", "15m", "30m"].map((timeframe) => (
            <button
              key={timeframe}
              className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#2a3441] rounded transition-colors"
              onClick={() => setIntervalState(timeframe)}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* last-price label */}
      <div style={{ position: "absolute", top: 8, right: 12, zIndex: 20 }}>
        <div id="last-price" style={{ fontWeight: 700, color: "#00ff88" }}>
          --
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default TradeChart;
