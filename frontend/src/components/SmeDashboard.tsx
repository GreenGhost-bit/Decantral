"use client";

import { useState, useMemo, useEffect } from "react";
import { Calculator, UploadCloud, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { BACKEND_URL } from "../config";

export default function SmeDashboard() {
  const [amount, setAmount] = useState<string>("");
  const [maturityDays, setMaturityDays] = useState<string>("30");
  const [payor, setPayor] = useState<string>("Tata Motors");
  const [irn, setIrn] = useState<string>("IRN-1001-GSTIN-001");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{ hash: string, presentValue: number, protocolFee: number } | null>(null);
  
  const [trustScore, setTrustScore] = useState(94);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/invoices`)
      .then(res => res.json())
      .then(data => {
         const hasDefaults = data.some((inv: any) => inv.status === 'DEFAULTED');
         if (hasDefaults) {
            setTrustScore(42);
         } else {
            setTrustScore(94);
         }
      })
      .catch(console.error);
  }, []);

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  // Discount Formula: P = F * (1 - d * (t / 365))
  const discountRate = 0.12; 

  const metrics = useMemo(() => {
    const f = parseFloat(amount);
    if (!f || isNaN(f)) return { p: 0, fee: 0, t: 0 };
    const t = parseInt(maturityDays) || 30;
    const p = f * (1 - discountRate * (t / 365));
    return {
      p: p,
      fee: f - p,
      t
    };
  }, [amount, maturityDays]);

  const handleTokenize = async () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid invoice amount");
    setIsProcessing(true);
    
    try {
      const verifyLoading = toast.loading("Submitting invoice for funding...");
      
      const dueDate = Date.now() + parseInt(maturityDays) * 86400000;
      const res = await fetch(`${BACKEND_URL}/api/invoices/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          invoiceRef: irn, 
          faceValue: parseFloat(amount), 
          payorName: payor, 
          dueDate 
        })
      });
      
      const data = await res.json();
      toast.dismiss(verifyLoading);

      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }
      
      toast.success("GST Verified! Invoice submitted successfully.");
      
      setSuccessData({
         hash: data.hash,
         presentValue: data.presentValue,
         protocolFee: data.protocolFee
      });

    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (successData) {
    return (
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="glass-panel flex flex-col justify-center items-center" 
         style={{ padding: '4rem', borderRadius: 'var(--radius-2xl)', textAlign: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}
      >
        <CheckCircle size={64} color="var(--accent-emerald)" style={{ marginBottom: '1.5rem' }} />
        <h2 className="text-3xl font-display font-bold text-white mb-3 text-gradient text-gradient-success">Invoice Successfully Tokenized!</h2>
        <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-sm font-bold px-4 py-1.5 rounded-full animate-pulse tracking-wide mb-8">
          Awaiting investor funding
        </span>
        
        <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 w-full max-w-lg text-left flex flex-col gap-4">
           <div className="flex justify-between items-center">
              <span className="text-muted font-medium">Verified Face Value</span>
              <span className="font-mono text-white text-lg">₹{parseFloat(amount).toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-muted font-medium">Calculated Present Value</span>
              <span className="font-mono text-green-400 font-bold text-xl">₹{successData.presentValue.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-muted font-medium">Factoring Protocol Fee</span>
              <span className="font-mono text-red-400 font-medium">₹{successData.protocolFee.toLocaleString()}</span>
           </div>
           
           <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-800">
              <span className="text-muted text-xs uppercase tracking-widest font-bold">Box Storage Hash (SHA-256)</span>
              <span className="font-mono text-sm text-indigo-300 break-all bg-black/40 p-3 rounded-lg border border-indigo-900/30">
                {successData.hash}
              </span>
           </div>
        </div>

        <button 
           onClick={() => { setSuccessData(null); setAmount(""); }} 
           className="premium-btn btn-outline mt-10 w-full max-w-sm"
        >
           Submit Another Invoice
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 items-start" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel" 
        style={{ padding: '2rem', borderRadius: 'var(--radius-2xl)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
           <h2 className="font-display text-xl font-semibold flex items-center gap-2">
             <UploadCloud size={24} color="var(--accent-indigo-light)" />
             Tokenize New Invoice
           </h2>
           <div className="flex items-center gap-3 bg-indigo-950/30 p-1.5 pr-4 rounded-full border border-indigo-500/20 shadow-inner">
              <div className="relative w-12 h-12 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="4" />
                    <motion.circle 
                       cx="22" cy="22" r="18" fill="none" 
                       stroke={trustScore > 50 ? "#10b981" : "#ef4444"} 
                       strokeWidth="4" 
                       strokeLinecap="round"
                       initial={{ strokeDashoffset: circumference }}
                       animate={{ strokeDashoffset }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       strokeDasharray={circumference} 
                    />
                 </svg>
                 <span className="absolute text-xs font-bold font-mono text-white">{trustScore}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Decantral</span>
                 <span className="text-sm font-semibold text-white leading-tight">Trust Score</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Invoice Reference Number (IRN)</label>
            <input 
              type="text" 
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              className="premium-input font-mono text-sm"
              placeholder="e.g. IRN-123-GSTIN-456"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Face Value (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="premium-input font-mono"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Days to Maturity</label>
              <input 
                type="number" 
                value={maturityDays}
                onChange={(e) => setMaturityDays(e.target.value)}
                className="premium-input font-mono"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Anchor Payor (Corporate)</label>
            <select 
              value={payor}
              onChange={(e) => setPayor(e.target.value)}
              className="premium-input"
              style={{ padding: '0.8rem 1rem' }}
            >
              <option>Tata Motors</option>
              <option>Reliance Retail</option>
              <option>Adani Ports</option>
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <button 
              onClick={handleTokenize}
              disabled={isProcessing}
              className="premium-btn btn-primary w-full"
              style={{ marginTop: '1rem', padding: '1rem' }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                   <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                   Processing via Oracle...
                </span>
              ) : (
                <>
                   Tokenize & Lock Stake <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Column: Quote Generator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel relative overflow-hidden"
        style={{ 
          padding: '2.5rem', borderRadius: 'var(--radius-2xl)', 
          background: 'linear-gradient(145deg, rgba(30,27,75,0.4) 0%, rgba(15,23,42,0.4) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.2)' 
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'var(--accent-purple)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
        
        <h2 className="font-display text-xl font-semibold flex items-center gap-2" style={{ marginBottom: '2rem', zIndex: 1, position: 'relative' }}>
          <Calculator size={24} color="var(--accent-purple)" />
          Liquid Quote
        </h2>

        <div className="flex flex-col gap-6" style={{ zIndex: 1, position: 'relative' }}>
          <div className="flex justify-between items-end" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-muted font-medium">Invoice Face Value</span>
            <span className="text-2xl font-mono font-medium">
              ₹ {metrics.p > 0 ? parseFloat(amount).toLocaleString() : "0.00"}
            </span>
          </div>

          <div className="flex justify-between items-end" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-muted font-medium">Discount Rate & Fee</span>
            <div className="text-right">
               <div className="text-sm font-mono text-red" style={{ marginBottom: '0.25rem' }}>- {(discountRate * 100).toFixed(1)}% APY</div>
               <span className="text-xl font-mono text-red font-medium">
                 ₹ {metrics.fee > 0 ? metrics.fee.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
               </span>
            </div>
          </div>

          <div className="flex justify-between items-end" style={{ paddingTop: '1rem' }}>
            <span className="text-lg font-medium" style={{ color: 'var(--accent-indigo-light)' }}>Instant Liquidity</span>
            <motion.span 
              key={metrics.p}
              initial={{ scale: 1.1, textShadow: '0 0 20px rgba(16, 185, 129, 0.8)' }}
              animate={{ scale: 1, textShadow: '0 0 0px rgba(16, 185, 129, 0)' }}
              className="text-4xl font-bold font-mono text-gradient text-gradient-success"
            >
              ₹ {metrics.p > 0 ? metrics.p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
            </motion.span>
          </div>
          
          <div style={{ 
            marginTop: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', 
            borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'flex-start', gap: '1rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <ShieldCheck size={28} color="var(--accent-emerald-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
              By tokenizing, you agree to lock a 5% security stake in ALGO to guarantee authenticity. MBR rent is reclaimed upon maturity. No Double-Discounting permitted due to on-chain Box Storage isolation.
            </p>
          </div>
        </div>
      </motion.div>
      
    </div>
  );
}
