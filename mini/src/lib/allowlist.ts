/**
 * Allowlist Configuration for The Apostles NFT
 *
 * This file contains the allowlist addresses and their claim conditions.
 * The Merkle root generated from this list must match the one set in Thirdweb dashboard.
 */
import fs from "fs";
import path from "path";
import { MerkleTree } from "merkletreejs";
import { keccak256, encodePacked, getAddress, type Hex } from "viem";

export interface AllowlistEntry {
  address: string;
  maxClaimable: number;
  price: bigint; // in wei
}

// ============================================================================
// ALLOWLIST DATA
// Loaded from snapshot.csv - addresses get FREE mint
// ============================================================================

function loadAllowlistFromCSV(): AllowlistEntry[] {
  // Only load on server-side
  if (typeof window !== "undefined") {
    return [];
  }

  try {
    const csvPath = path.join(process.cwd(), "src/lib/the-apostles.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.trim().split("\n");

    // Skip header row, deduplicate by lowercase address (keep first occurrence like Thirdweb)
    const entries: AllowlistEntry[] = [];
    const seenAddresses = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [address, maxClaimable, price] = line.split(",");
      if (address && maxClaimable) {
        const normalizedAddress = address.trim().toLowerCase();

        // Skip duplicates (Thirdweb keeps first occurrence)
        if (seenAddresses.has(normalizedAddress)) {
          continue;
        }
        seenAddresses.add(normalizedAddress);

        entries.push({
          address: address.trim(),
          maxClaimable: parseInt(maxClaimable.trim(), 10),
          price: BigInt(price?.trim() || "0"),
        });
      }
    }

    console.log(`[Allowlist] Loaded ${entries.length} unique entries from the-apostles.csv`);
    return entries;
  } catch (error) {
    console.error("[Allowlist] Failed to load the-apostles.csv:", error);
    return [];
  }
}

export const ALLOWLIST_ENTRIES: AllowlistEntry[] = loadAllowlistFromCSV();

// Native ETH address used by Thirdweb
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

/**
 * Hash function for leaf nodes - matches Thirdweb's encoding
 * 
 * Thirdweb uses: keccak256(abi.encodePacked(address, quantity, price, currency))
 */
export function hashAllowlistEntry(entry: AllowlistEntry): Hex {
  const normalizedAddress = getAddress(entry.address);
  
  return keccak256(
    encodePacked(
      ["address", "uint256", "uint256", "address"],
      [
        normalizedAddress as `0x${string}`,
        BigInt(entry.maxClaimable),
        entry.price,
        NATIVE_TOKEN,
      ]
    )
  );
}

/**
 * Create a lookup map for quick address searching
 */
export function createAllowlistMap(): Map<string, AllowlistEntry> {
  const map = new Map<string, AllowlistEntry>();
  for (const entry of ALLOWLIST_ENTRIES) {
    const normalizedAddress = getAddress(entry.address).toLowerCase();
    map.set(normalizedAddress, entry);
  }
  return map;
}

/**
 * Build the Merkle tree from allowlist entries
 */
export function buildMerkleTree(): MerkleTree {
  const leaves = ALLOWLIST_ENTRIES.map(hashAllowlistEntry);
  
  // Use keccak256 as hash function, sort pairs for deterministic tree
  const tree = new MerkleTree(leaves, keccak256, {
    sortPairs: true,
    hashLeaves: false, // We already hashed the leaves
  });
  
  return tree;
}

/**
 * Get the Merkle root (to be set in Thirdweb dashboard)
 */
export function getMerkleRoot(): Hex {
  const tree = buildMerkleTree();
  return tree.getHexRoot() as Hex;
}

/**
 * Get Merkle proof for an address
 */
export function getProofForAddress(address: string): {
  proof: Hex[];
  entry: AllowlistEntry | null;
} {
  const normalizedAddress = getAddress(address).toLowerCase();
  const allowlistMap = createAllowlistMap();
  const entry = allowlistMap.get(normalizedAddress);
  
  if (!entry) {
    return { proof: [], entry: null };
  }
  
  const tree = buildMerkleTree();
  const leaf = hashAllowlistEntry(entry);
  const proof = tree.getHexProof(leaf) as Hex[];
  
  return { proof, entry };
}

/**
 * Verify if a proof is valid for an address
 */
export function verifyProof(address: string, proof: Hex[]): boolean {
  const normalizedAddress = getAddress(address).toLowerCase();
  const allowlistMap = createAllowlistMap();
  const entry = allowlistMap.get(normalizedAddress);
  
  if (!entry) return false;
  
  const tree = buildMerkleTree();
  const leaf = hashAllowlistEntry(entry);
  const root = tree.getRoot();
  
  return tree.verify(proof, leaf, root);
}

// For debugging: log the Merkle root when this module is loaded (server-side only)
if (typeof window === "undefined" && ALLOWLIST_ENTRIES.length > 0) {
  console.log("[Allowlist] Merkle Root:", getMerkleRoot());
  console.log("[Allowlist] Total entries:", ALLOWLIST_ENTRIES.length);
}
