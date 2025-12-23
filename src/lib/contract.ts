/**
 * The Apostles NFT Contract Configuration
 * ThirdWeb DropERC721 contract on Base mainnet
 */

export const APOSTLES_CONTRACT_ADDRESS = "0x9FF7B87C6e23854dc09888004a12d9bEC53296e1" as const;
// test - 0x77fD806ea78D561E646A302C3D406C278f5b1643
// main - 0x9FF7B87C6e23854dc09888004a12d9bEC53296e1

// ThirdWeb DropERC721 ABI - only the functions we need
export const APOSTLES_ABI = [
  // Read functions
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalMinted",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "nextTokenIdToMint",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "nextTokenIdToClaim",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getActiveClaimConditionId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getClaimConditionById",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_conditionId", type: "uint256" }],
    outputs: [
      {
        name: "condition",
        type: "tuple",
        components: [
          { name: "startTimestamp", type: "uint256" },
          { name: "maxClaimableSupply", type: "uint256" },
          { name: "supplyClaimed", type: "uint256" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "metadata", type: "string" },
        ],
      },
    ],
  },
  {
    name: "verifyClaim",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_conditionId", type: "uint256" },
      { name: "_claimer", type: "address" },
      { name: "_quantity", type: "uint256" },
      { name: "_currency", type: "address" },
      { name: "_pricePerToken", type: "uint256" },
      {
        name: "_allowlistProof",
        type: "tuple",
        components: [
          { name: "proof", type: "bytes32[]" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
        ],
      },
    ],
    outputs: [{ name: "isOverride", type: "bool" }],
  },
  // Write functions
  {
    name: "claim",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_receiver", type: "address" },
      { name: "_quantity", type: "uint256" },
      { name: "_currency", type: "address" },
      { name: "_pricePerToken", type: "uint256" },
      {
        name: "_allowlistProof",
        type: "tuple",
        components: [
          { name: "proof", type: "bytes32[]" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
        ],
      },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
  },
  // Standard ERC721 functions
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
] as const;

// Native ETH address used by ThirdWeb
export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

// Claim condition type
export interface ClaimCondition {
  startTimestamp: bigint;
  maxClaimableSupply: bigint;
  supplyClaimed: bigint;
  quantityLimitPerWallet: bigint;
  merkleRoot: `0x${string}`;
  pricePerToken: bigint;
  currency: `0x${string}`;
  metadata: string;
}

// Allowlist proof type
export interface AllowlistProof {
  proof: `0x${string}`[];
  quantityLimitPerWallet: bigint;
  pricePerToken: bigint;
  currency: `0x${string}`;
}

// Empty proof for public mints
export const EMPTY_ALLOWLIST_PROOF: AllowlistProof = {
  proof: [],
  quantityLimitPerWallet: 0n,
  pricePerToken: 0n,
  currency: NATIVE_TOKEN_ADDRESS,
};
