import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Re-export the AuthProvider and useAuth from mockHooks
export { AuthProvider, useAuth } from './mockHooks.tsx';

// Re-export the CartProvider and useCart from mockHooks
export { CartProvider, useCart } from './mockHooks.tsx';

// SyncContext for data synchronization
interface SyncContextType {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncData: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  lastSynced: null,
  syncData: async () => {}
});

export const SyncProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const syncData = async () => {
    setIsSyncing(true);
    // Mock sync operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastSynced(new Date());
    setIsSyncing(false);
  };

  // Initial sync
  useEffect(() => {
    syncData();
  }, []);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSynced, syncData }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);

// EcoChainContext for platform-specific data
interface EcoChainContextType {
  stats: {
    totalWasteRecycled: number;
    totalTokensIssued: number;
    activeCommunities: number;
  };
  refreshStats: () => Promise<void>;
}

const EcoChainContext = createContext<EcoChainContextType>({
  stats: {
    totalWasteRecycled: 0,
    totalTokensIssued: 0,
    activeCommunities: 0
  },
  refreshStats: async () => {}
});

export const EcoChainProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [stats, setStats] = useState({
    totalWasteRecycled: 15000, // kg
    totalTokensIssued: 75000,
    activeCommunities: 12
  });

  const refreshStats = async () => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update with random increases
    setStats(prev => ({
      totalWasteRecycled: prev.totalWasteRecycled + Math.floor(Math.random() * 100),
      totalTokensIssued: prev.totalTokensIssued + Math.floor(Math.random() * 500),
      activeCommunities: prev.activeCommunities + (Math.random() > 0.8 ? 1 : 0)
    }));
  };

  return (
    <EcoChainContext.Provider value={{ stats, refreshStats }}>
      {children}
    </EcoChainContext.Provider>
  );
};

export const useEcoChain = () => useContext(EcoChainContext);