import { defineChain } from 'viem';

export const cronosMainnet = defineChain({
  id: 25,
  name: 'Cronos',
  nativeCurrency: {
    decimals: 18,
    name: 'Cronos',
    symbol: 'CRO',
  },
  rpcUrls: {
    default: { http: ['https://evm.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: 'https://explorer.cronos.org' },
  },
});

export const cronosTestnet = defineChain({
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test CRO',
    symbol: 'TCRO',
  },
  rpcUrls: {
    default: { http: ['https://evm-t3.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: 'https://explorer.cronos.org/testnet' },
  },
  testnet: true,
});

export const supportedChains = [cronosTestnet, cronosMainnet] as const;

// Get default chain from env
function getDefaultChain() {
  const networkEnv = import.meta.env.VITE_CRONOS_NETWORK;

  if (networkEnv === 'mainnet') {
    return cronosMainnet;
  }

  if (networkEnv && networkEnv !== 'testnet') {
    console.warn(`Invalid VITE_CRONOS_NETWORK: "${networkEnv}". Defaulting to testnet.`);
  }

  return cronosTestnet;
}

export const defaultChain = getDefaultChain();
