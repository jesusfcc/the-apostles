"use client";

import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { base } from "wagmi/chains";
import {
  APOSTLES_CONTRACT_ADDRESS,
  APOSTLES_ABI,
  NATIVE_TOKEN_ADDRESS as _NATIVE_TOKEN_ADDRESS,
  EMPTY_ALLOWLIST_PROOF,
  type AllowlistProof,
} from "~/lib/contract";
import { useApostlesContract } from "./useApostlesContract";

interface EligibilityResponse {
  isEligible: boolean;
  score?: number;
  minScore?: number;
  error?: string;
  proof: string[];
  quantityLimitPerWallet: string;
  pricePerToken: string;
  currency: string;
}

interface UseMintResult {
  mint: (quantity: number) => void;
  isLoading: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  txHash: `0x${string}` | undefined;
  reset: () => void;
  isEligible: boolean | null;
  checkingEligibility: boolean;
  neynarScore: number | null;
}

/**
 * Hook for minting Apostles NFTs
 * Checks Neynar score >= 0.5 for eligibility (public mint)
 */
export function useMint(walletAddress: string | undefined, fid: number | undefined): UseMintResult {
  // Get price and supply info from contract
  const { priceWei, claimCondition, remaining } = useApostlesContract();
  const pricePerToken = priceWei ?? 0n;

  // Get user's current NFT balance for max-per-wallet check
  const { data: userBalance } = useReadContract({
    address: APOSTLES_CONTRACT_ADDRESS,
    abi: APOSTLES_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    chainId: base.id,
    query: {
      enabled: !!walletAddress,
    },
  });

  // Eligibility state (based on Neynar score)
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [neynarScore, setNeynarScore] = useState<number | null>(null);
  const [mintError, setMintError] = useState<Error | null>(null);

  // Write contract hook
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check eligibility based on Neynar score
  const checkEligibility = useCallback(async (userFid: number): Promise<boolean> => {
    try {
      setCheckingEligibility(true);
      setMintError(null);

      const response = await fetch(`/api/proof?fid=${userFid}`);
      const data: EligibilityResponse = await response.json();

      if (!data.isEligible) {
        setIsEligible(false);
        setNeynarScore(data.score ?? null);
        if (data.error) {
          setMintError(new Error(data.error));
        }
        return false;
      }

      setIsEligible(true);
      setNeynarScore(data.score ?? null);
      return true;
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
      return false;
    } finally {
      setCheckingEligibility(false);
    }
  }, []);

  const mint = useCallback(async (quantity: number) => {
    if (!walletAddress) {
      console.error("No wallet address");
      setMintError(new Error("Please connect your wallet to mint"));
      return;
    }

    if (!fid) {
      console.error("No FID");
      setMintError(new Error("Please connect your Farcaster account to mint"));
      return;
    }

    setMintError(null);

    // Check if sold out
    if (remaining !== undefined && remaining <= 0) {
      setMintError(new Error("Sorry, this collection is sold out!"));
      return;
    }

    // Check if enough supply for requested quantity
    if (remaining !== undefined && quantity > remaining) {
      setMintError(new Error(`Only ${remaining} NFT${remaining > 1 ? "s" : ""} remaining`));
      return;
    }

    // Check if claim has started (claimCondition has startTimestamp)
    if (claimCondition) {
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (claimCondition.startTimestamp > now) {
        const startDate = new Date(Number(claimCondition.startTimestamp) * 1000);
        setMintError(new Error(`Minting starts ${startDate.toLocaleString()}`));
        return;
      }
    }

    // Check eligibility based on Neynar score if not already checked
    if (isEligible === null) {
      const eligible = await checkEligibility(fid);
      if (!eligible) {
        return; // Error already set in checkEligibility
      }
    } else if (!isEligible) {
      setMintError(new Error("Your Neynar score is too low to mint"));
      return;
    }

    // Check if user has already minted their max allocation (1 per wallet for public mint)
    const currentBalance = userBalance !== undefined ? BigInt(userBalance as bigint) : 0n;
    const maxAllowed = 10n; // 10 per wallet for public mint

    if (currentBalance >= maxAllowed) {
      const error = new Error(
        `You've already minted your maximum allocation (${maxAllowed.toString()} NFT)`
      );
      setMintError(error);
      console.error("Max per wallet exceeded:", {
        currentBalance: currentBalance.toString(),
        maxAllowed: maxAllowed.toString(),
      });
      return;
    }

    // Use empty proof for public mint
    const proof: AllowlistProof = EMPTY_ALLOWLIST_PROOF;
    const mintPrice = pricePerToken;
    const totalValue = mintPrice * BigInt(quantity);

    console.log("Minting (public with Neynar score check):", {
      quantity,
      pricePerToken: mintPrice.toString(),
      totalValue: totalValue.toString(),
      receiver: walletAddress,
      fid,
      neynarScore,
      currentBalance: currentBalance.toString(),
    });

    writeContract({
      address: APOSTLES_CONTRACT_ADDRESS,
      abi: APOSTLES_ABI,
      functionName: "claim",
      args: [
        walletAddress as `0x${string}`, // _receiver
        BigInt(quantity),               // _quantity
        proof.currency,                 // _currency
        mintPrice,                      // _pricePerToken
        proof,                          // _allowlistProof (empty for public)
        "0x",                           // _data
      ],
      value: totalValue,
      chainId: base.id,
    });
  }, [walletAddress, fid, isEligible, checkEligibility, pricePerToken, writeContract, userBalance, remaining, claimCondition, neynarScore]);

  const reset = useCallback(() => {
    resetWrite();
    setMintError(null);
    setIsEligible(null);
    setNeynarScore(null);
  }, [resetWrite]);

  return {
    mint,
    isLoading: isWritePending || checkingEligibility,
    isConfirming,
    isSuccess,
    isError: isWriteError || isConfirmError || mintError !== null,
    error: writeError || confirmError || mintError,
    txHash,
    reset,
    isEligible,
    checkingEligibility,
    neynarScore,
  };
}

/**
 * Hook to get mint price from contract
 */
export function useMintPrice() {
  const { priceWei, priceEth, isLoading } = useApostlesContract();
  
  return {
    priceWei: priceWei ?? 0n,
    priceEth: priceEth ?? 0,
    isLoading,
  };
}
