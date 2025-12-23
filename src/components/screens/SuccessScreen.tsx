"use client";

import { useState, useEffect } from "react";
import { MintedNFT } from "~/hooks/useMintedNFT";

interface SuccessScreenProps {
  isVisible: boolean;
  onBack: () => void;
  onMintAnother: () => void;
  onShare: (tokenId?: number) => void;
  // Legacy single NFT props
  mintedImage?: string | null;
  tokenId?: number;
  description?: string;
  isLoadingNFT?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  // New: array of minted NFTs
  mintedNFTs?: MintedNFT[];
}

/**
 * Single NFT Card component
 */
function NFTCard({ 
  nft, 
  isSelected, 
  onClick 
}: { 
  nft: MintedNFT; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-[120px] aspect-[3/4] rounded-xl overflow-hidden transition-all ${
        isSelected 
          ? "ring-2 ring-gold scale-105" 
          : "opacity-70 hover:opacity-100"
      }`}
      style={{ boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)" }}
    >
      {nft.isLoading ? (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : nft.imageUrl ? (
        <>
          <img
            src={nft.imageUrl}
            alt={nft.metadata?.name || `Apostle #${nft.tokenId}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <span className="text-white text-xs font-medium">#{nft.tokenId}</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-gold/50 text-sm">#{nft.tokenId}</span>
        </div>
      )}
    </button>
  );
}

/**
 * SuccessScreen component - Shown after successful mint
 * Supports displaying multiple minted NFTs with scroll
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
  error = null,
  onRetry,
  mintedNFTs = [],
}: SuccessScreenProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedNFTIndex, setSelectedNFTIndex] = useState(0);
  const [shareCooldown, setShareCooldown] = useState(6); // 6 second cooldown
  
  // Share cooldown timer - starts when component becomes visible
  useEffect(() => {
    if (!isVisible) {
      setShareCooldown(6); // Reset when hidden
      return;
    }
    
    if (shareCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setShareCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible, shareCooldown]);
  
  if (!isVisible) return null;

  // Determine if we have multiple NFTs
  const hasMultipleNFTs = mintedNFTs.length > 1;
  const selectedNFT = mintedNFTs[selectedNFTIndex];
  
  // Use selected NFT data if available, otherwise fall back to legacy props
  const displayImage = selectedNFT?.imageUrl ?? mintedImage;
  const displayTokenId = selectedNFT?.tokenId ?? tokenId;
  const displayDescription = selectedNFT?.metadata?.description ?? description;
  const isLoading = selectedNFT?.isLoading ?? (isLoadingNFT && !error);
  const hasError = !!error;
  
  // Truncate description to ~100 characters
  const MAX_LENGTH = 100;
  const shouldTruncate = displayDescription.length > MAX_LENGTH;
  const truncatedDescription = isDescriptionExpanded || !shouldTruncate 
    ? displayDescription 
    : displayDescription.slice(0, MAX_LENGTH).trim() + "...";

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
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-8 pb-6 px-6 gap-4 overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white p-2 hover:-translate-x-1 transition-transform z-20"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Multiple NFTs Header */}
        {hasMultipleNFTs && (
          <div className="text-center mt-8">
            <h1 className="font-cinzel text-2xl font-bold text-gold">
              {mintedNFTs.length} Apostles Minted!
            </h1>
            <p className="text-gray-400 text-sm mt-1">Scroll to see all your NFTs</p>
          </div>
        )}

        {/* Main NFT Display (Selected) */}
        <div className={`w-full max-w-[170px] ${hasMultipleNFTs ? "mt-4" : "mt-12"}`}>
          <div
            className="w-full aspect-[3/4] rounded-2xl overflow-hidden animate-scale-in flex items-center justify-center"
            style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)", backgroundColor: (isLoading || hasError || !displayImage) ? "rgba(0,0,0,0.4)" : undefined }}
          >
            {hasError ? (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-red-400 text-xs">Failed to load image</span>
                {onRetry && (
                  <button 
                    onClick={onRetry}
                    className="text-gold text-xs underline hover:text-gold-bright"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : isLoading || !displayImage ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-gold text-sm">Loading NFT...</span>
              </div>
            ) : (
              <img
                src={displayImage}
                alt={`The Apostle #${displayTokenId}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* NFT Thumbnails - Horizontal scroll */}
        {hasMultipleNFTs && (
          <div className="w-full max-w-[500px] overflow-x-auto pb-2">
            <div className="flex gap-3 px-2 min-w-min">
              {mintedNFTs.map((nft, index) => (
                <NFTCard
                  key={nft.tokenId}
                  nft={nft}
                  isSelected={index === selectedNFTIndex}
                  onClick={() => setSelectedNFTIndex(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success Info */}
        <div className="w-full max-w-[500px] text-left">
          <h2 className="font-cinzel text-xl font-bold text-white mb-2">
            {displayTokenId ? `The Apostle #${displayTokenId}` : (isLoading ? "Loading..." : "Mint Successful!")}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {truncatedDescription}
            {shouldTruncate && (
              <span 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-gold font-semibold cursor-pointer ml-1 hover:text-gold-bright transition-colors"
              >
                {isDescriptionExpanded ? "show less" : "show more..."}
              </span>
            )}
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={() => onShare(displayTokenId)}
          disabled={isLoading || shareCooldown > 0 || !displayTokenId}
          className="w-full max-w-[500px] bg-gold text-black py-3 px-8 rounded-lg text-lg font-bold hover:bg-gold-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)" }}
        >
          {shareCooldown > 0 ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Share in {shareCooldown}s</span>
            </>
          ) : (
            "Share On Farcaster"
          )}
        </button>

        {/* Mint Another Button */}
        <button
          onClick={onMintAnother}
          className="w-full max-w-[500px] bg-transparent border-[3px] border-gold text-gold py-3 px-8 rounded-lg text-lg font-bold hover:bg-gold hover:text-black transition-all"
        >
          Mint Another
        </button>
      </div>
    </div>
  );
}
