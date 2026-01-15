import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { useEffect, useState, useCallback } from 'react';
import { defaultChain, cronosTestnet } from './chains';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong-network';

// Debug logging helper
const debugLog = (message: string, data?: unknown) => {
  console.log(`[useWallet] ${message}`, data !== undefined ? data : '');
};

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: wagmiWalletClient, isLoading: isWagmiClientLoading } = useWalletClient();

  // Fallback walletClient created directly from window.ethereum
  const [fallbackWalletClient, setFallbackWalletClient] = useState<WalletClient | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  // Check if on correct network
  const isCorrectNetwork = chainId === defaultChain.id;

  // Create fallback walletClient from window.ethereum when wagmi fails
  const createFallbackClient = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      debugLog('No window.ethereum available');
      return null;
    }

    debugLog('Creating fallback walletClient from window.ethereum...');
    debugLog('window.ethereum details:', {
      isMetaMask: (window.ethereum as { isMetaMask?: boolean }).isMetaMask,
      isCryptoComWallet: (window.ethereum as { isCryptoComWallet?: boolean }).isCryptoComWallet,
    });

    try {
      setIsFallbackLoading(true);

      // Request accounts to ensure we have permission
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      debugLog('Accounts from eth_requestAccounts:', accounts);

      if (!accounts || accounts.length === 0) {
        debugLog('No accounts returned');
        return null;
      }

      // Get current chainId from provider
      const providerChainId = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;

      debugLog('Provider chainId (hex):', providerChainId);
      debugLog('Provider chainId (decimal):', parseInt(providerChainId, 16));

      // Create walletClient using viem directly
      const client = createWalletClient({
        account: accounts[0] as `0x${string}`,
        chain: cronosTestnet, // Force Cronos Testnet for hackathon
        transport: custom(window.ethereum),
      });

      debugLog('Fallback walletClient created successfully');
      debugLog('WalletClient account:', client.account?.address);
      debugLog('WalletClient chain:', client.chain?.name);

      setFallbackWalletClient(client);
      return client;
    } catch (error) {
      debugLog('Error creating fallback walletClient:', error);
      return null;
    } finally {
      setIsFallbackLoading(false);
    }
  }, []);

  // Try to create fallback client when connected but wagmi client is unavailable
  useEffect(() => {
    const shouldCreateFallback =
      isConnected &&
      !wagmiWalletClient &&
      !isWagmiClientLoading &&
      !fallbackWalletClient &&
      !isFallbackLoading;

    debugLog('Fallback check:', {
      isConnected,
      hasWagmiClient: !!wagmiWalletClient,
      isWagmiClientLoading,
      hasFallbackClient: !!fallbackWalletClient,
      isFallbackLoading,
      shouldCreateFallback,
    });

    if (shouldCreateFallback) {
      debugLog('Triggering fallback client creation...');
      createFallbackClient();
    }
  }, [
    isConnected,
    wagmiWalletClient,
    isWagmiClientLoading,
    fallbackWalletClient,
    isFallbackLoading,
    createFallbackClient,
  ]);

  // Clear fallback when disconnected
  useEffect(() => {
    if (!isConnected && fallbackWalletClient) {
      debugLog('Clearing fallback client (disconnected)');
      setFallbackWalletClient(null);
    }
  }, [isConnected, fallbackWalletClient]);

  // Use wagmi client if available, otherwise use fallback
  const walletClient = wagmiWalletClient || fallbackWalletClient;
  const isWalletClientLoading = isWagmiClientLoading || isFallbackLoading;

  // Log final state
  useEffect(() => {
    debugLog('Final wallet state:', {
      isConnected,
      address,
      chainId,
      isCorrectNetwork,
      hasWagmiClient: !!wagmiWalletClient,
      hasFallbackClient: !!fallbackWalletClient,
      hasWalletClient: !!walletClient,
      isWalletClientLoading,
    });
  }, [
    isConnected,
    address,
    chainId,
    isCorrectNetwork,
    wagmiWalletClient,
    fallbackWalletClient,
    walletClient,
    isWalletClientLoading,
  ]);

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
    debugLog('Connecting with injected connector...');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      debugLog('No injected connector found, opening MetaMask download page');
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  // Connect with WalletConnect
  const connectWalletConnect = () => {
    debugLog('Connecting with WalletConnect...');
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  };

  // Switch to default network (adds chain if not recognized)
  const switchToDefaultNetwork = async () => {
    debugLog('Switching to default network:', defaultChain.name);

    if (!switchChain) {
      debugLog('switchChain not available, trying direct method');
      // Try direct method with window.ethereum
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${defaultChain.id.toString(16)}` }],
          });
          debugLog('Direct switch successful');
        } catch (switchError: unknown) {
          // Chain not added, try to add it
          if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
            debugLog('Chain not found, adding it...');
            await addChainToWallet();
          }
        }
      }
      return;
    }

    try {
      switchChain({ chainId: defaultChain.id });
    } catch (error: unknown) {
      debugLog('Switch chain error:', error);
      // If chain not recognized, add it first
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        await addChainToWallet();
      }
    }
  };

  // Add Cronos chain to wallet
  const addChainToWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    debugLog('Adding chain to wallet:', defaultChain.name);
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${defaultChain.id.toString(16)}`,
          chainName: defaultChain.name,
          nativeCurrency: defaultChain.nativeCurrency,
          rpcUrls: [defaultChain.rpcUrls.default.http[0]],
          blockExplorerUrls: [defaultChain.blockExplorers?.default.url],
        }],
      });
      debugLog('Chain added successfully');
    } catch (addError) {
      debugLog('Failed to add chain:', addError);
    }
  };

  // Force refresh walletClient (useful after network switch)
  const refreshWalletClient = useCallback(async () => {
    debugLog('Force refreshing walletClient...');
    setFallbackWalletClient(null);
    // Small delay then recreate
    setTimeout(() => {
      createFallbackClient();
    }, 500);
  }, [createFallbackClient]);

  // Format address for display
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // Wallet is fully ready for signing
  const isWalletReady = isConnected && !isWalletClientLoading && !!walletClient && isCorrectNetwork;

  debugLog('Returning from hook:', { isWalletReady, hasWalletClient: !!walletClient });

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
    refreshWalletClient,

    // Connectors availability
    hasInjected: !!injectedConnector,
    hasWalletConnect: !!walletConnectConnector,

    // For x402 integration
    walletClient,
    isWalletClientLoading,
    isWalletReady,

    // Debug info
    hasWagmiClient: !!wagmiWalletClient,
    hasFallbackClient: !!fallbackWalletClient,
  };
}

// x402-ready interface
export function getWalletInterface(walletClient: ReturnType<typeof useWallet>['walletClient']) {
  if (!walletClient) {
    return null;
  }

  return {
    getWalletClient: () => walletClient,
    getAccountAddress: () => walletClient.account?.address,
    getChainId: () => walletClient.chain?.id,
  };
}
