'use client';

import { type State } from 'wagmi';
import { FarcasterProvider } from '~/components/providers/FarcasterProvider';
import WagmiProvider from '~/components/providers/WagmiProvider';

interface ProvidersProps {
  children: React.ReactNode;
  initialState?: State;
}

export function Providers({ children, initialState }: ProvidersProps) {
  return (
    <WagmiProvider initialState={initialState}>
      <FarcasterProvider>
        {children}
      </FarcasterProvider>
    </WagmiProvider>
  );
}
