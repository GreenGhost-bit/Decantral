"use client";

import React, { useEffect, useState } from 'react';

interface TrustScoreProps {
  walletAddress: string;
  repaymentCount: number;
  defaultCount: number;
}

export default function TrustScore({ walletAddress, repaymentCount, defaultCount }: TrustScoreProps) {
  // Base Score Calculation
  let rawScore = 50 + (repaymentCount * 10) - (defaultCount * 25);
  const finalScore = Math.max(0, Math.min(100, rawScore));

  // State to handle the ring stroke animation on mount
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // 50ms delay perfectly triggers the CSS transition when the component mounts
    const timer = setTimeout(() => {
      setAnimatedScore(finalScore);
    }, 50);
    return () => clearTimeout(timer);
  }, [finalScore]);

  // SVG parameters
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color mapping based on score
  let ringColor = 'stroke-red-500';
  let textColor = 'text-red-500';
  let shadowGlow = 'rgba(239, 68, 68, 0.1)';
  
  if (finalScore > 70) {
    ringColor = 'stroke-green-500';
    textColor = 'text-green-400';
    shadowGlow = 'rgba(34, 197, 94, 0.15)';
  } else if (finalScore >= 40) {
    ringColor = 'stroke-amber-500';
    textColor = 'text-amber-400';
    shadowGlow = 'rgba(245, 158, 11, 0.15)';
  }

  // Security Stake Calculation
  const securityStake = Math.max(2, 10 - (finalScore / 10)).toFixed(1);

  // Mask wallet Address safely
  const maskedAddress = walletAddress.length > 8 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : walletAddress || 'UNKNOWN';

  return (
    <div 
      className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden transition-all hover:-translate-y-1"
      style={{ boxShadow: `0 10px 30px ${shadowGlow}` }}
    >
      {/* Decorative backdrop glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[50px] opacity-30 rounded-full"
        style={{ backgroundColor: textColor === 'text-green-400' ? '#22c55e' : textColor === 'text-amber-400' ? '#f59e0b' : '#ef4444' }}
      />
      
      <div className="flex w-full justify-between items-center mb-4 relative z-10">
         <span className="bg-black/30 text-[10px] uppercase font-mono px-2.5 py-1 rounded-full text-gray-400 border border-white/5 tracking-wider font-semibold">
           {maskedAddress}
         </span>
         <span className="text-[10px] px-2.5 py-1 rounded border border-white/10 uppercase tracking-widest text-gray-500 bg-white/5 font-semibold">
            Status Activity
         </span>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center mb-4 z-10">
        <svg className="w-full h-full -rotate-90 transform drop-shadow-xl" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle 
            className="stroke-gray-800"
            cx="50" 
            cy="50" 
            r={radius} 
            strokeWidth="8" 
            fill="transparent" 
          />
          {/* Animated Value Ring */}
          <circle 
            className={`${ringColor} transition-all duration-1000 ease-out`}
            cx="50" 
            cy="50" 
            r={radius} 
            strokeWidth="8" 
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
               filter: 'drop-shadow(0 0 4px currentColor)'
            }}
          />
        </svg>

        {/* Center Score Graphic */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-display font-bold ${textColor} drop-shadow-md`}>
            {Math.round(animatedScore)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h3 className="font-display text-lg font-bold text-white mb-1.5 tracking-wide">Decantral Trust Score</h3>
        
        <div className="flex gap-4 mt-2 mb-4 bg-black/20 p-2 rounded-xl border border-white/5">
           <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Repaid</span>
              <span className="text-emerald-400 font-medium font-mono text-sm">{repaymentCount}</span>
           </div>
           <div className="w-[1px] bg-white/10"></div>
           <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Defaults</span>
              <span className="text-red-400 font-medium font-mono text-sm">{defaultCount}</span>
           </div>
        </div>

        <p className="text-xs text-gray-400 font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10 shadow-sm w-full">
          Security stake required: <span className={`font-bold ${textColor}`}>{securityStake}%</span> of invoice value
        </p>
      </div>
    </div>
  );
}
