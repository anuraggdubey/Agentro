"use client";

import {
  Networks as KitNetworks,
  StellarWalletsKit,
  type ISupportedWallet,
  type KitEventStateUpdated,
  KitEventType,
} from "@creit.tech/stellar-wallets-kit";
import { ALBEDO_ID } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { XBULL_ID } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import {
  createContext,
  startTransition,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { friendlyError } from "@/lib/stellar";

type WalletContextValue = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  selectedWalletId: string | null;
  wallets: ISupportedWallet[];
  error: string | null;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshWallets: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextValue | null>(null);

const SUPPORTED_WALLETS = new Set([FREIGHTER_ID, ALBEDO_ID, XBULL_ID]);

function getWalletNetwork() {
  return KitNetworks.TESTNET;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const hasInitialized = useRef(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<ISupportedWallet[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refreshWallets() {
    const supported = await StellarWalletsKit.refreshSupportedWallets();
    setWallets(supported.filter((wallet) => SUPPORTED_WALLETS.has(wallet.id)));
  }

  async function connectWallet(walletId: string) {
    try {
      setIsConnecting(true);
      setError(null);
      StellarWalletsKit.setWallet(walletId);
      const result = await StellarWalletsKit.selectedModule.getAddress();
      setSelectedWalletId(walletId);
      setAddress(result.address);
      setIsConnected(true);
    } catch (connectionError) {
      setError(friendlyError(connectionError));
      setIsConnected(false);
      throw connectionError;
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnectWallet() {
    try {
      await StellarWalletsKit.disconnect();
    } catch {
      // Some wallets are stateless and can safely ignore disconnect errors.
    } finally {
      setAddress(null);
      setIsConnected(false);
      setSelectedWalletId(null);
    }
  }

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    StellarWalletsKit.init({
      network: getWalletNetwork(),
      modules: defaultModules({
        filterBy(module) {
          return SUPPORTED_WALLETS.has(module.productId);
        },
      }),
    });

    refreshWallets()
      .then(() => undefined)
      .catch(() => {
        // No stored wallet session is okay on first load.
      })
      .finally(() => setIsInitialized(true));

    const unsubscribeState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event: KitEventStateUpdated) => {
        startTransition(() => {
          setAddress(event.payload.address ?? null);
          setIsConnected(Boolean(event.payload.address));
        });
      },
    );

    const unsubscribeWallet = StellarWalletsKit.on(
      KitEventType.WALLET_SELECTED,
      (event) => {
        setSelectedWalletId(event.payload.id ?? null);
      },
    );

    const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setIsConnected(false);
      setSelectedWalletId(null);
    });

    return () => {
      unsubscribeState();
      unsubscribeWallet();
      unsubscribeDisconnect();
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        isInitialized,
        selectedWalletId,
        wallets,
        error,
        connectWallet,
        disconnectWallet,
        refreshWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
