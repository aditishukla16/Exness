import { Router } from "express";
import { Request,Response } from "express";
const router = Router();
import Decimal from "decimal.js";
import { checkBalance,  closePosition, creditAssets, deLockBalance, getAllBalances, getBalance, getUserPosition, lockBalance, openPosition, getUserOpenPosition } from "../Helper";
import { randomUUID, UUID } from "crypto";
import { CustomRequest } from "../middleware/userMiddleware";
import { userMiddleware } from "../middleware/userMiddleware";

router.post(
  "/open",
  userMiddleware,
  async (req: CustomRequest, res: Response) => {

    console.log(req.body);

    let { side, volume, asset, stopLoss, takeProfit, leverage } = req.body;

    const userId = req.id as UUID;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    volume = new Decimal(volume);
    stopLoss = new Decimal(stopLoss);
    takeProfit = new Decimal(takeProfit);
    leverage = new Decimal(leverage);

    try {
      const assetDetails = { bid_price: "100", ask_price: "100" };

      const price =
        side === "Buy"
          ? new Decimal(assetDetails.ask_price)
          : new Decimal(assetDetails.bid_price);

      const entryPrice = leverage.eq(1)
        ? volume.mul(price)
        : volume.mul(price).div(leverage);

      const isEnough = await checkBalance(entryPrice, userId);

      if (!isEnough) {
        return res.status(400).json({
          message: leverage.eq(1)
            ? "Insufficient balance"
            : "Insufficient margin",
        });
      }

      await lockBalance(entryPrice, userId);

      const orderId = randomUUID();

      const position = await openPosition(
        orderId,
        userId,
        side,
        volume,
        entryPrice,
        stopLoss,
        takeProfit,
        "open",
        leverage,
        asset,
        price
      );

      await deLockBalance(userId, entryPrice);
      await creditAssets(userId, asset, volume);

      res.status(200).json({
        message: "Position opened",
        position,
      });

    } catch (err) {
      console.error("OPEN ROUTE ERROR:", err);

      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);



router.post("/getUSDTBalance",async(req:Request,res:Response)=>{
    try{
        const {userId} = req.body;
        const balance = await getBalance(userId);
        res.status(200).json({
            balance
        })
    }catch(err){
        res.status(500).json({
            message:"Internal server error"
        })
    }
})

router.post("/getAllBalances",async(req:Request,res:Response)=>{
    try{
        const {userId} = req.body;
        const balance = await getAllBalances(userId);
        res.status(200).json({
            balance
        })
    }catch(err){
        res.status(500).json({
            message:"Internal server error"
        })
    }
 })

router.post("/closePosition",async(req:Request,res:Response)=>{
    const {orderId,userId} = req.body;
    if(!orderId){
        res.status(400).json({
            message:"Invalid request"
        })
        return
    }
    try{
        const position = await getUserPosition(orderId,userId) ;
        if(position){
           const closedPosition = await closePosition(position);
            res.status(200).json({
                message:"Success",
                data:closedPosition
            })
        }
    }catch(err){
        res.status(500).json({
            message:"Internal server error"
        })
    }
})

router.get(
  "/getOpenOrder",
  userMiddleware,
  async (req: CustomRequest, res: Response) => {

    const userId = req.id as UUID;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    try {
      const position = await getUserOpenPosition(userId);

      res.status(200).json({
        position: position ?? [],
      });

    } catch (err) {
  console.error("OPEN ORDER ERROR:", err);

  res.status(500).json({
    message: "Internal server error",
    error: String(err),
  });
}
}
  
);

export const orderRouter = router; 