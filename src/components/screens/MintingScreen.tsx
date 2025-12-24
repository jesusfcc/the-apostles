"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface MintingScreenProps {
  isVisible: boolean;
  onCancel?: () => void;
}

/**
 * MintingScreen component - Loading overlay shown during minting
 */
export function MintingScreen({ isVisible, onCancel }: MintingScreenProps) {
  const [showCancelButton, setShowCancelButton] = useState(false);

  // Show cancel button after 10 seconds
  useEffect(() => {
    if (!isVisible) {
      setShowCancelButton(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowCancelButton(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/bg-image.png')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 text-center">
        <Image
          src="/assets/apostles-pixel.png"
          alt="The Apostles"
          width={240}
          height={240}
          className="mx-auto mb-6 max-w-[60vw] h-auto animate-pulse-logo"
          style={{ imageRendering: 'pixelated' }}
        />
        <p className="text-gold text-2xl font-semibold font-cinzel">Minting...</p>

        {/* Cancel button - appears after 10 seconds */}
        {showCancelButton && onCancel && (
          <div className="mt-8 animate-fade-in">
            <p className="text-gray-400 text-sm mb-3">Taking too long?</p>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              Go Back & Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
