"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, X } from "lucide-react";
import { useApostlesContract } from "~/hooks/useApostlesContract";
import { useMintPrice } from "~/hooks/useMint";
import { useOwnedNFTs, OwnedNFT } from "~/hooks/useOwnedNFTs";

interface MintScreenProps {
  isVisible: boolean;
  onMint: (quantity: number) => void;
  onSignIn?: () => Promise<boolean>;
  walletAddress?: string;
  isMinting?: boolean;
  isEligible?: boolean | null;
  neynarScore?: number | null;
  mintError?: string | null;
  // Farcaster user info
  userPfp?: string;
  userName?: string;
  userDisplayName?: string;
  // Share handler
  onShareNFT?: (tokenId: number) => void;
}

/**
 * Truncate wallet address to 0x1234...7890 format
 */
function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * NFT Detail Modal
 */
function NFTDetailModal({
  nft,
  onClose,
  onShare,
}: {
  nft: OwnedNFT;
  onClose: () => void;
  onShare: (tokenId: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-[340px] bg-[#1a1a1a] rounded-2xl overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Share Button on Image */}
        <button
          onClick={() => onShare(nft.tokenId)}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <Share2 size={20} />
        </button>

        {/* NFT Image */}
        <div className="w-full aspect-square relative">
          {nft.isLoading || !nft.imageUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40">
              <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <img
              src={nft.imageUrl}
              alt={nft.metadata?.name || `Apostle #${nft.tokenId}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* NFT Info */}
        <div className="p-5">
          <h2 className="font-cinzel text-xl font-bold text-gold mb-2">
            {nft.metadata?.name || `The Apostle #${nft.tokenId}`}
          </h2>
          {nft.metadata?.description && (
            <p className="text-gray-400 text-sm line-clamp-3 mb-4">
              {nft.metadata.description}
            </p>
          )}

          {/* Share Button */}
          <button
            onClick={() => onShare(nft.tokenId)}
            className="w-full bg-gold text-black py-3 px-6 rounded-lg font-bold hover:bg-gold-bright transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: "0 4px 16px rgba(255, 215, 0, 0.3)" }}
          >
            <Share2 size={18} />
            Share on Farcaster
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Gallery Tab Content
 */
function GalleryContent({
  walletAddress,
  userPfp,
  userName,
  userDisplayName,
  onShareNFT,
}: {
  walletAddress?: string;
  userPfp?: string;
  userName?: string;
  userDisplayName?: string;
  onShareNFT?: (tokenId: number) => void;
}) {
  const { ownedNFTs, isLoading } = useOwnedNFTs(walletAddress);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);

  const handleShare = (tokenId: number) => {
    onShareNFT?.(tokenId);
    setSelectedNFT(null);
  };

  return (
    <>
      {/* User Profile Section */}
      <div className="flex items-center gap-3 w-full max-w-[500px] mb-6">
        {/* Profile Picture */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gold/20 flex-shrink-0">
          {userPfp ? (
            <img src={userPfp} alt={userName || "Profile"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold text-lg font-bold">
              {userName?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate">
            {userDisplayName || userName || "Anonymous"}
          </span>
          {walletAddress && (
            <span className="text-gray-400 text-sm">{truncateAddress(walletAddress)}</span>
          )}
        </div>
      </div>

      {/* NFT Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-gold">Loading your Apostles...</span>
        </div>
      ) : ownedNFTs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-gold font-cinzel text-xl mb-2">No Apostles Yet</h3>
          <p className="text-gray-400 text-sm">Mint your first Apostle to see it here</p>
        </div>
      ) : (
        <div className="w-full max-w-[500px] grid grid-cols-2 gap-3 pb-6">
          {ownedNFTs.map((nft) => (
            <button
              key={nft.tokenId}
              onClick={() => setSelectedNFT(nft)}
              className="aspect-square rounded-xl overflow-hidden bg-black/40 hover:ring-2 hover:ring-gold transition-all relative"
            >
              {nft.isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide broken image, show placeholder
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold/50">
                  <span className="text-4xl">🎭</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onShare={handleShare}
        />
      )}
    </>
  );
}

/**
 * Mint Tab Content
 */
function MintContent({
  onMint,
  onSignIn,
  walletAddress,
  isMinting,
  isEligible,
  mintError,
}: {
  onMint: (quantity: number) => void;
  onSignIn?: () => Promise<boolean>;
  walletAddress?: string;
  isMinting: boolean;
  isEligible?: boolean | null;
  mintError?: string | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { remaining, isLoading: isContractLoading } = useApostlesContract();
  const { priceEth } = useMintPrice();

  // Calculate total price based on quantity
  const totalPriceEth = (priceEth * quantity).toFixed(4);

  const handleQuantityMinus = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleQuantityPlus = () => setQuantity((prev) => Math.min(10, prev + 1));

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

  const getButtonText = () => {
    if (isSigningIn) return "SIGNING IN...";
    if (isMinting) return "MINTING...";
    if (isSoldOut) return "SOLD OUT";
    if (needsSignIn) return "SIGN IN TO MINT";
    if (notEligible) return "NOT ELIGIBLE";
    return `MINT NOW · ${totalPriceEth} ETH`;
  };

  return (
    <>
      {/* Card Display */}
      <div className="flex items-center justify-center w-full relative h-[280px]">
        {/* Left Card */}
        <div
          className="absolute"
          style={{
            left: "-80px",
            width: "180px",
            height: "240px",
            transform: "rotate(-8deg)",
            opacity: 0.6,
            zIndex: 1,
          }}
        >
          <div
            className="w-full h-full rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)" }}
          >
            <Image
              src="/assets/mint/1.png"
              alt="Apostle Preview"
              width={199}
              height={257}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Center Card */}
        <div className="relative z-10" style={{ width: "220px", height: "300px" }}>
          <div
            className="w-full h-full rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)" }}
          >
            <Image
              src="/assets/mint/2.png"
              alt="The Apostle - Mint"
              width={220}
              height={300}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Right Card */}
        <div
          className="absolute"
          style={{
            right: "-80px",
            width: "180px",
            height: "240px",
            transform: "rotate(8deg)",
            opacity: 0.6,
            zIndex: 1,
          }}
        >
          <div
            className="w-full h-full rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)" }}
          >
            <Image
              src="/assets/mint/3.png"
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
        <div className="flex justify-between items-center py-4 px-5 border-b border-gold/30">
          <span className="text-gold font-normal text-[15px] italic">Remaining</span>
          <span className="text-gold font-normal text-[15px]">
            {isLoading ? "..." : `${remaining ?? "—"}/2525`}
          </span>
        </div>

        <div className="flex justify-between items-center py-4 px-5 border-b border-gold/30">
          <span className="text-gold font-normal text-[15px] italic">Price</span>
          <span className="text-gold font-normal text-[15px]">20 silver coins</span>
        </div>

        <div className="flex justify-between items-center py-4 px-5">
          <span className="text-gold font-normal text-[15px] italic">Quantity</span>
          <div className="flex items-center gap-6">
            <button
              onClick={handleQuantityMinus}
              className="text-gold font-normal text-[20px] hover:opacity-70 transition-opacity"
            >
              -
            </button>
            <span className="text-gold font-normal text-[15px] min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={handleQuantityPlus}
              className="text-gold font-normal text-[20px] hover:opacity-70 transition-opacity"
            >
              +
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
          notEligible ? "bg-red-500/50 text-white" : "bg-gold text-black hover:bg-gold-bright"
        }`}
        style={{ boxShadow: notEligible ? "none" : "0 8px 24px rgba(255, 215, 0, 0.4)" }}
      >
        {getButtonText()}
      </button>
    </>
  );
}

/**
 * MintScreen component - The Apostles NFT mint page with Gallery
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
  userPfp,
  userName,
  userDisplayName,
  onShareNFT,
}: MintScreenProps) {
  const [activeTab, setActiveTab] = useState<"mint" | "gallery">("mint");

  if (!isVisible) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat animate-fade-in relative overflow-hidden"
      style={{ backgroundImage: "url('/assets/bg-image.png')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-6 pb-6 px-4 gap-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1">
          <button
            onClick={() => setActiveTab("mint")}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === "mint"
                ? "bg-gold text-black"
                : "text-gold hover:bg-gold/10"
            }`}
          >
            Mint
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === "gallery"
                ? "bg-gold text-black"
                : "text-gold hover:bg-gold/10"
            }`}
          >
            Gallery
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "mint" ? (
          <MintContent
            onMint={onMint}
            onSignIn={onSignIn}
            walletAddress={walletAddress}
            isMinting={isMinting}
            isEligible={isEligible}
            mintError={mintError}
          />
        ) : (
          <GalleryContent
            walletAddress={walletAddress}
            userPfp={userPfp}
            userName={userName}
            userDisplayName={userDisplayName}
            onShareNFT={onShareNFT}
          />
        )}
      </div>
    </div>
  );
}
