"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useConnect } from "wagmi";
import { useMiniApp } from "@neynar/react";

const BASE_APP_CLIENT_FID = 309857;

interface ConnectScreenProps {
  onConnected: () => void;
}

export default function ConnectScreen({ onConnected }: ConnectScreenProps) {
  const { context, isSDKLoaded } = useMiniApp();
  const { isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const isBaseApp = context?.client?.clientFid === BASE_APP_CLIENT_FID;

  // Pick the right connector: farcasterFrame for Warpcast, coinbaseWallet for Base App
  const preferredConnector = useMemo(() => {
    if (isBaseApp) {
      return (
        connectors.find(
          (c) =>
            c.id === "coinbaseWalletSDK" ||
            c.name.toLowerCase().includes("coinbase")
        ) || connectors[1]
      );
    }
    return connectors.find((c) => c.id === "farcasterFrame") || connectors[0];
  }, [isBaseApp, connectors]);

  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  // Try auto-connect on mount
  useEffect(() => {
    if (autoConnectAttempted || isConnected) return;
    if (preferredConnector && !isConnecting && !isPending) {
      connect({ connector: preferredConnector });
    }
    const timer = setTimeout(() => setAutoConnectAttempted(true), 1500);
    return () => clearTimeout(timer);
  }, [
    autoConnectAttempted,
    isConnected,
    isConnecting,
    isPending,
    connect,
    preferredConnector,
  ]);

  // Show manual button after 3 seconds if not connected
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) setShowButton(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  // Notify parent when wallet connects
  useEffect(() => {
    if (isConnected) onConnected();
  }, [isConnected, onConnected]);

  const handleConnect = useCallback(() => {
    if (!preferredConnector || isConnected) return;
    setIsManualConnecting(true);
    connect(
      { connector: preferredConnector },
      {
        onSuccess: () => setIsManualConnecting(false),
        onError: () => setIsManualConnecting(false),
      }
    );
  }, [connect, preferredConnector, isConnected]);

  // SDK loading state
  if (!isSDKLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vintage-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auto-connecting spinner
  if (!showButton && (!autoConnectAttempted || isConnecting || isPending)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-vintage-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-vintage-black/70 text-sm font-bold tracking-widest">
            CONNECTING...
          </p>
        </div>
      </div>
    );
  }

  // Manual connect screen
  return (
    <div className="flex-1 flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-vintage-black font-bold text-4xl text-center mb-3 tracking-wide">
          Easter Egg Mint
        </h1>
        <p className="text-vintage-black/60 text-center text-base mb-10">
          Generate a unique egg from your PFP
        </p>

        {context?.user && (
          <p className="text-vintage-black/40 text-sm mb-6">
            @{context.user.username}
          </p>
        )}
      </div>

      {/* Connect button */}
      <div className="w-full pb-6">
        <button
          onClick={handleConnect}
          disabled={isManualConnecting}
          className="w-full py-4 border-2 border-vintage-black bg-vintage-black text-paper font-bold text-lg tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isManualConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              CONNECTING...
            </>
          ) : (
            "CONNECT WALLET"
          )}
        </button>
      </div>
    </div>
  );
}
