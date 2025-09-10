import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EcoToken {
  id: string;
  amount: number;
  date: string;
  source: string;
}

interface CollectionHistory {
  id: string;
  date: string;
  wasteType: string;
  quantity: number;
  tokensEarned: number;
  status: 'pending' | 'collected' | 'processed';
}

interface EnvironmentalImpact {
  wasteRecycled: number;
  co2Reduced: number;
  treesEquivalent: number;
  waterSaved: number;
}

interface EcoChainContextType {
  ecoTokens: EcoToken[];
  collectionHistory: CollectionHistory[];
  environmentalImpact: EnvironmentalImpact;
  totalEcoTokens: number;
  fetchEcoTokens: () => Promise<void>;
  fetchCollectionHistory: () => Promise<void>;
  fetchEnvironmentalImpact: () => Promise<void>;
}

const EcoChainContext = createContext<EcoChainContextType | undefined>(undefined);

export const useEcoChain = () => {
  const context = useContext(EcoChainContext);
  if (!context) {
    throw new Error('useEcoChain must be used within an EcoChainProvider');
  }
  return context;
};

interface EcoChainProviderProps {
  children: ReactNode;
}

export const EcoChainProvider: React.FC<EcoChainProviderProps> = ({ children }) => {
  const [ecoTokens, setEcoTokens] = useState<EcoToken[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistory[]>([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState<EnvironmentalImpact>({
    wasteRecycled: 0,
    co2Reduced: 0,
    treesEquivalent: 0,
    waterSaved: 0,
  });

  const totalEcoTokens = ecoTokens.reduce((sum, token) => sum + token.amount, 0);

  // Mock API calls - would be replaced with actual API calls in a real application
  const fetchEcoTokens = async () => {
    // Simulate API call
    try {
      // Mock data
      const mockEcoTokens: EcoToken[] = [
        { id: '1', amount: 50, date: '2023-10-15', source: 'Plastic recycling' },
        { id: '2', amount: 30, date: '2023-10-10', source: 'Paper recycling' },
        { id: '3', amount: 25, date: '2023-10-05', source: 'Glass recycling' },
        { id: '4', amount: 40, date: '2023-09-28', source: 'E-waste recycling' },
      ];
      setEcoTokens(mockEcoTokens);
    } catch (error) {
      console.error('Error fetching eco tokens:', error);
    }
  };

  const fetchCollectionHistory = async () => {
    // Simulate API call
    try {
      // Mock data
      const mockCollectionHistory: CollectionHistory[] = [
        { id: '1', date: '2023-10-15', wasteType: 'Plastic', quantity: 5, tokensEarned: 50, status: 'processed' },
        { id: '2', date: '2023-10-10', wasteType: 'Paper', quantity: 3, tokensEarned: 30, status: 'processed' },
        { id: '3', date: '2023-10-05', wasteType: 'Glass', quantity: 2.5, tokensEarned: 25, status: 'processed' },
        { id: '4', date: '2023-09-28', wasteType: 'E-waste', quantity: 4, tokensEarned: 40, status: 'processed' },
        { id: '5', date: '2023-10-20', wasteType: 'Plastic', quantity: 3, tokensEarned: 30, status: 'pending' },
      ];
      setCollectionHistory(mockCollectionHistory);
    } catch (error) {
      console.error('Error fetching collection history:', error);
    }
  };

  const fetchEnvironmentalImpact = async () => {
    // Simulate API call
    try {
      // Mock data
      const mockEnvironmentalImpact: EnvironmentalImpact = {
        wasteRecycled: 14.5, // kg
        co2Reduced: 43.5, // kg
        treesEquivalent: 2,
        waterSaved: 290, // liters
      };
      setEnvironmentalImpact(mockEnvironmentalImpact);
    } catch (error) {
      console.error('Error fetching environmental impact:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchEcoTokens();
    fetchCollectionHistory();
    fetchEnvironmentalImpact();
  }, []);

  const value = {
    ecoTokens,
    collectionHistory,
    environmentalImpact,
    totalEcoTokens,
    fetchEcoTokens,
    fetchCollectionHistory,
    fetchEnvironmentalImpact,
  };

  return <EcoChainContext.Provider value={value}>{children}</EcoChainContext.Provider>;
};