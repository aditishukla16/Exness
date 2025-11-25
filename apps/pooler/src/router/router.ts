import type { Data } from "../type";
import { pub } from "../connectionredis/connectredis";

const bidPriceIncrementRate = 0.0005;
const askPriceDecrementRate = 0.0005;

export async function scalewebsocket(data:Data) {

    const fetchedPrice = Number(data.p);
    const bidPrice = fetchedPrice + fetchedPrice * bidPriceIncrementRate;
    const askPrice = fetchedPrice - fetchedPrice * askPriceDecrementRate;

    const symbol = data.s;
    const channel = symbol.replace("USDT","")
    console.log("New price :",bidPrice, askPrice, symbol);
    await pub.publish(channel,JSON.stringify({symbol,askPrice,bidPrice}));
    console.log("published to Redis",bidPrice, askPrice);
    await pub.hSet(`asset:${symbol}`,{
        symbol,
        askPrice,
        bidPrice,
    })
    
}