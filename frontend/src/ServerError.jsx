// src/components/ServerError.jsx

import React from "react";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import theme from "./theme/theme";

const ServerError = ({
  title = "Something went wrong",
  description = "Our server encountered an unexpected error. Please try again.",
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${theme.colors.background.page}`}
      style={{ fontFamily: theme.font.family }}
    >
      <div
        className={`w-full max-w-xl bg-white text-center p-10 ${theme.radius.xl} ${theme.shadow.card}`}
      >
        {/* Error Code */}
        <h1
          className="text-7xl md:text-8xl font-extrabold"
          style={{ color: theme.colors.primary }}
        >
          500
        </h1>

        {/* Icon */}
        <div className="flex justify-center mt-8">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center`}
            style={{
              backgroundColor: theme.colors.secondary,
            }}
          >
            <AlertTriangle
              size={46}
              color={theme.colors.primary}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          className="mt-8 text-3xl font-bold"
          style={{ color: theme.colors.text.heading }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className="mt-4 text-lg leading-relaxed"
          style={{ color: theme.colors.text.body }}
        >
          {description}
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onRetry}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${theme.radius.md} ${theme.button.primary} ${theme.shadow.button}`}
          >
            <RotateCcw size={18} />
            Retry
          </button>

          <button
            onClick={() => navigate("/")}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${theme.radius.md} ${theme.button.secondary}`}
          >
            <Home size={18} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;