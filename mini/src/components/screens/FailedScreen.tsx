"use client";

import Image from "next/image";

interface FailedScreenProps {
  isVisible: boolean;
  onRetry: () => void;
  errorMessage?: string | null;
}

/**
 * Parse error message and return user-friendly text
 */
function getReadableError(error?: string | null): string {
  if (!error) return "Something went wrong. Please try again.";

  const lowerError = error.toLowerCase();

  // Common ThirdWeb/contract errors
  if (lowerError.includes("already claimed") || lowerError.includes("exceeded max")) {
    return "You've already claimed your maximum allocation.";
  }
  if (lowerError.includes("quantity") && lowerError.includes("limit")) {
    return "You've reached the maximum mint limit per wallet.";
  }
  if (lowerError.includes("not enough") || lowerError.includes("insufficient")) {
    return "Insufficient funds to complete this transaction.";
  }
  if (lowerError.includes("sold out") || lowerError.includes("exceed max supply")) {
    return "Sorry, this collection is sold out!";
  }
  if (lowerError.includes("not started") || lowerError.includes("hasn't started")) {
    return "Minting hasn't started yet. Please check back later.";
  }
  if (lowerError.includes("ended") || lowerError.includes("expired")) {
    return "This minting phase has ended.";
  }
  if (lowerError.includes("allowlist") || lowerError.includes("not eligible")) {
    return "Your wallet is not on the allowlist for this phase.";
  }
  if (lowerError.includes("rejected") || lowerError.includes("denied")) {
    return "Transaction was rejected.";
  }
  if (lowerError.includes("reverted")) {
    return "Transaction failed. You may have already minted your allocation.";
  }

  // Truncate long error messages
  if (error.length > 100) {
    return error.slice(0, 100) + "...";
  }

  return error;
}

/**
 * FailedScreen component - Shown when minting fails
 */
export function FailedScreen({ isVisible, onRetry, errorMessage }: FailedScreenProps) {
  if (!isVisible) return null;

  const readableError = getReadableError(errorMessage);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in bg-cover bg-center bg-no-repeat px-6"
      style={{
        backgroundImage: "url('/assets/bg-image.png')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        <Image
          src="/assets/apostles-pixel.png"
          alt="The Apostles"
          width={240}
          height={240}
          className="mx-auto mb-6 max-w-[60vw] h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
        <p className="text-red-500 text-2xl font-bold font-cinzel mb-3">Minting failed</p>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {readableError}
        </p>
        <button
          onClick={onRetry}
          className="w-16 h-16 rounded-xl border-[3px] border-gold text-gold flex items-center justify-center mx-auto hover:bg-gold hover:text-black transition-all hover:rotate-180 hover:scale-110 duration-300"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
