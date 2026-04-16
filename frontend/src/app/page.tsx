"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import SmeDashboard from "@/components/SmeDashboard";
import InvestorMarketplace from "@/components/InvestorMarketplace";
import ErrorBoundary from "@/components/ErrorBoundary";
import toast from "react-hot-toast";
import { Shield, KeyRound, Database, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { wallets, activeAccount } = useWallet();
  const [view, setView] = useState<"sme" | "investor">("sme");
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="app-container">
      <div className="glow-orb primary" />
      
      <header className="glass-header sticky top-0 z-50 flex items-center justify-between" style={{ padding: '1rem 2rem' }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="logo-box" style={{ 
            width: '36px', height: '36px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 'bold', fontSize: '1.2rem', color: 'white'
          }}>
            D
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient text-gradient-primary">
            Decantral
          </h1>
        </motion.div>
        
        <div className="flex items-center gap-6">
          <div className="view-switcher" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', display: 'flex' }}>
            <button
              onClick={() => setView("sme")}
              className="font-medium"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s',
                color: view === "sme" ? 'white' : 'var(--text-secondary)',
                background: view === "sme" ? 'rgba(255,255,255,0.1)' : 'transparent',
                boxShadow: view === "sme" ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              SME Portal
            </button>
            <button
              onClick={() => setView("investor")}
              className="font-medium"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s',
                color: view === "investor" ? 'white' : 'var(--text-secondary)',
                background: view === "investor" ? 'rgba(255,255,255,0.1)' : 'transparent',
                boxShadow: view === "investor" ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Investor Market
            </button>
          </div>

          <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setDropdownOpen(true)}
              className="premium-btn btn-primary"
            >
              {mounted && activeAccount ? (
                <span className="font-mono flex items-center gap-2">
                  <Wallet size={16} />
                  {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
                </span>
              ) : (
                <span className="flex items-center gap-2"><Wallet size={16} /> Connect Wallet</span>
              )}
            </motion.button>
            
            <AnimatePresence>
              {dropdownOpen && mounted && !activeAccount && wallets && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute glass-panel"
                  style={{ top: '100%', right: '0', marginTop: '0.5rem', width: '220px', padding: '0.5rem', borderRadius: 'var(--radius-xl)', zIndex: 100 }}
                >
                  {wallets.map((wallet: any) => (
                    <button
                      key={wallet.id}
                      onClick={async () => {
                        try {
                          if (wallet.isConnected) {
                            wallet.setActive();
                          } else {
                            await wallet.connect();
                          }
                          setDropdownOpen(false);
                        } catch (e: any) {
                          if (e?.message?.includes('Session currently connected')) {
                            wallet.setActive();
                          } else {
                            toast.error("Connection rejected or failed", { id: 'wallet-err' });
                          }
                        }
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '0.75rem 1rem', 
                        display: 'flex', alignItems: 'center', gap: '0.75rem', 
                        borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={wallet.metadata.icon} alt={wallet.metadata.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                      <span className="font-medium">{wallet.metadata.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {dropdownOpen && mounted && activeAccount && wallets && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute glass-panel"
                  style={{ top: '100%', right: '0', marginTop: '0.5rem', width: '180px', padding: '0.5rem', borderRadius: 'var(--radius-xl)', zIndex: 100 }}
                >
                  <button
                    onClick={() => { wallets[0].disconnect(); setDropdownOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.75rem 1rem', 
                      borderRadius: 'var(--radius-md)', color: 'var(--text-red)',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Disconnect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      
      {/* Bloomberg-Style Market Ticker */}
      <div className="market-ticker-container">
        <div className="market-ticker">
          <div className="ticker-item"><span className="ticker-symbol">ALGO/USD</span> <span className="ticker-value">$0.142</span> <span className="ticker-change pos">+2.4%</span></div>
          <div className="ticker-item"><span className="ticker-symbol">TESTNET_AVG_APY</span> <span className="ticker-value">12.8%</span> <span className="ticker-change">STABLE</span></div>
          <div className="ticker-item"><span className="ticker-symbol">TOTAL_LIQUIDITY_TOKENIZED</span> <span className="ticker-value">₹84.2M</span> <span className="ticker-change pos">▲</span></div>
          <div className="ticker-item"><span className="ticker-symbol">LATEST_ISSUANCE</span> <span className="ticker-value">TATA MOTORS</span> <span className="ticker-change">90 DAYS</span></div>
          {/* Duplicate for seamless loop */}
          <div className="ticker-item"><span className="ticker-symbol">ALGO/USD</span> <span className="ticker-value">$0.142</span> <span className="ticker-change pos">+2.4%</span></div>
          <div className="ticker-item"><span className="ticker-symbol">TESTNET_AVG_APY</span> <span className="ticker-value">12.8%</span> <span className="ticker-change">STABLE</span></div>
          <div className="ticker-item"><span className="ticker-symbol">TOTAL_LIQUIDITY_TOKENIZED</span> <span className="ticker-value">₹84.2M</span> <span className="ticker-change pos">▲</span></div>
        </div>
      </div>

      <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {!mounted ? (
            <motion.div 
              key="loading"
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center" 
              style={{ minHeight: '400px' }}
            >
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--accent-indigo)', borderRadius: '50%', marginBottom: '1rem' }} className="animate-spin" />
              <p className="text-muted font-medium pulse">Loading Decantral Core...</p>
            </motion.div>
          ) : !activeAccount ? (
            <motion.div 
              key="unauth"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center mx-auto"
              style={{ maxWidth: '600px', marginTop: '4rem' }}
            >
              <div 
                className="glass-panel flex items-center justify-center"
                style={{ width: '100px', height: '100px', borderRadius: '24px', marginBottom: '2rem', boxShadow: 'var(--shadow-glow-indigo)' }}
              >
                 <Shield size={48} color="var(--accent-indigo-light)" />
              </div>
              
              <h2 className="text-4xl font-display font-bold mb-4">Decentralized Auth Required</h2>
              <p className="text-muted text-lg mb-10 leading-relaxed">
                Decantral operates entirely on the Algorand blockchain. To access the origination portals or lending markets, you must cryptographically authenticate your identity using a Web3 wallet (e.g. Pera or Defly).
              </p>

              <div className="grid grid-cols-2 gap-6 w-full">
                 <motion.div whileHover={{ y: -5 }} className="glass-panel flex flex-col items-center text-center" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
                    <Database size={32} color="var(--accent-emerald-light)" style={{ marginBottom: '1rem' }} />
                    <h3 className="font-semibold text-lg mb-2">On-Chain Identity</h3>
                    <p className="text-sm text-dim">Your wallet acts as your secure global passport, replacing traditional vulnerable passwords.</p>
                 </motion.div>
                 <motion.div whileHover={{ y: -5 }} className="glass-panel flex flex-col items-center text-center" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
                    <KeyRound size={32} color="#06b6d4" style={{ marginBottom: '1rem' }} />
                    <h3 className="font-semibold text-lg mb-2">Non-Custodial</h3>
                    <p className="text-sm text-dim">Decantral never holds your private keys. You maintain 100% custody and control over your digital assets.</p>
                 </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {view === "sme" ? (
                 <ErrorBoundary fallbackMessage="Oracle verification or SME Dashboard rendering failed.">
                    <SmeDashboard />
                 </ErrorBoundary>
              ) : (
                 <ErrorBoundary fallbackMessage="Indexer request failed. Could not load secondary markets.">
                    <InvestorMarketplace />
                 </ErrorBoundary>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="glass-header flex items-center justify-between" style={{ padding: '0.75rem 2rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', borderBottom: 'none' }}>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-xs font-mono">
             <span className="status-dot online"></span> 
             <span className="text-dim">Indexer:</span> <span className="text-emerald">v3.21.0-Testnet</span>
           </div>
           <div className="flex items-center gap-2 text-xs font-mono">
             <span className="status-dot online"></span> 
             <span className="text-dim">Oracle:</span> <span className="text-emerald">Active-758811931</span>
           </div>
        </div>
        <div className="text-xs font-mono flex items-center gap-4">
           <span className="text-dim">SECURE_TUNNEL: <span className="text-indigo">HTTPS_TLS_1.3</span></span>
           <span className="text-dim">DEC_TERMINAL_V1.1_STN</span>
        </div>
      </footer>
    </main>
  );
}
