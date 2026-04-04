import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem/chains";

export const DEPLOY_MODE =
  (process.env.NEXT_PUBLIC_DEPLOY_MODE as "test" | "production") || "production";

export const IS_TESTNET = DEPLOY_MODE === "test";

export const APP_CHAIN: Chain = IS_TESTNET ? baseSepolia : base;
export const APP_CHAIN_ID = APP_CHAIN.id;

// Contract address — set via NEXT_PUBLIC_NFT_CONTRACT_ADDRESS env var after deploy
export const NFT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "") as `0x${string}`;

const BASE_SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
  "https://sepolia.base.org",
].filter(Boolean) as string[];

const BASE_MAINNET_RPCS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL,
  "https://base.llamarpc.com",
  "https://base.drpc.org",
].filter(Boolean) as string[];

export const RPC_URLS = IS_TESTNET ? BASE_SEPOLIA_RPCS : BASE_MAINNET_RPCS;
