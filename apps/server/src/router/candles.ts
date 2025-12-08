import { Router, Request, Response } from "express";
import { pub, connectRedis } from "../connectedredis"; // adjust path if needed

const router = Router();

const ALLOWED_INTERVALS = ["1m", "5m", "15m", "1h", "1d"];

function normalizeSymbol(raw?: string) {
  if (!raw) return "BTC";
  // Keep symbol uppercase and without quote asset (we'll expect symbols like BTC or BTCUSDT)
  return raw.toUpperCase();
}

/**
 * Redis key format:
 *  candles:{interval}:{SYMBOL}
 *  -> stored as a LIST with newest-first (LPUSH on writes)
 *
 * Returned shape for each candle:
 *  { t: number, o: string, h: string, l: string, c: string, v?: string }
 */

router.get("/", async (req: Request, res: Response) => {
  try {
    // ensure redis client is connected
    await connectRedis();

    const rawSymbol = req.query.symbol as string | undefined;
    const interval = (req.query.interval as string | undefined) ?? "1m";
    const limitRaw = Number(req.query.limit ?? 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 1000) : 10;

    if (!ALLOWED_INTERVALS.includes(interval)) {
      return res.status(400).json({ error: "Invalid interval", allowed: ALLOWED_INTERVALS });
    }

    const symbol = normalizeSymbol(rawSymbol);
    const key = `candles:${interval}:${symbol}`;

    // LRANGE returns items newest-first if worker used LPUSH
    // Using lRange from node-redis (camelCase)
    const rawList = await pub.lRange(key, 0, limit - 1);

    if (!rawList || rawList.length === 0) {
      // optional: fallback to Binance REST if you want initial seed when Redis empty
      return res.json([]); // keep simple: return empty array if no data
    }

    // parse JSON safely
    const rows = rawList.map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // respond with array of candle objects (newest-first). If frontend needs oldest-first, reverse here.
    return res.json(rows);
  } catch (err) {
    console.error("candles route error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
