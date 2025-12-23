"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import Image from "next/image";
import { useFarcaster } from "../providers/FarcasterProvider";
import sdk from "@farcaster/miniapp-sdk";

interface SignInScreenProps {
  onConnected?: () => void;
}

/**
 * SignInScreen - Self-contained sign-in with auto-connect and Farcaster wallet
 */
export function SignInScreen({ onConnected }: SignInScreenProps) {
  const { user, isLoading: isFarcasterLoading, safeAreaInsets } = useFarcaster();
  const { isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  // Auto-connect attempt on mount
  useEffect(() => {
    if (autoConnectAttempted || isConnected || isConnecting || isPending) return;

    // Try auto-connect with Farcaster connector
    const farcasterConnector = connectors[0];
    if (farcasterConnector) {
      console.log("[SignIn] Attempting auto-connect...");
      connect({ connector: farcasterConnector });
    }

    // Mark as attempted after a short delay
    const timer = setTimeout(() => setAutoConnectAttempted(true), 1500);
    return () => clearTimeout(timer);
  }, [autoConnectAttempted, isConnected, isConnecting, isPending, connect, connectors]);

  // Watch for connection success
  useEffect(() => {
    if (isConnected) {
      console.log("[SignIn] Wallet connected!");
      onConnected?.();
    }
  }, [isConnected, onConnected]);

  /**
   * Handle sign in - connects with Farcaster wallet
   */
  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);

    try {
      // Try using SDK signIn first for proper authentication
      const nonce = Math.random().toString(36).substring(2, 15);
      await sdk.actions.signIn({ nonce, acceptAuthAddress: true });

      // Then connect the wallet
      const farcasterConnector = connectors[0];
      if (farcasterConnector && !isConnected) {
        connect({ connector: farcasterConnector });
      }
    } catch (err) {
      console.log("[SignIn] SDK signIn not available, using direct connect", err);
      // Fallback: just connect the wallet directly
      const farcasterConnector = connectors[0];
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [connect, connectors, isConnected]);

  // Still loading Farcaster SDK
  if (isFarcasterLoading) {
    return (
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center"
        style={{
          paddingTop: safeAreaInsets?.top ?? 0,
          paddingLeft: safeAreaInsets?.left ?? 0,
          paddingRight: safeAreaInsets?.right ?? 0,
        }}
      >
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auto-connecting...
  if (!autoConnectAttempted || isConnecting || isPending) {
    return (
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center"
        style={{
          paddingTop: safeAreaInsets?.top ?? 0,
          paddingLeft: safeAreaInsets?.left ?? 0,
          paddingRight: safeAreaInsets?.right ?? 0,
        }}
      >
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gold/70 text-sm">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  // Show Sign In button
  return (
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden"
      style={{
        paddingTop: safeAreaInsets?.top ?? 0,
        paddingLeft: safeAreaInsets?.left ?? 0,
        paddingRight: safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/assets/bg-image.png')" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
        {/* Logo/Image */}
        <div className="mb-8">
          <Image
            src="/splash.png"
            alt="The Apostles"
            width={200}
            height={200}
            className="rounded-2xl"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-gold font-cinzel text-3xl font-bold mb-4 text-center">
          The Apostles
        </h1>

        {/* Subtitle */}
        <p className="text-gold/70 text-center text-lg mb-12 max-w-sm">
          Sign in to join the gathering and mint your Apostle
        </p>

        {/* User info if available */}
        {user && (
          <p className="text-gold/50 text-sm mb-4">
            Welcome, @{user.username}
          </p>
        )}
      </div>

      {/* Sign In Button - Fixed at bottom */}
      <div className="relative z-10 w-full px-6 pb-8">
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full py-5 px-8 rounded-lg text-xl font-bold font-cinzel tracking-wider transition-all bg-gold text-black hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ boxShadow: "0 8px 24px rgba(255, 215, 0, 0.4)" }}
        >
          {isSigningIn ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              SIGNING IN...
            </>
          ) : (
            "SIGN IN"
          )}
        </button>
      </div>
    </div>
  );
}
