"use client";

import { useState, useCallback, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useConnect, useReconnect } from "wagmi";
import { base } from "wagmi/chains";
import {
  APOSTLES_CONTRACT_ADDRESS,
  APOSTLES_ABI,
  NATIVE_TOKEN_ADDRESS,
  type AllowlistProof,
} from "~/lib/contract";
import { useApostlesContract } from "./useApostlesContract";

interface EligibilityResponse {
  isEligible: boolean;
  isAllowlisted?: boolean;
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

  // Eligibility state (based on allowlist or Neynar score)
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isAllowlisted, setIsAllowlisted] = useState<boolean>(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [neynarScore, setNeynarScore] = useState<number | null>(null);
  const [mintError, setMintError] = useState<Error | null>(null);
  // Store proof data from API for use in mint call
  const [proofData, setProofData] = useState<EligibilityResponse | null>(null);

  // Reconnect hooks for fallback connection handling
  const { reconnectAsync } = useReconnect();
  const { connectAsync, connectors } = useConnect();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  // Write contract hook
  const {
    writeContract,
    writeContractAsync,
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

  // Check eligibility - fetches proof from API (allowlist or public mint)
  const checkEligibility = useCallback(async (userFid: number, userAddress: string): Promise<EligibilityResponse | null> => {
    try {
      setCheckingEligibility(true);
      setMintError(null);

      const params = new URLSearchParams({
        fid: userFid.toString(),
        address: userAddress,
      });
      const response = await fetch(`/api/proof?${params}`);
      const data: EligibilityResponse = await response.json();

      if (!data.isEligible) {
        setIsEligible(false);
        setIsAllowlisted(false);
        setNeynarScore(data.score ?? null);
        setProofData(null);
        if (data.error) {
          setMintError(new Error(data.error));
        }
        return null;
      }

      // Store proof data for mint call
      setIsEligible(true);
      setIsAllowlisted(data.isAllowlisted ?? false);
      setNeynarScore(data.score ?? null);
      setProofData(data);

      console.log("[Mint] Eligibility checked:", {
        isAllowlisted: data.isAllowlisted,
        proofLength: data.proof.length,
        quantityLimit: data.quantityLimitPerWallet,
        pricePerToken: data.pricePerToken,
      });

      return data;
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
      setProofData(null);
      return null;
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

    // Check eligibility and get proof if not already fetched
    let currentProofData = proofData;
    if (isEligible === null || !proofData) {
      currentProofData = await checkEligibility(fid, walletAddress);
      if (!currentProofData) {
        return; // Error already set in checkEligibility
      }
    } else if (!isEligible) {
      setMintError(new Error("You are not eligible to mint"));
      return;
    }

    // Use proof data from API
    const proofArray = currentProofData!.proof as `0x${string}`[];
    const quantityLimit = BigInt(currentProofData!.quantityLimitPerWallet || "0");
    const proofPricePerToken = BigInt(currentProofData!.pricePerToken || "0");
    const currency = (currentProofData!.currency || NATIVE_TOKEN_ADDRESS) as `0x${string}`;

    // Check if user has already minted their max allocation
    const currentBalance = userBalance !== undefined ? BigInt(userBalance as bigint) : 0n;
    // Use allowlist limit if on allowlist, otherwise use default
    const maxAllowed = quantityLimit > 0n ? quantityLimit : 10n;

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

    // Build the allowlist proof struct for the claim call
    const proof: AllowlistProof = {
      proof: proofArray,
      quantityLimitPerWallet: quantityLimit,
      pricePerToken: proofPricePerToken,
      currency: currency,
    };

    // Determine the mint price:
    // - If allowlisted (has proof), use allowlist price (can be 0 for free)
    // - Otherwise use the claim condition price (public mint at $20)
    const mintPrice = proofArray.length > 0
      ? proofPricePerToken  // Allowlist price (0 = free)
      : pricePerToken;      // Public mint price from contract
    const totalValue = mintPrice * BigInt(quantity);

    console.log("Minting:", {
      quantity,
      isAllowlisted: proofArray.length > 0,
      proofLength: proofArray.length,
      pricePerToken: mintPrice.toString(),
      totalValue: totalValue.toString(),
      receiver: walletAddress,
      fid,
      neynarScore,
      currentBalance: currentBalance.toString(),
    });

    // Mint contract call with reconnect fallback
    const executeMint = async () => {
      try {
        await writeContractAsync({
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
        retryCountRef.current = 0; // Reset retry count on success
      } catch (err) {
        const errorMessage = (err as Error)?.message?.toLowerCase() || "";
        const isConnectorError = 
          errorMessage.includes("connector") ||
          errorMessage.includes("getchainid") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("chainid");

        // If it's a connector error and we haven't exceeded retries, try to reconnect
        if (isConnectorError && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          console.log(`[Mint] Connector error detected, attempting reconnect (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);
          
          try {
            // Try to reconnect first
            await reconnectAsync();
            console.log("[Mint] Reconnected successfully, retrying mint...");
            await executeMint(); // Retry the mint
          } catch (reconnectErr) {
            console.log("[Mint] Reconnect failed, trying fresh connect...");
            try {
              // If reconnect fails, try a fresh connection with the first available connector
              const farcasterConnector = connectors.find(c => c.id === "farcasterFrame");
              if (farcasterConnector) {
                await connectAsync({ connector: farcasterConnector });
                console.log("[Mint] Fresh connect successful, retrying mint...");
                await executeMint();
              } else {
                throw reconnectErr;
              }
            } catch (connectErr) {
              console.error("[Mint] All reconnect attempts failed:", connectErr);
              setMintError(new Error("Connection issue. Please refresh and try again."));
            }
          }
        } else {
          // Not a connector error or max retries exceeded, propagate the error
          throw err;
        }
      }
    };

    executeMint();
  }, [walletAddress, fid, isEligible, proofData, checkEligibility, pricePerToken, writeContractAsync, userBalance, remaining, claimCondition, neynarScore, reconnectAsync, connectAsync, connectors]);

  const reset = useCallback(() => {
    resetWrite();
    setMintError(null);
    setIsEligible(null);
    setIsAllowlisted(false);
    setNeynarScore(null);
    setProofData(null);
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
