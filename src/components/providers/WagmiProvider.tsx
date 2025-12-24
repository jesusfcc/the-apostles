"use client";

import { WagmiProvider, type State } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import React from "react";
import { config } from "~/lib/wagmi-config";

// Re-export config and getConfig for backwards compatibility
export { config, getConfig } from "~/lib/wagmi-config";

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect() {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      const isInCoinbaseWallet = window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser;
      setIsCoinbaseWallet(!!isInCoinbaseWallet);
    };

    checkCoinbaseWallet();
    window.addEventListener('ethereum#initialized', checkCoinbaseWallet);

    return () => {
      window.removeEventListener('ethereum#initialized', checkCoinbaseWallet);
    };
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected) {
      connect({ connector: connectors[1] }); // Coinbase Wallet connector
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return isCoinbaseWallet;
}

const queryClient = new QueryClient();

// Wrapper component that provides Coinbase Wallet auto-connection
function CoinbaseWalletAutoConnect({ children }: { children: React.ReactNode }) {
  useCoinbaseWalletAutoConnect();
  return <>{children}</>;
}

interface ProviderProps {
  children: React.ReactNode;
  initialState?: State;
}

export default function Provider({ children, initialState }: ProviderProps) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <CoinbaseWalletAutoConnect>
          {children}
        </CoinbaseWalletAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
