import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { defaultChain } from './config';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong-network';

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Check if on correct network
  const isCorrectNetwork = chainId === defaultChain.id;

  // Determine status
  const getStatus = (): WalletStatus => {
    if (isConnecting || isPending) return 'connecting';
    if (!isConnected) return 'disconnected';
    if (!isCorrectNetwork) return 'wrong-network';
    return 'connected';
  };

  // Get injected connector (for Crypto.com Onchain + MetaMask)
  const injectedConnector = connectors.find((c) => c.type === 'injected');

  // Get WalletConnect connector
  const walletConnectConnector = connectors.find((c) => c.type === 'walletConnect');

  // Connect with injected (Crypto.com Onchain / MetaMask)
  const connectInjected = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      // No wallet extension found - open MetaMask download page
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  // Connect with WalletConnect
  const connectWalletConnect = () => {
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  };

  // Switch to default network (adds chain if not recognized)
  const switchToDefaultNetwork = async () => {
    if (!switchChain) return;

    try {
      switchChain({ chainId: defaultChain.id });
    } catch (error: unknown) {
      // If chain not recognized, add it first
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${defaultChain.id.toString(16)}`,
              chainName: defaultChain.name,
              nativeCurrency: defaultChain.nativeCurrency,
              rpcUrls: [defaultChain.rpcUrls.default.http[0]],
              blockExplorerUrls: [defaultChain.blockExplorers?.default.url],
            }],
          });
        } catch (addError) {
          console.error('Failed to add chain:', addError);
        }
      }
    }
  };

  // Format address for display
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return {
    // State
    address,
    shortAddress,
    isConnected,
    isConnecting: isConnecting || isPending,
    chainId,
    isCorrectNetwork,
    status: getStatus(),
    defaultChain,

    // Actions
    connectInjected,
    connectWalletConnect,
    disconnect,
    switchToDefaultNetwork,

    // Connectors availability
    hasInjected: !!injectedConnector,
    hasWalletConnect: !!walletConnectConnector,

    // For x402 integration
    walletClient,
  };
}

// x402-ready interface
export function getWalletInterface(walletClient: ReturnType<typeof useWallet>['walletClient']) {
  if (!walletClient) {
    return null;
  }

  return {
    getWalletClient: () => walletClient,
    getAccountAddress: () => walletClient.account.address,
    getChainId: () => walletClient.chain.id,
  };
}
