"use client";

import { useState } from "react";
import Image from "next/image";
import { useApostlesContract } from "~/hooks/useApostlesContract";
import { useMintPrice } from "~/hooks/useMint";

interface MintScreenProps {
  isVisible: boolean;
  onMint: (quantity: number) => void;
  onSignIn?: () => Promise<boolean>;
  walletAddress?: string;
  isMinting?: boolean;
  isEligible?: boolean | null;
  neynarScore?: number | null;
  mintError?: string | null;
}

/**
 * Truncate wallet address to 0x1234...7890 format
 */
function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format price for display
 */
function formatPrice(priceEth: number, quantity: number = 1): string {
  const total = priceEth * quantity;
  if (total === 0) return "Free";
  return `${total.toFixed(4)} ETH`;
}

/**
 * MintScreen component - The Apostles NFT mint page
 */
export function MintScreen({
  isVisible,
  onMint,
  onSignIn,
  walletAddress,
  isMinting = false,
  isEligible,
  neynarScore: _neynarScore,
  mintError,
}: MintScreenProps) {
  const [quantity, setQuantity] = useState(1);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Get contract data
  const { remaining, isLoading: isContractLoading } = useApostlesContract();

  // Get price from contract
  const { priceEth } = useMintPrice();

  if (!isVisible) return null;

  const handleQuantityMinus = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityPlus = () => {
    setQuantity((prev) => Math.min(10, prev + 1));
  };

  const handleSignIn = async () => {
    if (!onSignIn) return;
    setIsSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleMintClick = () => {
    if (!walletAddress && onSignIn) {
      handleSignIn();
      return;
    }
    onMint(quantity);
  };

  const isLoading = isContractLoading;
  const isSoldOut = remaining === 0;
  const needsSignIn = !walletAddress;
  const notEligible = isEligible === false;
  const canMint = !isLoading && !isSoldOut && !isMinting && !isSigningIn && !notEligible;

  // Determine button text
  const getButtonText = () => {
    if (isSigningIn) return "SIGNING IN...";
    if (isMinting) return "MINTING...";
    if (isSoldOut) return "SOLD OUT";
    if (needsSignIn) return "SIGN IN TO MINT";
    if (notEligible) return "NOT ELIGIBLE";
    return "MINT NOW";
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat animate-fade-in relative overflow-hidden"
      style={{
        backgroundImage: "url('/assets/bg-image.png')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-8 pb-6 px-4 gap-6">
        
        {/* Wallet Address - Top Right with gold background */}
        {walletAddress && (
          <div 
            className="absolute top-6 right-6 px-4 py-2 text-black font-medium text-[14px]"
            style={{
              backgroundColor: "#FFD700",
              borderRadius: "10px",
            }}
          >
            {truncateAddress(walletAddress)}
          </div>
        )}

        {/* Card Display - Three cards with tilt */}
        <div className="flex items-center justify-center mt-16 w-full relative h-[280px]">
          {/* Left Card - Tilted -8° with 60% opacity, partially off-screen */}
          <div
            className="absolute"
            style={{
              left: "-80px",  // Adjust this: more negative = more off-screen
              width: "180px",
              height: "240px",
              transform: "rotate(-8deg)",  // Adjust tilt: -5deg to -15deg
              opacity: 0.6,  // Adjust opacity: 0.4 to 0.8
              zIndex: 1,
            }}
          >
            <div 
              className="w-full h-full rounded-[24px] overflow-hidden"
              style={{
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              }}
            >
              <Image
                src="/assets/mint/right.png"
                alt="Apostle Preview"
                width={199}
                height={257}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Center Card - Main mint image */}
          <div
            className="relative z-10"
            style={{
              width: "220px",
              height: "300px",
            }}
          >
            <div 
              className="w-full h-full rounded-[24px] overflow-hidden"
              style={{
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
              }}
            >
              <Image
                src="/assets/mint/mint.png"
                alt="The Apostle - Mint"
                width={220}
                height={300}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* Right Card - Tilted +8° with 60% opacity, partially off-screen */}
          <div
            className="absolute"
            style={{
              right: "-80px",  // Adjust this: more negative = more off-screen
              width: "180px",
              height: "240px",
              transform: "rotate(8deg)",  // Adjust tilt: 5deg to 15deg
              opacity: 0.6,  // Adjust opacity: 0.4 to 0.8
              zIndex: 1,
            }}
          >
            <div 
              className="w-full h-full rounded-[24px] overflow-hidden"
              style={{
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              }}
            >
              <Image
                src="/assets/mint/right.png"
                alt="Apostle Preview"
                width={180}
                height={240}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full max-w-[500px] bg-black/60 backdrop-blur-sm rounded-lg overflow-hidden mt-4">
          {/* Remaining Row */}
          <div className="flex justify-between items-center py-4 px-5 border-b border-gold/30">
            <span className="text-gold font-normal text-[15px] italic">Remaining</span>
            <span className="text-gold font-normal text-[15px]">
              {isLoading ? "..." : remaining ?? "—"}
            </span>
          </div>

          {/* Price Row */}
          <div className="flex justify-between items-center py-4 px-5 border-b border-gold/30">
            <span className="text-gold font-normal text-[15px] italic">Price</span>
            <span className="text-gold font-normal text-[15px]">
              {formatPrice(priceEth, quantity)}
            </span>
          </div>

          {/* Quantity Row */}
          <div className="flex justify-between items-center py-4 px-5">
            <span className="text-gold font-normal text-[15px] italic">Quantity</span>
            <div className="flex items-center gap-6">
              <button
                onClick={handleQuantityPlus}
                className="text-gold font-normal text-[20px] hover:opacity-70 transition-opacity"
              >
                +
              </button>
              <span className="text-gold font-normal text-[15px] min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={handleQuantityMinus}
                className="text-gold font-normal text-[20px] hover:opacity-70 transition-opacity"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {mintError && (
          <div className="w-full max-w-[500px] bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
            {mintError}
          </div>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMintClick}
          disabled={!canMint}
          className={`w-full max-w-[500px] py-5 px-8 rounded-lg text-xl font-bold font-cinzel tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            notEligible
              ? "bg-red-500/50 text-white"
              : "bg-gold text-black hover:bg-gold-bright"
          }`}
          style={{ boxShadow: notEligible ? "none" : "0 8px 24px rgba(255, 215, 0, 0.4)" }}
        >
          {getButtonText()}
        </button>

      </div>
    </div>
  );
}
