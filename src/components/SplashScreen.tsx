"use client";

import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
  isFadingOut: boolean;
}

/**
 * SplashScreen component - The Apostles loading screen
 */
export function SplashScreen({ isVisible, isFadingOut }: SplashScreenProps) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black ${
        isFadingOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div className="text-center">
        <Image
          src="/assets/apostles-pixel.png"
          alt="The Apostles"
          width={320}
          height={320}
          priority
          className="mx-auto mb-6 max-w-[80vw] h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
        <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-wide lowercase">
          The Apostles
        </h1>
      </div>
    </div>
  );
}
