import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { cronosMainnet, cronosTestnet, supportedChains, defaultChain } from './chains';

// WalletConnect Project ID
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

// WalletConnect metadata
const wcMetadata = {
  name: 'CronosIA Ops',
  description: 'Operational assistant for Cronos x402 flows',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://cronosia.ops',
  icons: ['/images/NuevoLogo.png'],
};

// Create config with connectors
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: walletConnectProjectId
    ? [
        injected({ shimDisconnect: true }),
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: wcMetadata,
          showQrModal: true,
        }),
      ]
    : [injected({ shimDisconnect: true })],
  transports: {
    [cronosMainnet.id]: http(),
    [cronosTestnet.id]: http(),
  },
});

export { walletConnectProjectId, defaultChain };
