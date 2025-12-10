"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, User, LogOut } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="w-full border-b border-[#232a33] bg-[#0d1117]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        
        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ff6b00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff6b00]/20">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-[#ff6b00] text-xl font-semibold leading-tight tracking-wide">
              exness
            </h1>
            <p className="text-gray-400 text-[10px] -mt-0.5">Trading Simulator</p>
          </div>
        </Link>

        {/* RIGHT — Auth & Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <User size={16} className="opacity-80" />
                <span className="font-light tracking-wide">{user?.username}</span>

                {user?.balance && (
                  <span className="text-green-400 font-mono text-xs font-medium tracking-wider">
                    ${user.balance.toLocaleString()}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#151b22] text-white border border-[#232a33] px-4 py-1.5 rounded-md hover:bg-[#1f232b] text-sm transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-[#151b22] text-white border border-[#232a33] px-5 py-1.5 rounded-md hover:bg-[#1f232b] text-sm font-light tracking-wide transition"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="bg-[#ff6b00] text-white px-5 py-1.5 rounded-md hover:bg-[#e55a00] text-sm font-medium transition shadow-md shadow-[#ff6b00]/20"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link
            href="/webtrading"
            className="bg-[#ff6b00] text-white px-5 py-1.5 rounded-md hover:bg-[#e55a00] text-sm font-medium transition shadow-md shadow-[#ff6b00]/20"
          >
            Start Trading
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
