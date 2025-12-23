"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useFarcaster } from "./providers/FarcasterProvider";
import { useMint } from "~/hooks/useMint";
import { useMintedNFT } from "~/hooks/useMintedNFT";
import { SplashScreen } from "./SplashScreen";
import { MintScreen, MintingScreen, FailedScreen, SuccessScreen } from "./screens";

export type AppScreen = "splash" | "mint" | "minting" | "failed" | "success";

export interface AppProps {
  title?: string;
}

/**
 * Main App component - The Apostles Mini App
 * 
 * Manages screen transitions between:
 * - Splash: Initial loading screen
 * - Mint: Main minting interface with carousel
 * - Minting: Loading overlay during mint transaction
 * - Failed: Error screen with retry option
 * - Success: Congratulations screen with share options
 */
export default function App({ title: _title }: AppProps = { title: "The Apostles" }) {
  // --- Farcaster Context ---
  const { isLoading: isFarcasterLoading, composeCast, signIn, user } = useFarcaster();

  // --- Wallet from wagmi ---
  const { address: walletAddress } = useAccount();

  // --- Mint hook (with FID for Neynar score check) ---
  const {
    mint,
    isLoading: isMintLoading,
    isConfirming,
    isSuccess: isMintSuccess,
    isError: isMintError,
    error: mintError,
    txHash,
    reset: resetMint,
    isEligible,
    checkingEligibility: _checkingEligibility,
    neynarScore,
  } = useMint(walletAddress, user?.fid);

  // --- Fetch minted NFT data ---
  const {
    tokenId: mintedTokenId,
    imageUrl: mintedImage,
    metadata: mintedMetadata,
    isLoading: isLoadingNFT,
  } = useMintedNFT(isMintSuccess ? txHash : undefined);

  // --- Screen State ---
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [isSplashFadingOut, setIsSplashFadingOut] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [_mintQuantity, setMintQuantity] = useState(1);

  // --- Splash screen timer ---
  useEffect(() => {
    if (!isFarcasterLoading) {
      // After 2.5 seconds, start fading out the splash screen
      const fadeOutTimer = setTimeout(() => {
        setIsSplashFadingOut(true);
      }, 2500);

      // After fade out animation completes (0.5s), hide splash and show mint
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        setCurrentScreen("mint");
      }, 3000);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isFarcasterLoading]);

  // --- Handle mint state changes ---
  useEffect(() => {
    if (isMintLoading || isConfirming) {
      setCurrentScreen("minting");
    }
  }, [isMintLoading, isConfirming]);

  useEffect(() => {
    // Show success screen once mint is confirmed (don't wait for NFT data)
    if (isMintSuccess && txHash) {
      setCurrentScreen("success");
    }
  }, [isMintSuccess, txHash]);

  useEffect(() => {
    const handleMintError = async () => {
      if (isMintError && mintError) {
        console.error("Mint error:", mintError);

        const errorMessage = mintError.message?.toLowerCase() || "";

        // Check if it's an eligibility error (Neynar score) - stay on mint screen
        if (errorMessage.includes("neynar score") || errorMessage.includes("eligib")) {
          console.log("Eligibility error - Neynar score too low");
          // Don't navigate to failed screen, let them see the error on mint screen
          return;
        }

        // Check if error is related to connection/authentication
        const isAuthError =
          errorMessage.includes("connector") ||
          errorMessage.includes("chainid") ||
          errorMessage.includes("connect") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("no wallet");

        if (isAuthError) {
          console.log("Auth-related error detected, attempting signIn...");
          const signedIn = await signIn();
          if (signedIn) {
            // Reset mint state and let user try again
            resetMint();
            return;
          }
        }

        setCurrentScreen("failed");
      }
    };

    handleMintError();
  }, [isMintError, mintError, signIn, resetMint]);

  // --- Handlers ---
  const handleMint = (quantity: number) => {
    setMintQuantity(quantity);
    mint(quantity);
  };

  const handleRetry = () => {
    resetMint();
    setCurrentScreen("mint");
  };

  const handleMintAnother = () => {
    resetMint();
    setCurrentScreen("mint");
  };

  const handleBack = () => {
    resetMint();
    setCurrentScreen("mint");
  };

  const handleShare = async () => {
    try {
      await composeCast({
        text: `I have secured my place among the 2525. I am now an Apostle, holding a claim to the Spirit $REDACTED.

Join the Gathering. The Miracle has begun`,
        embeds: ["https://apostle-mint.vercel.app"],
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // --- Show splash while loading ---
  if (isFarcasterLoading) {
    return <SplashScreen isVisible={true} isFadingOut={false} />;
  }

  // --- Render ---
  return (
    <>
      {/* Splash Screen */}
      <SplashScreen isVisible={showSplash} isFadingOut={isSplashFadingOut} />

      {/* Mint Screen */}
      <MintScreen
        isVisible={currentScreen === "mint"}
        onMint={handleMint}
        onSignIn={signIn}
        walletAddress={walletAddress}
        isMinting={isMintLoading || isConfirming}
        isEligible={isEligible}
        neynarScore={neynarScore}
        mintError={isMintError && mintError?.message?.includes("score") ? mintError.message : null}
      />

      {/* Minting Overlay */}
      <MintingScreen isVisible={currentScreen === "minting"} />

      {/* Failed Overlay */}
      <FailedScreen
        isVisible={currentScreen === "failed"}
        onRetry={handleRetry}
        errorMessage={mintError?.message}
      />

      {/* Success Screen */}
      <SuccessScreen
        isVisible={currentScreen === "success"}
        onBack={handleBack}
        onMintAnother={handleMintAnother}
        onShare={handleShare}
        mintedImage={mintedImage}
        tokenId={mintedTokenId || undefined}
        description={mintedMetadata?.description}
        isLoadingNFT={isLoadingNFT}
      />
    </>
  );
}
