"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { base } from "wagmi/chains";
import {
  APOSTLES_CONTRACT_ADDRESS,
  APOSTLES_ABI,
  type ClaimCondition,
} from "~/lib/contract";

/**
 * Hook to read The Apostles contract data
 * Returns: remaining supply, price, and claim condition info
 */
export function useApostlesContract() {
  // Read multiple contract values at once
  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: APOSTLES_CONTRACT_ADDRESS,
        abi: APOSTLES_ABI,
        functionName: "totalMinted",
        chainId: base.id,
      },
      {
        address: APOSTLES_CONTRACT_ADDRESS,
        abi: APOSTLES_ABI,
        functionName: "nextTokenIdToMint",
        chainId: base.id,
      },
      {
        address: APOSTLES_CONTRACT_ADDRESS,
        abi: APOSTLES_ABI,
        functionName: "getActiveClaimConditionId",
        chainId: base.id,
      },
    ],
  });

  const totalMinted = data?.[0]?.result as bigint | undefined;
  const maxSupply = data?.[1]?.result as bigint | undefined;
  const activeConditionId = data?.[2]?.result as bigint | undefined;

  // Get active claim condition details
  const { data: claimConditionData } = useReadContract({
    address: APOSTLES_CONTRACT_ADDRESS,
    abi: APOSTLES_ABI,
    functionName: "getClaimConditionById",
    args: activeConditionId !== undefined ? [activeConditionId] : undefined,
    chainId: base.id,
    query: {
      enabled: activeConditionId !== undefined,
    },
  });

  const claimCondition = claimConditionData as ClaimCondition | undefined;

  // Calculate remaining supply
  const remaining = maxSupply !== undefined && totalMinted !== undefined
    ? Number(maxSupply) - Number(totalMinted)
    : undefined;

  // Get price in ETH (convert from wei)
  const priceWei = claimCondition?.pricePerToken;
  const priceEth = priceWei !== undefined
    ? Number(priceWei) / 1e18
    : undefined;

  return {
    // Supply info
    totalMinted: totalMinted !== undefined ? Number(totalMinted) : undefined,
    maxSupply: maxSupply !== undefined ? Number(maxSupply) : undefined,
    remaining,
    
    // Price info
    priceWei,
    priceEth,
    
    // Claim condition
    activeConditionId,
    claimCondition,
    
    // Status
    isLoading,
    isError,
    refetch,
  };
}
