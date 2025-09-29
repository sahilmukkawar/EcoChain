import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import wasteService, { WasteSubmission } from '../services/wasteService';
import userService, { User } from '../services/userService';
import websocketService from '../services/websocketService';

interface EnvironmentalImpact {
  co2Saved: number;
  treesEquivalent: number;
  waterSaved: number;
}

interface EcoChainContextType {
  collectionHistory: WasteSubmission[];
  pendingCollections: WasteSubmission[];
  completedCollections: WasteSubmission[];
  totalEcoTokens: number;
  environmentalImpact: EnvironmentalImpact;
  refreshCollections: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const EcoChainContext = createContext<EcoChainContextType | undefined>(undefined);

// Cache for collections data to reduce API calls
let collectionsCache: WasteSubmission[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export const EcoChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [collectionHistory, setCollectionHistory] = useState<WasteSubmission[]>([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState<EnvironmentalImpact>({
    co2Saved: 0,
    treesEquivalent: 0,
    waterSaved: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derived states
  const pendingCollections = Array.isArray(collectionHistory) ? collectionHistory.filter(
    collection => ['requested', 'scheduled', 'in_progress'].includes(collection.status)
  ) : [];
  
  const completedCollections = Array.isArray(collectionHistory) ? collectionHistory.filter(
    collection => collection.status === 'completed'
  ) : [];

  const totalEcoTokens = user?.ecoWallet?.currentBalance || 0;

  // Fetch user's waste collection history with caching
  const refreshCollections = useCallback(async () => {
    if (!user) return;
    
    // Check if we have valid cached data
    const now = Date.now();
    if (collectionsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      setCollectionHistory(collectionsCache);
      calculateEnvironmentalImpact(collectionsCache);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Retry up to 3 times with exponential backoff
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const collections = await wasteService.getUserSubmissions();
          // Ensure we always set an array
          const collectionData = Array.isArray(collections?.data?.collections) ? collections.data.collections : [];
          
          // Update cache
          collectionsCache = collectionData;
          lastFetchTime = now;
          
          setCollectionHistory(collectionData);
          
          // Calculate environmental impact based on collections
          calculateEnvironmentalImpact(collectionData);
          break; // Success, exit the retry loop
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw err; // Re-throw if we've exhausted all attempts
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch collection history:', error);
      const errorMessage = error.message || 'Failed to load collection history. Please try again later.';
      setError(errorMessage);
      // Set empty array on error to prevent filter errors
      setCollectionHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh user data including token balance
  const refreshUserData = async () => {
    try {
      if (user) {
        const updatedUser = await userService.getCurrentUser();
        // Note: setUser should be available from AuthContext
        // If not available, we'll need to trigger a refresh through AuthContext methods
        console.log('Updated user data:', updatedUser);
        // The AuthContext should handle updating the user state
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Calculate environmental impact based on waste collections
  const calculateEnvironmentalImpact = (collections: WasteSubmission[]) => {
    // Ensure collections is always an array
    const safeCollections = Array.isArray(collections) ? collections : [];
    
    // Simple calculation based on waste type and quantity
    // These are placeholder values - in a real app, you'd use more accurate conversion factors
    let co2Saved = 0;
    let treesEquivalent = 0;
    let waterSaved = 0;

    safeCollections.forEach(collection => {
      const quantity = collection.collectionDetails?.weight || 0;
      
      switch (collection.collectionDetails?.type) {
        case 'plastic':
          co2Saved += quantity * 2.5; // kg of CO2 saved per kg of plastic recycled
          waterSaved += quantity * 100; // liters of water saved
          break;
        case 'paper':
          co2Saved += quantity * 1.8;
          treesEquivalent += quantity * 0.017; // trees saved per kg of paper
          break;
        case 'glass':
          co2Saved += quantity * 0.3;
          waterSaved += quantity * 50;
          break;
        case 'metal':
          co2Saved += quantity * 4.0;
          waterSaved += quantity * 20;
          break;
        case 'electronics':
          co2Saved += quantity * 5.0;
          waterSaved += quantity * 30;
          break;
        default:
          co2Saved += quantity * 0.5;
      }
    });

    setEnvironmentalImpact({
      co2Saved: Math.round(co2Saved * 10) / 10, // Round to 1 decimal place
      treesEquivalent: Math.round(treesEquivalent * 10) / 10,
      waterSaved: Math.round(waterSaved)
    });
  };

  // WebSocket handler for real-time updates
  useEffect(() => {
    if (!user) return;
    
    // Set up WebSocket handler for garbage collection updates
    const handleSyncMessage = (message: any) => {
      if (message.entityType === 'garbage_collection') {
        console.log('Received garbage collection update:', message);
        // Refresh collections when we get an update
        refreshCollections();
      }
    };
    
    // Subscribe to garbage collection updates
    websocketService.on('sync', handleSyncMessage);
    
    // Clean up WebSocket handler
    return () => {
      websocketService.off('sync', handleSyncMessage);
    };
  }, [user, refreshCollections]);

  // Clear cache when user changes
  useEffect(() => {
    collectionsCache = null;
    lastFetchTime = null;
  }, [user?.id]);

  // Initial data load
  useEffect(() => {
    if (user) {
      refreshCollections();
    }
  }, [user, refreshCollections]);

  const contextValue: EcoChainContextType = {
    collectionHistory,
    pendingCollections,
    completedCollections,
    totalEcoTokens,
    environmentalImpact,
    refreshCollections,
    refreshUserData,
    loading,
    error
  };

  return (
    <EcoChainContext.Provider value={contextValue}>
      {children}
    </EcoChainContext.Provider>
  );
};

export const useEcoChain = () => {
  const context = useContext(EcoChainContext);
  if (context === undefined) {
    throw new Error('useEcoChain must be used within an EcoChainProvider');
  }
  return context;
};