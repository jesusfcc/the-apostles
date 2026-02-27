'use client';

import { type State } from 'wagmi';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { FarcasterProvider } from '~/components/providers/FarcasterProvider';
import WagmiProvider from '~/components/providers/WagmiProvider';

interface ProvidersProps {
  children: React.ReactNode;
  initialState?: State;
}

export function Providers({ children, initialState }: ProvidersProps) {
  return (
    <WagmiProvider initialState={initialState}>
      <MiniKitProvider enabled={true}>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </MiniKitProvider>
    </WagmiProvider>
  );
}
