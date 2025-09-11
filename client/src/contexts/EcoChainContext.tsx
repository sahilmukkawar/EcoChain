import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import wasteService, { WasteSubmission } from '../services/wasteService';
import { User } from '../services/userService';

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
}

const EcoChainContext = createContext<EcoChainContextType | undefined>(undefined);

export const EcoChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, setUser } = useAuth();
  const [collectionHistory, setCollectionHistory] = useState<WasteSubmission[]>([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState<EnvironmentalImpact>({
    co2Saved: 0,
    treesEquivalent: 0,
    waterSaved: 0
  });

  // Derived states
  const pendingCollections = collectionHistory.filter(
    collection => ['pending', 'approved'].includes(collection.status)
  );
  
  const completedCollections = collectionHistory.filter(
    collection => collection.status === 'collected'
  );

  const totalEcoTokens = user?.ecoTokens || 0;

  // Fetch user's waste collection history
  const refreshCollections = async () => {
    try {
      const collections = await wasteService.getUserSubmissions();
      setCollectionHistory(collections);
      
      // Calculate environmental impact based on collections
      calculateEnvironmentalImpact(collections);
    } catch (error) {
      console.error('Failed to fetch collection history:', error);
    }
  };

  // Refresh user data including token balance
  const refreshUserData = async () => {
    try {
      if (user) {
        // This assumes userService.getCurrentUser() is implemented
        const updatedUser = await userService.getCurrentUser();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Calculate environmental impact based on waste collections
  const calculateEnvironmentalImpact = (collections: WasteSubmission[]) => {
    // Simple calculation based on waste type and quantity
    // These are placeholder values - in a real app, you'd use more accurate conversion factors
    let co2Saved = 0;
    let treesEquivalent = 0;
    let waterSaved = 0;

    collections.forEach(collection => {
      const quantity = collection.quantity;
      
      switch (collection.wasteType) {
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

  // Initial data load
  useEffect(() => {
    if (user) {
      refreshCollections();
    }
  }, [user]);

  const contextValue: EcoChainContextType = {
    collectionHistory,
    pendingCollections,
    completedCollections,
    totalEcoTokens,
    environmentalImpact,
    refreshCollections,
    refreshUserData
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