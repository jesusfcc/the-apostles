"use client";

import { useState, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import { useAccount } from "wagmi";
import type { EggTraits } from "~/lib/traits";

type LoadingPhase = "idle" | "extracting" | "generating";

interface GenerateScreenProps {
  onGenerated: (traits: EggTraits, imageBase64: string) => void;
  onError: (msg: string) => void;
}

export default function GenerateScreen({
  onGenerated,
  onError,
}: GenerateScreenProps) {
  const { context } = useMiniApp();
  const { address } = useAccount();

  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const user = context?.user;
  const pfpUrl = user?.pfpUrl;
  const displayName = user?.displayName || user?.username || "Anonymous";
  const fid = user?.fid;

  const handleGenerate = useCallback(async () => {
    if (!pfpUrl || !fid) {
      onError("Could not find your profile. Please try again.");
      return;
    }

    setErrorMsg(null);

    try {
      // Phase 1: Extract traits from PFP
      setLoadingPhase("extracting");
      const traitRes = await fetch("/api/extract-traits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pfpUrl, fid }),
      });

      if (!traitRes.ok) {
        const err = await traitRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze your PFP");
      }

      const { traits } = (await traitRes.json()) as { traits: EggTraits };

      // Phase 2: Generate egg image
      setLoadingPhase("generating");
      const eggRes = await fetch("/api/generate-egg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, traits }),
      });

      if (!eggRes.ok) {
        const err = await eggRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate your egg");
      }

      const { imageBase64 } = (await eggRes.json()) as {
        imageBase64: string;
      };

      onGenerated(traits, imageBase64);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      onError(msg);
    } finally {
      setLoadingPhase("idle");
    }
  }, [pfpUrl, fid, onGenerated, onError]);

  const isLoading = loadingPhase !== "idle";

  const loadingText =
    loadingPhase === "extracting"
      ? "Analyzing your PFP..."
      : loadingPhase === "generating"
        ? "Creating your egg..."
        : "";

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* User PFP */}
      <div className="mb-4">
        {pfpUrl ? (
          <img
            src={pfpUrl}
            alt={displayName}
            className="w-[120px] h-[120px] rounded-full border-2 border-vintage-black object-cover"
          />
        ) : (
          <div className="w-[120px] h-[120px] rounded-full border-2 border-vintage-black bg-vintage-black/10 flex items-center justify-center">
            <span className="text-vintage-black/40 text-3xl">?</span>
          </div>
        )}
      </div>

      {/* Username */}
      <p className="text-vintage-black font-bold text-lg mb-1">
        {displayName}
      </p>
      {user?.username && (
        <p className="text-vintage-black/50 text-sm mb-8">
          @{user.username}
        </p>
      )}

      {/* Line divider */}
      <div className="w-full flex justify-center mb-8">
        <img src="/assets/Line15.png" alt="" className="w-24 h-auto" />
      </div>

      {/* Generate button or loading state */}
      <div className="w-full max-w-xs">
        {isLoading ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-8 h-8 border-2 border-vintage-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-vintage-black/70 text-sm font-bold tracking-widest">
              {loadingText}
            </p>
          </div>
        ) : errorMsg ? (
          <div className="text-center space-y-4">
            <p className="text-error text-sm">{errorMsg}</p>
            <button
              onClick={() => {
                setErrorMsg(null);
                handleGenerate();
              }}
              className="w-full py-4 border-2 border-vintage-black bg-paper text-vintage-black font-bold text-lg tracking-widest"
            >
              TRY AGAIN
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!pfpUrl || !fid}
            className="w-full py-4 border-2 border-vintage-black bg-vintage-black text-paper font-bold text-lg tracking-widest disabled:opacity-50"
          >
            GENERATE YOUR EGG
          </button>
        )}
      </div>

      {/* Wallet address hint */}
      {address && (
        <p className="text-vintage-black/30 text-xs mt-6 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}
    </div>
  );
}
