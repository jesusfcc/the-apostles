"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMintEgg } from "~/hooks/useMintEgg";
import type { EggTraits } from "~/lib/traits";

type MintPhase = "uploading" | "wallet" | "confirming";

interface MintScreenProps {
  imageBase64: string;
  traits: EggTraits;
  fid: number;
  onMetadataUploaded: (tokenURI: string, imageURI: string) => void;
  onMinted: (txHash: string) => void;
  onError: (msg: string) => void;
}

const PHASE_LABELS: Record<MintPhase, string> = {
  uploading: "Uploading to Arweave...",
  wallet: "Waiting for wallet...",
  confirming: "Confirming on-chain...",
};

const PHASES: MintPhase[] = ["uploading", "wallet", "confirming"];

export default function MintScreen({
  imageBase64,
  traits,
  fid,
  onMetadataUploaded,
  onMinted,
  onError,
}: MintScreenProps) {
  const { mint, isPending, isConfirming, isSuccess, isError, error, txHash, reset: resetMint } =
    useMintEgg();

  const [phase, setPhase] = useState<MintPhase>("uploading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);
  const mintCalledRef = useRef(false);

  // Store metadata URIs locally so we can retry without re-uploading
  const [storedTokenURI, setStoredTokenURI] = useState<string | null>(null);
  const [storedImageURI, setStoredImageURI] = useState<string | null>(null);

  const runMintFlow = useCallback(async () => {
    setErrorMsg(null);
    mintCalledRef.current = false;

    try {
      let tokenURI = storedTokenURI;
      let imageURI = storedImageURI;

      // Phase 1: Upload metadata (skip if already uploaded)
      if (!tokenURI || !imageURI) {
        setPhase("uploading");
        const res = await fetch("/api/upload-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, traits, fid }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to upload metadata");
        }

        const result = (await res.json()) as {
          tokenURI: string;
          imageURI: string;
        };
        tokenURI = result.tokenURI;
        imageURI = result.imageURI;
        setStoredTokenURI(tokenURI);
        setStoredImageURI(imageURI);
        onMetadataUploaded(tokenURI, imageURI);
      }

      // Phase 2: Call mint (triggers wallet popup)
      setPhase("wallet");
      mintCalledRef.current = true;
      await mint(tokenURI);

      // Phase 3 is handled reactively via isConfirming/isSuccess
      setPhase("confirming");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Minting failed";
      setErrorMsg(msg);
    }
  }, [imageBase64, traits, fid, mint, onMetadataUploaded, storedTokenURI, storedImageURI]);

  // Auto-start on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      runMintFlow();
    }
  }, [runMintFlow]);

  // Watch for confirmation success
  useEffect(() => {
    if (isSuccess && txHash && mintCalledRef.current) {
      onMinted(txHash);
    }
  }, [isSuccess, txHash, onMinted]);

  // Watch for contract errors
  useEffect(() => {
    if (isError && error && mintCalledRef.current) {
      setErrorMsg(error.message || "Transaction failed");
    }
  }, [isError, error]);

  const handleRetry = useCallback(() => {
    resetMint();
    startedRef.current = false;
    mintCalledRef.current = false;
    // Allow re-start
    setTimeout(() => {
      startedRef.current = true;
      runMintFlow();
    }, 100);
  }, [resetMint, runMintFlow]);

  // Error state
  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 max-w-xs">
          <p className="text-error text-sm">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="w-full py-4 border-2 border-vintage-black bg-paper text-vintage-black font-bold text-lg tracking-widest"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  const currentPhaseIndex = PHASES.indexOf(phase);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        {/* Phase stepper */}
        <div className="flex items-center justify-center gap-2">
          {PHASES.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full border border-vintage-black transition-colors ${
                  i <= currentPhaseIndex
                    ? "bg-vintage-black"
                    : "bg-transparent"
                }`}
              />
              {i < PHASES.length - 1 && (
                <div
                  className={`w-8 h-[2px] transition-colors ${
                    i < currentPhaseIndex
                      ? "bg-vintage-black"
                      : "bg-vintage-black/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Spinner */}
        <div className="w-8 h-8 border-2 border-vintage-black border-t-transparent rounded-full animate-spin mx-auto" />

        {/* Phase text */}
        <p className="text-vintage-black/70 text-sm font-bold tracking-widest">
          {PHASE_LABELS[phase]}
        </p>
      </div>
    </div>
  );
}
