"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import sdk from '@farcaster/miniapp-sdk';

type MiniAppContext = Awaited<typeof sdk.context>;

interface NotificationStatus {
  enabled: boolean;
  token?: string;
  url?: string;
}

interface FarcasterContextType {
  context: MiniAppContext | null;
  user: MiniAppContext['user'] | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  // Client info
  safeAreaInsets: MiniAppContext['client']['safeAreaInsets'] | null;
  platformType: MiniAppContext['client']['platformType'] | null;
  isAppAdded: boolean;
  // Actions
  signIn: () => Promise<boolean>;
  addMiniApp: () => Promise<unknown>;
  viewProfile: (fid: number) => Promise<void>;
  composeCast: (options?: { text?: string; embeds?: string[] }) => Promise<unknown>;
  openUrl: (url: string) => Promise<void>;
  // Notifications
  notificationStatus: NotificationStatus;
  requestNotifications: () => Promise<boolean>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({ enabled: false });

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('🚀 Initializing Farcaster SDK...');
        
        // Fetch the context
        const farcasterContext = await sdk.context;
        setContext(farcasterContext);
        
        console.log('✅ Farcaster context loaded:', {
          fid: farcasterContext?.user?.fid,
          username: farcasterContext?.user?.username,
          platform: farcasterContext?.client?.platformType,
        });

        // Check notification status from context
        if (farcasterContext?.client?.notificationDetails) {
          const details = farcasterContext.client.notificationDetails;
          setNotificationStatus({
            enabled: true,
            token: details.token,
            url: details.url,
          });
          console.log('🔔 Notifications already enabled');
        }
      } catch (err) {
        console.error('❌ Error fetching Farcaster context:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        // Always call ready() to hide splash screen, even if context fetch fails
        try {
          await sdk.actions.ready();
          console.log('✅ sdk.actions.ready() called - splash screen hidden');
        } catch (readyErr) {
          console.warn('⚠️ sdk.actions.ready() failed:', readyErr);
        }
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, []);

  /**
   * Sign in via Farcaster miniapp SDK.
   * This will prompt the user to authenticate and connect their wallet.
   * Returns true if sign-in was successful, false otherwise.
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔐 Attempting Farcaster sign in...');
      // Generate a random nonce for the sign-in request
      const nonce = Math.random().toString(36).substring(2, 15);
      const result = await sdk.actions.signIn({ nonce });

      if (result) {
        console.log('✅ Sign in successful:', result);
        setIsAuthenticated(true);
        return true;
      }

      console.log('❌ Sign in returned no result');
      return false;
    } catch (err) {
      console.error('❌ Sign in error:', err);
      return false;
    }
  }, []);

  const addMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();

      // After adding, check if notifications were granted
      if (result?.notificationDetails) {
        setNotificationStatus({
          enabled: true,
          token: result.notificationDetails.token,
          url: result.notificationDetails.url,
        });
        console.log('🔔 Notifications enabled after addMiniApp:', result.notificationDetails);
      }

      return result;
    } catch (err) {
      console.error('Error adding mini app:', err);
      throw err;
    }
  }, []);

  const viewProfile = useCallback(async (fid: number) => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (err) {
      console.error('Error opening profile:', err);
      // Fallback: open in new tab if SDK fails
      window.open(`https://warpcast.com/~/profiles/${fid}`, '_blank');
    }
  }, []);

  const composeCast = useCallback(async (options?: { text?: string; embeds?: string[] }) => {
    try {
      const result = await sdk.actions.composeCast({
        text: options?.text,
        embeds: options?.embeds as [string] | [string, string] | undefined,
      });
      return result;
    } catch (err) {
      console.error('Error composing cast:', err);
      throw err;
    }
  }, []);

  const openUrl = useCallback(async (url: string) => {
    try {
      await sdk.actions.openUrl(url);
    } catch (err) {
      console.error('Error opening URL:', err);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }, []);

  /**
   * Request notification permissions from the user.
   * This will prompt the user to add the mini app if not already added.
   * Returns true if notifications were enabled, false otherwise.
   */
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // If already enabled, return true
      if (notificationStatus.enabled) {
        console.log('🔔 Notifications already enabled');
        return true;
      }

      // Request via addMiniApp which includes notification permissions
      const result = await sdk.actions.addMiniApp();
      
      if (result?.notificationDetails) {
        setNotificationStatus({
          enabled: true,
          token: result.notificationDetails.token,
          url: result.notificationDetails.url,
        });
        console.log('🔔 Notifications enabled:', result.notificationDetails);
        return true;
      }
      
      console.log('🔕 User did not enable notifications');
      return false;
    } catch (err) {
      console.error('Error requesting notifications:', err);
      return false;
    }
  }, [notificationStatus.enabled]);

  return (
    <FarcasterContext.Provider
      value={{
        context,
        user: context?.user || null,
        isLoading,
        error,
        isAuthenticated,
        // Client info
        safeAreaInsets: context?.client?.safeAreaInsets || null,
        platformType: context?.client?.platformType || null,
        isAppAdded: context?.client?.added || false,
        // Actions
        signIn,
        addMiniApp,
        viewProfile,
        composeCast,
        openUrl,
        // Notifications
        notificationStatus,
        requestNotifications,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

/**
 * Custom hook to use the Farcaster context.
 * Provides access to user data, SDK actions, and notification status.
 */
export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}
