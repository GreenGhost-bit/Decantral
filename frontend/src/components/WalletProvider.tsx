"use client";

import { WalletProvider as TxnlabWalletProvider, WalletManager } from '@txnlab/use-wallet-react';
import { WalletId } from '@txnlab/use-wallet';

const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY
  ]
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <TxnlabWalletProvider manager={walletManager}>
      {children}
    </TxnlabWalletProvider>
  );
}
