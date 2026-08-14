// src/components/ui/Skeleton.jsx  
import React from "react";

const Skeleton = ({ className = "", dark = false }) => (
  <div className={`animate-pulse ${dark ? "bg-white/10" : "bg-slate-200"} rounded ${className}`} />
);

export default Skeleton;