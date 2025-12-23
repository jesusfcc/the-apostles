"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";
import { decodeEventLog, parseAbiItem } from "viem";
import { APOSTLES_CONTRACT_ADDRESS, APOSTLES_ABI } from "~/lib/contract";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface MintedNFT {
  tokenId: number;
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  isLoading: boolean;
}

interface MintedNFTData {
  // Legacy single NFT fields (for backwards compatibility)
  tokenId: number | null;
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  // New: array of all minted NFTs
  mintedNFTs: MintedNFT[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Transfer event signature for ERC721
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

// List of IPFS gateways to race (updated to working gateways)
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://w3s.link/ipfs/",
  "https://dweb.link/ipfs/",
  "https://4everland.io/ipfs/",
];

/**
 * Convert IPFS URI to HTTP gateway URL
 */
function ipfsToHttp(uri: string, gatewayIndex = 0): string {
  if (uri.startsWith("ipfs://")) {
    const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
    return uri.replace("ipfs://", gateway);
  }
  return uri;
}

/**
 * Fetch from a single gateway with timeout
 */
async function fetchFromGateway(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Race all IPFS gateways in parallel - return first successful response
 * This is much faster than trying gateways sequentially
 */
async function fetchWithIPFSFallback(ipfsUri: string): Promise<Response> {
  // Extract CID and path from ipfs:// URI
  const path = ipfsUri.replace("ipfs://", "");
  
  console.log(`[IPFS] Racing ${IPFS_GATEWAYS.length} gateways for: ${path}`);
  
  // Create a promise for each gateway
  const racePromises = IPFS_GATEWAYS.map(async (gateway, index) => {
    const url = gateway + path;
    try {
      const response = await fetchFromGateway(url, 15000); // 15 second timeout
      console.log(`[IPFS] ✓ Gateway ${index + 1} won: ${gateway}`);
      return { response, gateway };
    } catch (err) {
      // Don't log every failure during race, too noisy
      throw err;
    }
  });

  // Use Promise.any to get the first successful response
  try {
    const result = await Promise.any(racePromises);
    return result.response;
  } catch (err) {
    // All gateways failed
    console.error("[IPFS] All gateways failed");
    if (err instanceof AggregateError) {
      console.error("[IPFS] Errors:", err.errors.map(e => e.message).join(", "));
    }
    throw new Error("All IPFS gateways failed");
  }
}

/**
 * Hook to fetch minted NFT data from transaction hash
 * Supports multiple NFTs minted in a single transaction
 */
export function useMintedNFT(txHash: `0x${string}` | undefined): MintedNFTData {
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const publicClient = usePublicClient({ chainId: base.id });

  // Refetch function for manual retry
  const refetch = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!txHash || !publicClient) return;

    const fetchNFTData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        if (!receipt) {
          throw new Error("Transaction receipt not found");
        }

        // 2. Find ALL Transfer events and extract token IDs
        const mintedTokenIds: bigint[] = [];

        for (const log of receipt.logs) {
          // Check if this log is from our contract
          if (log.address.toLowerCase() !== APOSTLES_CONTRACT_ADDRESS.toLowerCase()) {
            continue;
          }

          try {
            const decoded = decodeEventLog({
              abi: [TRANSFER_EVENT],
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "Transfer") {
              // For mints, 'from' is zero address
              const args = decoded.args as { from: string; to: string; tokenId: bigint };
              if (args.from === "0x0000000000000000000000000000000000000000") {
                mintedTokenIds.push(args.tokenId);
              }
            }
          } catch {
            // Not a Transfer event, continue
          }
        }

        if (mintedTokenIds.length === 0) {
          throw new Error("Could not find minted token IDs in transaction");
        }

        console.log("Minted token IDs:", mintedTokenIds.map(id => id.toString()));

        // 3. Initialize NFTs with loading state
        const initialNFTs: MintedNFT[] = mintedTokenIds.map((tokenId) => ({
          tokenId: Number(tokenId),
          metadata: null,
          imageUrl: null,
          isLoading: true,
        }));
        setMintedNFTs(initialNFTs);
        setIsLoading(false); // Main loading is done, individual NFTs will show their own loading

        // 4. Fetch metadata for each NFT (in parallel batches)
        const fetchMetadataForToken = async (tokenId: bigint): Promise<MintedNFT> => {
          try {
            const tokenURI = await publicClient.readContract({
              address: APOSTLES_CONTRACT_ADDRESS,
              abi: APOSTLES_ABI,
              functionName: "tokenURI",
              args: [tokenId],
            }) as string;

            console.log(`Token ${tokenId} URI:`, tokenURI);

            const metadataResponse = await fetchWithIPFSFallback(tokenURI);
            const nftMetadata: NFTMetadata = await metadataResponse.json();
            const imgUrl = nftMetadata.image ? ipfsToHttp(nftMetadata.image, 0) : null;

            return {
              tokenId: Number(tokenId),
              metadata: nftMetadata,
              imageUrl: imgUrl,
              isLoading: false,
            };
          } catch (err) {
            console.error(`Error fetching metadata for token ${tokenId}:`, err);
            return {
              tokenId: Number(tokenId),
              metadata: null,
              imageUrl: null,
              isLoading: false,
            };
          }
        };

        // Fetch in batches of 3 to avoid rate limiting
        const batchSize = 3;
        for (let i = 0; i < mintedTokenIds.length; i += batchSize) {
          const batch = mintedTokenIds.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(fetchMetadataForToken));
          
          setMintedNFTs((prev) => {
            const updated = [...prev];
            for (const result of batchResults) {
              const index = updated.findIndex((nft) => nft.tokenId === result.tokenId);
              if (index !== -1) {
                updated[index] = result;
              }
            }
            return updated;
          });
        }

      } catch (err) {
        console.error("Error fetching minted NFT data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };

    fetchNFTData();
  }, [txHash, publicClient, retryCount]);

  // Get first NFT for backwards compatibility
  const firstNFT = mintedNFTs[0];

  return {
    // Legacy fields
    tokenId: firstNFT?.tokenId ?? null,
    metadata: firstNFT?.metadata ?? null,
    imageUrl: firstNFT?.imageUrl ?? null,
    // New array field
    mintedNFTs,
    isLoading,
    error,
    refetch,
  };
}

