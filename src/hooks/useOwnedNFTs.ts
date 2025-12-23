"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, fallback, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { APOSTLES_CONTRACT_ADDRESS, APOSTLES_ABI } from "~/lib/contract";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface OwnedNFT {
  tokenId: number;
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  isLoading: boolean;
}

// RPC endpoints for Base mainnet
const BASE_RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL,
  "https://base.llamarpc.com",
  "https://base.drpc.org",
  "https://1rpc.io/base",
  "https://mainnet.base.org",
].filter(Boolean) as string[];

// IPFS gateways to race
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://w3s.link/ipfs/",
  "https://dweb.link/ipfs/",
  "https://4everland.io/ipfs/",
];

const publicClient = createPublicClient({
  chain: base,
  transport: fallback(BASE_RPC_URLS.map((url) => http(url))),
});

// Transfer event signature
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", IPFS_GATEWAYS[0]);
  }
  return uri;
}


async function fetchFromGateway(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchWithIPFSRace(ipfsUri: string): Promise<Response> {
  const path = ipfsUri.replace("ipfs://", "");
  const racePromises = IPFS_GATEWAYS.map(async (gateway) => {
    return fetchFromGateway(gateway + path, 10000);
  });

  try {
    return await Promise.any(racePromises);
  } catch {
    throw new Error("All IPFS gateways failed");
  }
}

/**
 * Hook to fetch all NFTs owned by an address using Transfer events
 */
export function useOwnedNFTs(walletAddress: string | undefined) {
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOwnedNFTs = useCallback(async () => {
    if (!walletAddress) {
      setOwnedNFTs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get balance first to check if user has any NFTs
      const balance = await publicClient.readContract({
        address: APOSTLES_CONTRACT_ADDRESS,
        abi: APOSTLES_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });

      const balanceNum = Number(balance);
      if (balanceNum === 0) {
        setOwnedNFTs([]);
        setIsLoading(false);
        return;
      }

      // Get all Transfer events TO this address (tokens received)
      const receivedLogs = await publicClient.getLogs({
        address: APOSTLES_CONTRACT_ADDRESS,
        event: TRANSFER_EVENT,
        args: {
          to: walletAddress as `0x${string}`,
        },
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Get all Transfer events FROM this address (tokens sent away)
      const sentLogs = await publicClient.getLogs({
        address: APOSTLES_CONTRACT_ADDRESS,
        event: TRANSFER_EVENT,
        args: {
          from: walletAddress as `0x${string}`,
        },
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Build a map of token ownership
      const tokenOwnership = new Map<bigint, boolean>();

      // Mark all received tokens as owned
      for (const log of receivedLogs) {
        if (log.args.tokenId !== undefined) {
          tokenOwnership.set(log.args.tokenId, true);
        }
      }

      // Mark sent tokens as not owned
      for (const log of sentLogs) {
        if (log.args.tokenId !== undefined) {
          tokenOwnership.set(log.args.tokenId, false);
        }
      }

      // Get list of currently owned token IDs
      const ownedTokenIds: bigint[] = [];
      for (const [tokenId, owned] of tokenOwnership) {
        if (owned) {
          ownedTokenIds.push(tokenId);
        }
      }

      // Sort by token ID
      ownedTokenIds.sort((a, b) => Number(a - b));

      if (ownedTokenIds.length === 0) {
        setOwnedNFTs([]);
        setIsLoading(false);
        return;
      }

      // Initialize NFTs with loading state
      const initialNFTs: OwnedNFT[] = ownedTokenIds.map((tokenId) => ({
        tokenId: Number(tokenId),
        metadata: null,
        imageUrl: null,
        isLoading: true,
      }));
      setOwnedNFTs(initialNFTs);
      setIsLoading(false);

      // Fetch metadata for each NFT in parallel batches
      const batchSize = 3;
      for (let i = 0; i < ownedTokenIds.length; i += batchSize) {
        const batch = ownedTokenIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (tokenId): Promise<OwnedNFT> => {
            try {
              const tokenURI = (await publicClient.readContract({
                address: APOSTLES_CONTRACT_ADDRESS,
                abi: APOSTLES_ABI,
                functionName: "tokenURI",
                args: [tokenId],
              })) as string;

              const metadataResponse = await fetchWithIPFSRace(tokenURI);
              const metadata: NFTMetadata = await metadataResponse.json();
              const imageUrl = metadata.image ? ipfsToHttp(metadata.image) : null;

              return {
                tokenId: Number(tokenId),
                metadata,
                imageUrl,
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
          })
        );

        setOwnedNFTs((prev) => {
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
      console.error("Error fetching owned NFTs:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchOwnedNFTs();
  }, [fetchOwnedNFTs]);

  return {
    ownedNFTs,
    isLoading,
    error,
    refetch: fetchOwnedNFTs,
  };
}
