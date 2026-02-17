export interface Tick {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  ts: number;
}

export interface Candle {
  startTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type IntervalKey = `${string}_${number}m`;

export interface TickMessage {
  type: "tick";
  symbol: string;
  bidPrice: number;
  askPrice: number;
  ts: number;
  candles: Record<string, Candle>;
}

export interface CandleUpdateMessage {
  type: "candle_update";
  symbol: string;
  ts: number;
  candles: Record<string, Candle>;
}

export interface HelloMessage {
  type: "hello";
  msg: string;
  timestamp: number;
}

export interface ErrorMessage {
  type: "error";
  message: string;
  timestamp: number;
}

/* ADD THIS NEW ONE */
export interface InfoMessage {
  type: "info";
  message: string;
}

/* UPDATE THE UNION TYPE */
export type WSMessage =
  | TickMessage
  | CandleUpdateMessage
  | HelloMessage
  | ErrorMessage
  | InfoMessage;
