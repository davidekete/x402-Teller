"use client";

import { Home, RefreshCw, ArrowLeftRight, Settings } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-zinc-800/50 px-6 py-4">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <button className="flex flex-col items-center gap-1 text-white">
          <Home className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <RefreshCw className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <ArrowLeftRight className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
