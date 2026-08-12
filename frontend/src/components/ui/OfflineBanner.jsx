// src/components/ui/OfflineBanner.jsx
import React from "react";
import { WifiOff } from "lucide-react";

const OfflineBanner = () => (
  <div
    className="fixed top-0 left-0 w-full z-50 flex items-center justify-center gap-2 text-white text-sm sm:text-base font-medium py-2.5 px-4 animate-[slideDown_0.3s_ease-out]"
    style={{ backgroundColor: "#DC2626" }}
  >
    <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
    No internet connection
    <style>{`
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
    `}</style>
  </div>
);

export default OfflineBanner;