"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';
import { Toaster } from 'sonner';

const TICKERS = [
  { symbol: 'EUR / USD', price: '1.08752', change: '+0.18%', note: 'Tight spread' },
  { symbol: 'XAU / USD', price: '2385.40', change: '-0.34%', note: 'High volatility' },
  { symbol: 'BTC / USD', price: '68,420.10', change: '+1.92%', note: 'Crypto session active' },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TICKERS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const activeTicker = TICKERS[activeIndex];

  return (
    <div className="relative min-h-screen bg-[#050811] text-white overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-10 h-64 w-64 rounded-full bg-[#20e3b2]/15 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-[#6b7bff]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#111827] blur-3xl opacity-60" />
      </div>

      <Toaster />

      <main className="px-6 py-16 flex flex-col items-center">
        {/* LIVE MARKETS TICKER */}
        <div className="w-full max-w-5xl mb-10">
          <div className="flex items-center gap-4 rounded-full border border-[#1c2530] bg-[#050a14]/80 px-4 py-2 backdrop-blur text-xs">
            <span className="flex items-center gap-1 text-[#20e3b2] font-semibold tracking-[0.18em] uppercase">
              <Zap size={14} />
              Live Markets
            </span>
            <div className="h-4 w-px bg-[#1f2933]" />
            <div className="flex-1 flex items-center justify-between text-[11px] text-gray-200">
              <span className="font-medium">{activeTicker.symbol}</span>
              <span className="font-mono text-sm">{activeTicker.price}</span>
              <span
                className={
                  activeTicker.change.startsWith('-')
                    ? 'text-red-400 font-semibold'
                    : 'text-green-400 font-semibold'
                }
              >
                {activeTicker.change}
              </span>
              <span className="text-gray-500 hidden sm:inline">
                {activeTicker.note}
              </span>
            </div>
          </div>
        </div>

        {/* TOP BADGE */}
        <div className="flex items-center gap-3 bg-[#12171f] px-5 py-2 rounded-full border border-[#1d2530] text-xs mb-8">
          <span className="text-gray-400 tracking-widest">
            Trade with precision · Move with the market
          </span>
        </div>

        {/* HERO SECTION */}
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight mb-6">
          The <span className="text-[#20e3b2]">Exness</span>
          <br />
          Trading Experience
        </h1>

        <p className="text-gray-400 text-center max-w-2xl text-base md:text-lg mb-8">
          Execute your strategies on a platform engineered for speed, stability,
          and transparency. Exness combines institutional-grade pricing, deep
          liquidity, and real-time market insight so every trade feels as
          responsive as the market.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          <Link
            href="/webtrading"
            className="bg-[#20e3b2] text-black font-semibold px-8 py-3 rounded-md hover:bg-[#1bd8a6] transition text-sm tracking-wide"
          >
            Start Trading →
          </Link>

          <Link
            href="/features"
            className="bg-[#12171f] border border-[#2a3441] px-8 py-3 rounded-md hover:bg-[#1c2431] transition text-sm tracking-wide text-gray-300"
          >
            Explore the Platform
          </Link>
        </div>

        {/* TRUST ROW */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <span className="text-gray-200 text-sm">
            Trusted by traders worldwide
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-green-500 rounded-sm" />
            ))}
          </div>
          <span className="text-gray-500 text-xs tracking-wide text-center">
            Tight spreads · Fast execution · Transparent pricing
          </span>
        </div>

        {/* METRICS SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16 text-center max-w-5xl w-full">
          <Metric
            value="500+"
            label="Instruments"
            sub="Forex · Metals · Indices · Crypto"
          />
          <Metric
            value="24/5"
            label="Market Coverage"
            sub="Major & minor sessions"
          />
          <Metric
            value="0.01s"
            label="Execution Speed"
            sub="Low-latency routing"
          />
          <Metric
            value="$2T+"
            label="Monthly Volume"
            sub="Deep global liquidity"
          />
          <Metric
            value="99.99%"
            label="Platform Uptime"
            sub="Stability when it matters"
          />
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl w-full mb-10">
          {/* Feature 1 with tiny “sparkline” */}
          <div className="p-6 bg-[#12171f] border border-[#1d2733] rounded-xl hover:border-[#2c3f51] transition">
            <TrendingUp size={26} className="text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Market Data</h3>
            <p className="text-gray-400 text-sm mb-4">
              See every tick as it happens. Tight spreads, live liquidity, and
              accurate quotes from major global venues — all updated in
              milliseconds.
            </p>
            <div className="flex items-end gap-[3px] h-10">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-green-400/70"
                  style={{
                    height: `${14 + (i % 5) * 4 + (i % 3) * 2}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="p-6 bg-[#12171f] border border-[#1d2733] rounded-xl hover:border-[#2c3f51] transition">
            <BarChart3 size={26} className="text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Deep Market Liquidity</h3>
            <p className="text-gray-400 text-sm">
              Benefit from institutional-grade liquidity, competitive pricing,
              and consistent execution across major symbols.
            </p>
          </div>

          <div className="p-6 bg-[#12171f] border border-[#1d2733] rounded-xl hover:border-[#2c3f51] transition">
            <Shield size={26} className="text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure & Regulated</h3>
            <p className="text-gray-400 text-sm">
              Client funds are protected with strong oversight, segregation, and
              bank-grade security infrastructure.
            </p>
          </div>

          <div className="p-6 bg-[#12171f] border border-[#1d2733] rounded-xl hover:border-[#2c3f51] transition">
            <Zap size={26} className="text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Next-gen Execution</h3>
            <p className="text-gray-400 text-sm">
              Low latency, high stability, and a stack engineered to support
              every trading style — from scalping to swing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div>
      <div className="text-3xl font-bold text-[#20e3b2]">{value}</div>
      <div className="text-gray-200 text-sm mt-1">{label}</div>
      <div className="text-gray-500 text-[11px] mt-1">{sub}</div>
    </div>
  );
}
