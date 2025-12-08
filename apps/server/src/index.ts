import dotenv from "dotenv";
dotenv.config(); // loads apps/server/.env

import Cors from "cors";
import express from "express";

// Use default import because your route file exports default router
import candlesRoute from "./router/candles";       // <-- make sure this path matches your file (router vs routes)
import { userRouter } from "./router/userRouter";
import { orderRouter } from "./router/orderRouter";
import { userMiddleware } from "./middleware/userMiddleware";

import { connectRedis } from "./connectedredis";   // ensure this path points to your connected redis file

const app = express();
app.use(express.json());
app.use(Cors());

// mount routes
app.use("/api/v1/candles", candlesRoute);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/order", userMiddleware, orderRouter);

const PORT = Number(process.env.PORT ?? 4000);

(async () => {
  try {
    // ensure redis is connected before accepting requests
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
