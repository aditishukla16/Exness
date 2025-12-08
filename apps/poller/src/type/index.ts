// apps/pooler/src/type/index.ts

// ---- TRADE STREAM DATA ----
export type TradeData = {
  e: "trade";   // event type
  E: number;    // event time
  s: string;    // symbol, e.g. "BTCUSDT"
  t: number;    // trade ID
  p: string;    // price
  q: string;    // quantity
  b: number;    // buyer order ID
  a: number;    // seller order ID
  T: number;    // trade time
  m: boolean;   // is buyer the market maker?
  M: boolean;   // ignore
};

// ---- KLINE OBJECT INSIDE "k" ----
export type Kline = {
  t: number;    // open time
  T: number;    // close time
  s: string;    // symbol
  i: string;    // interval, e.g. "1m"
  f: number;    // first trade ID
  L: number;    // last trade ID
  o: string;    // open
  c: string;    // close
  h: string;    // high
  l: string;    // low
  v: string;    // base asset volume
  n: number;    // number of trades
  x: boolean;   // is this kline closed
  q: string;    // quote asset volume
  V: string;    // taker buy base asset volume
  Q: string;    // taker buy quote asset volume
  B: string;    // ignore
};

// ---- KLINE STREAM DATA (TOP LEVEL) ----
export type KlineData = {
  e: "kline";
  E: number;
  s: string;
  k: Kline;
};
