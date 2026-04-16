import React from 'react';

interface LendingPoolCardProps {
  poolName: string;
  apyRate: number;
  utilizationRate: number;
  activeInvoices: number;
  totalLiquidity: number;
  allowedPayors: string[];
  onExpand: () => void;
}

export default function LendingPoolCard({
  poolName,
  apyRate,
  utilizationRate,
  activeInvoices,
  totalLiquidity,
  allowedPayors,
  onExpand
}: LendingPoolCardProps) {
  
  let barColor = 'bg-red-500';
  if (utilizationRate < 70) {
    barColor = 'bg-green-500';
  } else if (utilizationRate <= 90) {
    barColor = 'bg-amber-500';
  }

  // Premium border logic matching the exact requirements with added glow
  let borderClass = 'border border-white/10'; 
  let premiumBgUrl = '';
  
  if (poolName === 'Anchor Grade Pool') {
    borderClass = 'border-2 border-green-500/80 shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.25)]';
    premiumBgUrl = 'radial-gradient(ellipse at top right, rgba(34, 197, 94, 0.1), transparent 50%)';
  } else if (poolName === 'Open Market Pool') {
    borderClass = 'border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]';
    premiumBgUrl = 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.08), transparent 50%)';
  }

  return (
    <div 
      className={`glass-panel rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 ${borderClass}`}
      style={{ backgroundImage: premiumBgUrl }}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-2xl font-bold text-white font-display leading-tight">{poolName}</h3>
        <div className="text-right flex-shrink-0 ml-4">
          <span className="text-3xl font-mono font-bold text-green-400">{apyRate.toFixed(1)}%</span>
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mt-0.5">Yield APY</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-1">
         <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 backdrop-blur-sm">
            <span className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Total Liquidity</span>
            <span className="font-mono text-lg text-gray-100 font-medium tracking-tight">₹{totalLiquidity.toLocaleString('en-IN')}</span>
         </div>
         <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 backdrop-blur-sm">
            <span className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Active Invoices</span>
            <span className="font-mono text-lg text-gray-100 font-medium tracking-tight">{activeInvoices}</span>
         </div>
      </div>

      <div className="mb-1">
        <p className="text-[10px] text-gray-500 font-mono mb-2.5 tracking-widest uppercase font-semibold">Allowed Payors</p>
        <div className="flex flex-wrap gap-2">
          {allowedPayors.map(payor => (
            <span key={payor} className="px-3 py-1.5 bg-white/5 text-gray-300 text-[10px] uppercase font-bold rounded-full border border-white/10 hover:bg-white/10 transition-colors shadow-sm">
              {payor}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div 
            className={`h-full rounded-full ${barColor} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, Math.max(0, utilizationRate))}%` }} 
          />
        </div>
        <div className="flex justify-end mt-2.5">
          <span className="text-[11px] text-gray-400 font-mono font-medium tracking-wide">{utilizationRate.toFixed(1)}% utilized</span>
        </div>
      </div>

      <button 
        onClick={onExpand}
        className="mt-3 w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10 font-sans shadow-sm flex items-center justify-center gap-2.5 group"
      >
        <span>View invoices</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
