import { create } from "zustand";
import { CandleTick, GlobalTick } from "../../features/webTrading/components/interfaces";

type Store = {
  gloabalTick: Record<string, GlobalTick>;
  setGlobalTick: (tick: GlobalTick) => void;
};

export const useGlobalTickStore = create<Store>((set) => ({
  gloabalTick: {},
  // <<< explicit typing for the inner state param
  setGlobalTick: (tick: GlobalTick) =>
    set((state: Store) => ({
      gloabalTick: { ...state.gloabalTick, [tick.symbol]: tick },
    })),
}));

type CandleTickStore = {
  candleTick: Record<string, CandleTick>;
  setCandleTick: (tick: CandleTick) => void;
};

export const useTickStore = create<CandleTickStore>((set) => ({
  candleTick: {},
  setCandleTick: (tick: CandleTick) =>
    set((state: CandleTickStore) => ({
      candleTick: { ...state.candleTick, [tick.symbol]: tick },
    })),
}));
