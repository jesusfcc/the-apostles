"use client";

import { useState, useEffect } from "react";
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

interface MintedNFTData {
  tokenId: number | null;
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

// Transfer event signature for ERC721
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

/**
 * Convert IPFS URI to HTTP gateway URL
 */
function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

/**
 * Hook to fetch minted NFT data from transaction hash
 */
export function useMintedNFT(txHash: `0x${string}` | undefined): MintedNFTData {
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId: base.id });

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

        // 2. Find Transfer event and extract token ID
        let mintedTokenId: bigint | null = null;

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
                mintedTokenId = args.tokenId;
                break;
              }
            }
          } catch {
            // Not a Transfer event, continue
          }
        }

        if (mintedTokenId === null) {
          throw new Error("Could not find minted token ID in transaction");
        }

        setTokenId(Number(mintedTokenId));
        console.log("Minted token ID:", mintedTokenId.toString());

        // 3. Fetch tokenURI from contract
        const tokenURI = await publicClient.readContract({
          address: APOSTLES_CONTRACT_ADDRESS,
          abi: APOSTLES_ABI,
          functionName: "tokenURI",
          args: [mintedTokenId],
        }) as string;

        console.log("Token URI:", tokenURI);

        // 4. Fetch metadata from tokenURI
        const metadataUrl = ipfsToHttp(tokenURI);
        const metadataResponse = await fetch(metadataUrl);

        if (!metadataResponse.ok) {
          throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
        }

        const nftMetadata: NFTMetadata = await metadataResponse.json();
        setMetadata(nftMetadata);
        console.log("NFT Metadata:", nftMetadata);

        // 5. Get image URL
        if (nftMetadata.image) {
          const imgUrl = ipfsToHttp(nftMetadata.image);
          setImageUrl(imgUrl);
          console.log("Image URL:", imgUrl);
        }

      } catch (err) {
        console.error("Error fetching minted NFT data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTData();
  }, [txHash, publicClient]);

  return {
    tokenId,
    metadata,
    imageUrl,
    isLoading,
    error,
  };
}
