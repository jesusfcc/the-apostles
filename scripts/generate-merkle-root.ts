/**
 * Script to generate and verify Merkle root for allowlist
 * 
 * Usage: npx tsx scripts/generate-merkle-root.ts
 * 
 * This will output the Merkle root that needs to be set in the Thirdweb dashboard
 * for your claim condition.
 */

import { getMerkleRoot, ALLOWLIST_ENTRIES, verifyProof, getProofForAddress, hashAllowlistEntry } from "../src/lib/allowlist";

console.log("========================================");
console.log("  Thirdweb Allowlist Merkle Generator  ");
console.log("========================================\n");

if (ALLOWLIST_ENTRIES.length === 0) {
  console.log("⚠️  No allowlist entries found!");
  console.log("   Add entries to src/lib/allowlist.ts");
  console.log("");
  console.log("Example entry:");
  console.log(`  { address: "0x1234...abcd", maxClaimable: 5, price: 0n },`);
  process.exit(0);
}

console.log(`📋 Total Allowlist Entries: ${ALLOWLIST_ENTRIES.length}\n`);

// Print all entries
console.log("Entries:");
ALLOWLIST_ENTRIES.forEach((entry, i) => {
  const priceEth = Number(entry.price) / 1e18;
  console.log(`  ${i + 1}. ${entry.address}`);
  console.log(`     Max: ${entry.maxClaimable}, Price: ${priceEth} ETH`);
  console.log(`     Leaf hash: ${hashAllowlistEntry(entry)}`);
});

console.log("\n----------------------------------------");
console.log("🌳 MERKLE ROOT (copy to Thirdweb dashboard):");
console.log("----------------------------------------");
console.log(`\n${getMerkleRoot()}\n`);
console.log("----------------------------------------\n");

// Verification test
console.log("🔍 Verifying proofs for all entries...\n");
let allValid = true;

for (const entry of ALLOWLIST_ENTRIES) {
  const { proof, entry: foundEntry } = getProofForAddress(entry.address);
  const isValid = verifyProof(entry.address, proof);
  
  if (isValid && foundEntry) {
    console.log(`✅ ${entry.address.slice(0, 10)}...${entry.address.slice(-6)} - Valid (proof length: ${proof.length})`);
  } else {
    console.log(`❌ ${entry.address.slice(0, 10)}...${entry.address.slice(-6)} - INVALID!`);
    allValid = false;
  }
}

console.log("");
if (allValid) {
  console.log("✅ All proofs verified successfully!\n");
} else {
  console.log("❌ Some proofs failed verification. Check your allowlist entries.\n");
  process.exit(1);
}

console.log("📝 Next Steps:");
console.log("  1. Copy the Merkle root above");
console.log("  2. Go to Thirdweb dashboard → Your contract → Claim Conditions");
console.log("  3. Set the Merkle root in your claim condition");
console.log("  4. Deploy the project\n");
