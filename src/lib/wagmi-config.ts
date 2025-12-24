import { createConfig, http, fallback, cookieStorage, createStorage } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { APP_NAME, APP_ICON_URL, APP_URL } from "~/lib/constants";

// RPC endpoints for Base mainnet (with fallbacks for rate limiting)
const BASE_RPC_URLS = [
  // Primary: Use env variable if set (Alchemy, QuickNode, etc.)
  process.env.NEXT_PUBLIC_BASE_RPC_URL,
  // Fallbacks: Public RPCs with higher rate limits
  "https://base.llamarpc.com",
  "https://base.drpc.org",
  "https://1rpc.io/base",
  "https://base-mainnet.public.blastapi.io",
].filter(Boolean) as string[];

// Export getConfig function for SSR cookie hydration
export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      // Use fallback transport with multiple RPC endpoints
      [base.id]: fallback(BASE_RPC_URLS.map(url => http(url))),
      [baseSepolia.id]: http(),
    },
    connectors: [
      farcasterFrame(),
      coinbaseWallet({
        appName: APP_NAME,
        appLogoUrl: APP_ICON_URL,
        preference: 'all',
      }),
      metaMask({
        dappMetadata: {
          name: APP_NAME,
          url: APP_URL,
        },
      }),
    ],
  });
}

// Singleton config instance
export const config = getConfig();
