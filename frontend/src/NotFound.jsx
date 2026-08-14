// src/components/NotFound.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import theme from "./theme/theme"; 

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.colors.background.page} px-6`}
      style={{ fontFamily: theme.font.family }}
    >
      <div
        className={`w-full max-w-xl text-center ${theme.radius.xl} bg-white p-10 ${theme.shadow.card}`}
      >
        {/* 404 */}
        <h1
          className="text-8xl md:text-9xl font-extrabold tracking-wider"
          style={{ color: theme.colors.primary }}
        >
          404
        </h1>

        {/* Heading */}
        <h2
          className="mt-5 text-3xl md:text-4xl font-bold"
          style={{ color: theme.colors.text.heading }}
        >
          Oops! Page Not Found
        </h2>

        {/* Description */}
        <p
          className="mt-4 text-lg leading-relaxed"
          style={{ color: theme.colors.text.body }}
        >
          Sorry, the page you are looking for doesn't exist, has been moved,
          or is temporarily unavailable.
        </p>

        {/* Illustration */}
        <div className="mt-10 flex justify-center">
          <div className="relative">
            <div
              className={`w-52 h-52 ${theme.radius.full} flex items-center justify-center`}
              style={{
                backgroundColor: theme.colors.secondary,
                boxShadow: `0 20px 40px ${theme.colors.shadow}`,
              }}
            >
              <span className="text-7xl">🚀</span>
            </div>

            <div
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full animate-ping"
              style={{ backgroundColor: theme.colors.primary }}
            />

            <div
              className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full"
              style={{ backgroundColor: theme.colors.primaryLight }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${theme.radius.md} ${theme.button.secondary}`}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${theme.radius.md} ${theme.button.primary} ${theme.shadow.button}`}
          >
            <Home size={18} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;