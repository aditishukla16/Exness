// apps/web/lib/url.ts
export const backendUrl =
  (process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined) ??
  "http://localhost:4000/api/v1";

export const KLINES_BASE =
  (process.env.NEXT_PUBLIC_KLINES_BASE as string | undefined) ??
  "https://fapi.binance.com/fapi/v1/klines";
