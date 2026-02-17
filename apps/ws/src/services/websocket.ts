// ws-redis-manager.ts
import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "redis"; // node-redis v4
import { WSMessage } from "../types/type";

export class WSManager {
  private wss: WebSocketServer;
  private wssUrl: string | null = null;
  private redisSub = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
  private subscriptions: Map<string, Set<WebSocket>> = new Map();
  private redisSubscribedChannels: Set<string> = new Set();
   public onChannelSelected?: (channel: string) => void;
  public getUrl(): string | null {
    return this.wssUrl;
  }

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setUp();
    this.startRedis().catch((err) => {
      console.error("Redis start error:", err);
    });
  }

  private async startRedis() {
    this.redisSub.on("error", (e) => console.error("Redis error", e));
    await this.redisSub.connect();

    // node-redis: use .subscribe(channel, listener) to get callback per channel
    // But we will use a generic listener via .subscribe to forward messages.
    // We do NOT subscribe to every channel at start; we subscribe lazily on demand.
  }

  private async ensureRedisSubscribed(channel: string) {
    if (this.redisSubscribedChannels.has(channel)) return;
    // subscribe returns after subscription; provide callback to handle messages
    await this.redisSub.subscribe(channel, (message: string) => {
      this.onRedisMessage(channel, message);
    });
    this.redisSubscribedChannels.add(channel);
    console.log(`Subscribed to redis channel ${channel}`);
  }

  private onRedisMessage(channel: string, message: string) {
    const sockets = this.subscriptions.get(channel);
    if (!sockets || sockets.size === 0) return;

    // Optionally parse and validate message:
    let parsed: any;
    try {
      parsed = JSON.parse(message);
    } catch {
      // send raw string if parsing fails
      parsed = { type: "raw", payload: message };
    }

    const wsMsg: WSMessage = typeof parsed === "object" ? parsed : { type: "info", message: message };

    const payload = JSON.stringify(wsMsg);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  }

  private setUp() {
    this.wss.on("connection", async (ws: WebSocket, req) => {
      const channel = req.url ? req.url.replace("/", "") : null; // e.g. "BTCUSDT"
      if (channel) {
        // register socket under the channel
        this.addSubscriber(channel, ws);
        // ensure Redis subscriber exists
        await this.ensureRedisSubscribed(channel);
      }

      // Accept dynamic subscribe/unsubscribe messages from client (optional)
      ws.on("message", async (data) => {
        try {
          const msg = JSON.parse(String(data));
          if (msg?.type === "subscribe" && typeof msg.symbol === "string") {
            await this.addSubscriber(msg.symbol, ws);
            await this.ensureRedisSubscribed(msg.symbol);
            this.sendToClient(ws, { type : "info", message: `subscribed to ${msg.symbol}` });
          } else if (msg?.type === "unsubscribe" && typeof msg.symbol === "string") {
            this.removeSubscriber(msg.symbol, ws);
            this.sendToClient(ws, { type: "info", message: `unsubscribed from ${msg.symbol}` });
          } else {
            // handle other messages or ignore
          }
        } catch (e) {
          // not JSON — ignore or log
          console.warn("Invalid WS message", e);
        }
      });

      ws.on("close", () => {
        // cleanup: remove ws from all subscriptions it was part of
        for (const [sym, set] of this.subscriptions.entries()) {
          if (set.has(ws)) {
            set.delete(ws);
            if (set.size === 0) {
              this.subscriptions.delete(sym);
              // optionally unsubscribe redis to free resources:
              // await this.redisSub.unsubscribe(sym);
              // this.redisSubscribedChannels.delete(sym);
            }
          }
        }
      });

      // info welcome
      this.sendToClient(ws, { type: "info", message: "You are connected to socket server" });
    });
  }

  private addSubscriber(channel: string, ws: WebSocket) {
    const set = this.subscriptions.get(channel) ?? new Set<WebSocket>();
    set.add(ws);
    this.subscriptions.set(channel, set);
    console.log(`Socket subscribed to ${channel}. total clients: ${set.size}`);
  }

  private removeSubscriber(channel: string, ws: WebSocket) {
    const set = this.subscriptions.get(channel);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) this.subscriptions.delete(channel);
    console.log(`Socket unsubscribed from ${channel}. remaining: ${set.size}`);
  }

  private sendToClient(socket: WebSocket, message: WSMessage) {
    if (socket.readyState == WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  broadcast(message: WSMessage) {
    const messageString = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState == WebSocket.OPEN) client.send(messageString);
    }
  }

  async close(): Promise<void> {
    try {
      await this.redisSub.disconnect();
    } catch (e) {
      console.warn("Error disconnecting redis", e);
    }
    return new Promise((resolve, reject) => {
      this.wss.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
