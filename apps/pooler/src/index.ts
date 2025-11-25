
import WebSocket from "ws";

import { connectRedis } from "./connectionredis/connectredis";
const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/bnbusdt@trade");
const SPREAD_CONSTANT = 0.005;

ws.on("open", () => {
  console.log("Connected to Binance");
});

connectRedis()
ws.on("message", (msg) => {
  try {
    const str = msg.toString();      // Buffer → string
    const data = JSON.parse(str);    // string → JSON

    // Binance trade event structure example:
    // data = {
    //   e: "trade",
    //   s: "BTCUSDT",
    //   p: "64235.12",
    //   q: "0.0021",
    //   t: 12345678,
    //   E: 171000111222
    // }

    const symbol = data.s;           // e.g. BTCUSDT
    const price = Number(data.p);    // trade price
    const qty = Number(data.q);      // quantity
    const tradeId = data.t;
    const time = data.E;

    console.log({
      symbol,
      price,
      qty,
      tradeId,
      time
    });

  } catch (err) {
    console.log("JSON parse error:", err);
  }
});

