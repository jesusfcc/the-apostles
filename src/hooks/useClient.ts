"use client";

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useFarcaster } from '~/components/providers/FarcasterProvider';

// Base App's clientFid
const BASE_APP_CLIENT_FID = 309857;

export type ClientType = 'base' | 'farcaster' | 'unknown';

interface UseClientResult {
  isBaseApp: boolean;
  isFarcaster: boolean;
  clientType: ClientType;
  clientFid: number | undefined;
  isLoading: boolean;
}

/**
 * Hook to detect which client (Base App or Farcaster) is running the mini app.
 * Uses both MiniKit and Farcaster SDK contexts to determine the client.
 */
export function useClient(): UseClientResult {
  const { context: miniKitContext } = useMiniKit();
  const { context: farcasterContext, isLoading: farcasterLoading } = useFarcaster();

  // Try to get clientFid from either context
  const clientFid = miniKitContext?.client?.clientFid ?? farcasterContext?.client?.clientFid;

  const isBaseApp = clientFid === BASE_APP_CLIENT_FID;
  const isFarcaster = clientFid !== undefined && clientFid !== BASE_APP_CLIENT_FID;

  let clientType: ClientType = 'unknown';
  if (isBaseApp) {
    clientType = 'base';
  } else if (isFarcaster) {
    clientType = 'farcaster';
  }

  // Loading if farcaster is still loading and we don't have minikit context
  const isLoading = farcasterLoading && !miniKitContext;

  return {
    isBaseApp,
    isFarcaster,
    clientType,
    clientFid,
    isLoading,
  };
}
