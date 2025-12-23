"use client";

import Image from "next/image";

interface MintingScreenProps {
  isVisible: boolean;
}

/**
 * MintingScreen component - Loading overlay shown during minting
 */
export function MintingScreen({ isVisible }: MintingScreenProps) {
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
      </div>
    </div>
  );
}
