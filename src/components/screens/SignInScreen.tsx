"use client";

import Image from "next/image";

interface SignInScreenProps {
  isVisible: boolean;
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
}

/**
 * SignInScreen - Shown before mint if user is not signed in
 */
export function SignInScreen({ isVisible, onSignIn, isSigningIn }: SignInScreenProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden">
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
      </div>

      {/* Sign In Button - Fixed at bottom */}
      <div className="relative z-10 w-full px-6 pb-8">
        <button
          onClick={onSignIn}
          disabled={isSigningIn}
          className="w-full py-5 px-8 rounded-lg text-xl font-bold font-cinzel tracking-wider transition-all bg-gold text-black hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 8px 24px rgba(255, 215, 0, 0.4)" }}
        >
          {isSigningIn ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </div>
    </div>
  );
}
