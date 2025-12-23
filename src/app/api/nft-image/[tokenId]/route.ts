import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { APOSTLES_CONTRACT_ADDRESS, APOSTLES_ABI } from "~/lib/contract";

// IPFS gateways to race
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://w3s.link/ipfs/",
  "https://dweb.link/ipfs/",
  "https://4everland.io/ipfs/",
];

// Create viem public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

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
 * Race all IPFS gateways - return first successful response
 */
async function fetchWithIPFSRace(ipfsUri: string, timeoutMs = 10000): Promise<Response> {
  const path = ipfsUri.replace("ipfs://", "");

  const racePromises = IPFS_GATEWAYS.map(async (gateway) => {
    const url = gateway + path;
    return fetchFromGateway(url, timeoutMs);
  });

  try {
    return await Promise.any(racePromises);
  } catch {
    throw new Error("All IPFS gateways failed");
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const tokenIdNum = parseInt(tokenId, 10);

    if (isNaN(tokenIdNum) || tokenIdNum < 0) {
      return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
    }

    // Get tokenURI from contract
    const tokenURI = await publicClient.readContract({
      address: APOSTLES_CONTRACT_ADDRESS,
      abi: APOSTLES_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenIdNum)],
    }) as string;

    if (!tokenURI) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Fetch metadata from IPFS
    const metadataResponse = await fetchWithIPFSRace(tokenURI);
    const metadata = await metadataResponse.json();

    if (!metadata.image) {
      return NextResponse.json({ error: "No image in metadata" }, { status: 404 });
    }

    // Fetch image from IPFS
    const imageResponse = await fetchWithIPFSRace(metadata.image, 15000);
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Return image with caching headers (cache for 1 year since NFT images don't change)
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("NFT image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFT image" },
      { status: 500 }
    );
  }
}
