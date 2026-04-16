"use client";

import React, { useState } from 'react';

export default function DiscountCalculator() {
  const [faceValue, setFaceValue] = useState<number | ''>('');
  const [discountRate, setDiscountRate] = useState<number | ''>(8);
  const [daysToMaturity, setDaysToMaturity] = useState<number | ''>(90);

  const fv = Number(faceValue) || 0;
  const dr = Number(discountRate) || 0;
  const dtm = Number(daysToMaturity) || 0;

  // Formula: P = F * (1 - (d/100) * t/365)
  const presentValue = fv * (1 - (dr / 100) * dtm / 365);
  const protocolFee = fv * 0.01;
  const netProceeds = presentValue - protocolFee;

  return (
    <div className="glass-panel rounded-2xl p-7 shadow-2xl w-full relative overflow-hidden group">
      {/* Decorative background glow that slowly pulses */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-display font-bold text-white tracking-tight">Discount Calculator</h3>
      </div>
      
      <div className="space-y-5 mb-7 relative z-10">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">Invoice face value ₹</label>
          <input 
            type="number"
            value={faceValue}
            onChange={(e) => setFaceValue(e.target.value ? Number(e.target.value) : '')}
            className="premium-input font-mono text-lg"
            placeholder="0"
            min="0"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">Annual discount rate %</label>
            <input 
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value ? Number(e.target.value) : '')}
              className="premium-input font-mono text-lg"
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">Days to maturity</label>
            <input 
              type="number"
              value={daysToMaturity}
              onChange={(e) => setDaysToMaturity(e.target.value ? Number(e.target.value) : '')}
              className="premium-input font-mono text-lg"
              placeholder="0"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0c0c14]/80 p-5 rounded-xl border border-white/10 space-y-3 mb-6 relative z-10 backdrop-blur-md shadow-inner">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <span className="text-gray-400 text-sm font-medium tracking-wide">Present Value</span>
          <span className="font-mono text-gray-200">₹{Math.max(0, presentValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <span className="text-gray-400 text-sm font-medium tracking-wide flex items-center">
            Protocol Fee 
            <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider border border-red-500/20">1%</span>
          </span>
          <span className="font-mono text-red-400">-₹{protocolFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-white font-semibold text-lg tracking-wide">Net Proceeds</span>
          <span className="font-mono text-3xl text-gradient text-gradient-success font-bold drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            ₹{Math.max(0, netProceeds).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex justify-center mt-2 relative z-10 transition-transform duration-300 hover:scale-105">
        <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Formula: P = F × (1 − d × t/365)
        </span>
      </div>
    </div>
  );
}
