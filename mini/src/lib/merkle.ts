import { MerkleTree } from "merkletreejs";
import { keccak256, encodePacked } from "viem";
import { readFileSync } from "fs";
import { join } from "path";

export interface AllowlistEntry {
  address: string;
  maxClaimable: bigint;
  priceWei: bigint;
  currencyAddress: string;
}

/**
 * Hash a leaf in ThirdWeb's allowlist format
 * ThirdWeb uses: keccak256(abi.encodePacked(address, maxClaimable, price, currency))
 * All addresses must be lowercase for consistent hashing
 */
function hashLeaf(entry: AllowlistEntry): `0x${string}` {
  const encoded = encodePacked(
    ["address", "uint256", "uint256", "address"],
    [
      entry.address.toLowerCase() as `0x${string}`,
      entry.maxClaimable,
      entry.priceWei,
      entry.currencyAddress.toLowerCase() as `0x${string}`,
    ]
  );

  return keccak256(encoded);
}

/**
 * Parse allowlist CSV file
 * Handles price in ETH format (converts to wei)
 */
function parseAllowlistCSV(csvContent: string): AllowlistEntry[] {
  // Remove carriage returns and split by newlines
  const lines = csvContent.replace(/\r/g, "").trim().split("\n");
  const entries: AllowlistEntry[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [address, maxClaimable, price, currencyAddress] = line.split(",");
    if (address && maxClaimable && price !== undefined && currencyAddress) {
      // Convert price from ETH to wei
      const priceWei = BigInt(Math.floor(parseFloat(price.trim()) * 1e18));

      entries.push({
        address: address.trim().toLowerCase(),
        maxClaimable: BigInt(maxClaimable.trim()),
        priceWei,
        currencyAddress: currencyAddress.trim().toLowerCase(),
      });
    }
  }

  return entries;
}

// Cache the merkle tree and entries
let cachedTree: MerkleTree | null = null;
let cachedEntries: AllowlistEntry[] | null = null;

/**
 * Load and cache the allowlist merkle tree
 */
export function getMerkleTree(): { tree: MerkleTree; entries: AllowlistEntry[] } {
  if (cachedTree && cachedEntries) {
    return { tree: cachedTree, entries: cachedEntries };
  }

  // Read CSV file - using snapshot.csv
  const csvPath = join(process.cwd(), "src/lib/snapshot.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const entries = parseAllowlistCSV(csvContent);

  // Create leaf hashes
  const leaves = entries.map((entry) => hashLeaf(entry));

  // Create merkle tree (sorted pairs for consistency with ThirdWeb)
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  cachedTree = tree;
  cachedEntries = entries;

  console.log("Merkle tree created:");
  console.log("  Root:", tree.getHexRoot());
  console.log("  Entries:", entries.length);

  return { tree, entries };
}

/**
 * Get merkle proof for an address
 */
export function getProofForAddress(address: string): {
  proof: `0x${string}`[];
  entry: AllowlistEntry;
} | null {
  const { tree, entries } = getMerkleTree();

  // Normalize address for comparison (lowercase)
  const normalizedAddress = address.toLowerCase();

  // Find the entry for this address
  const entry = entries.find(
    (e) => e.address.toLowerCase() === normalizedAddress
  );

  if (!entry) {
    return null;
  }

  // Generate leaf hash
  const leaf = hashLeaf(entry);

  // Get proof
  const proof = tree.getHexProof(leaf) as `0x${string}`[];

  return { proof, entry };
}

/**
 * Verify a proof
 */
export function verifyProof(
  address: string,
  proof: `0x${string}`[],
  entry: AllowlistEntry
): boolean {
  const { tree } = getMerkleTree();
  const leaf = hashLeaf(entry);
  const root = tree.getHexRoot();

  return tree.verify(proof, leaf, root);
}

/**
 * Get the merkle root
 */
export function getMerkleRoot(): string {
  const { tree } = getMerkleTree();
  return tree.getHexRoot();
}
