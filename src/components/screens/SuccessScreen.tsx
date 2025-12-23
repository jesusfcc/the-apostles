"use client";

import Image from "next/image";

interface SuccessScreenProps {
  isVisible: boolean;
  onBack: () => void;
  onMintAnother: () => void;
  onShare: () => void;
  mintedImage?: string | null;
  tokenId?: number;
  description?: string;
  isLoadingNFT?: boolean;
}

/**
 * SuccessScreen component - Shown after successful mint
 */
export function SuccessScreen({
  isVisible,
  onBack,
  onMintAnother,
  onShare,
  mintedImage,
  tokenId,
  description = "Witness the convergence of history, mythology, and the divine. From the humble Apostles walking the earth to the thunderous Gods of Olympus",
  isLoadingNFT = false,
}: SuccessScreenProps) {
  if (!isVisible) return null;

  const isLoading = isLoadingNFT || !mintedImage;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat animate-fade-in relative"
      style={{
        backgroundImage: "url('/assets/bg-image.png')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-8 pb-6 px-6 gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white p-2 hover:-translate-x-1 transition-transform"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Success Card - Half size */}
        <div className="w-full max-w-[200px] mt-12">
          <div
            className="w-full aspect-[3/4] rounded-2xl overflow-hidden animate-scale-in flex items-center justify-center"
            style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)", backgroundColor: isLoading ? "rgba(0,0,0,0.4)" : undefined }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-gold text-sm">Loading NFT...</span>
              </div>
            ) : (
              <Image
                src={mintedImage}
                alt={`The Apostle #${tokenId}`}
                width={200}
                height={267}
                className="w-full h-full object-cover"
                priority
              />
            )}
          </div>
        </div>

        {/* Success Info */}
        <div className="w-full max-w-[500px] text-left">
          <h2 className="font-cinzel text-xl font-bold text-white mb-2">
            {isLoading ? "Loading..." : `The Apostle #${tokenId}`}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
            <span className="text-gold font-semibold cursor-pointer ml-1">
              show more...
            </span>
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={onShare}
          disabled={isLoading}
          className="w-full max-w-[500px] bg-gold text-black py-4 px-8 rounded-lg text-lg font-bold hover:bg-gold-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)" }}
        >
          Share On Farcaster
        </button>

        {/* Mint Another Button */}
        <button
          onClick={onMintAnother}
          className="w-full max-w-[500px] bg-transparent border-[3px] border-gold text-gold py-4 px-8 rounded-lg text-lg font-bold hover:bg-gold hover:text-black transition-all"
        >
          Mint Another
        </button>
      </div>
    </div>
  );
}
