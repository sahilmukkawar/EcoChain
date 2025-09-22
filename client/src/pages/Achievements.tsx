import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEcoChain } from '../contexts/EcoChainContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  category: 'recycling' | 'tokens' | 'environmental' | 'community';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: {
    tokens: number;
    badge?: string;
  };
}

const Achievements: React.FC = () => {
  const { user } = useAuth();
  const { collectionHistory, totalEcoTokens, environmentalImpact } = useEcoChain();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Mock achievements data - in real app, this would come from an API
  const [achievements] = useState<Achievement[]>([
    {
      id: 'first_collection',
      title: 'Starter Recycler',
      description: 'Complete your first waste collection',
      icon: '🌱',
      progress: collectionHistory?.length > 0 ? 1 : 0,
      maxProgress: 1,
      isUnlocked: collectionHistory?.length > 0,
      unlockedAt: collectionHistory?.length > 0 ? new Date() : undefined,
      category: 'recycling',
      rarity: 'common',
      reward: { tokens: 50 }
    },
    {
      id: 'eco_saver',
      title: 'Eco Saver',
      description: 'Earn 500 EcoTokens',
      icon: '💰',
      progress: Math.min(totalEcoTokens || 0, 500),
      maxProgress: 500,
      isUnlocked: (totalEcoTokens || 0) >= 500,
      unlockedAt: (totalEcoTokens || 0) >= 500 ? new Date() : undefined,
      category: 'tokens',
      rarity: 'common',
      reward: { tokens: 100 }
    },
    {
      id: 'plastic_hero',
      title: 'Plastic Hero',
      description: 'Recycle 50kg of plastic waste',
      icon: '♻️',
      progress: Math.min(25, 50), // Mock progress
      maxProgress: 50,
      isUnlocked: false,
      category: 'recycling',
      rarity: 'rare',
      reward: { tokens: 200, badge: 'Plastic Warrior' }
    },
    {
      id: 'carbon_saver',
      title: 'Carbon Crusher',
      description: 'Save 100kg of CO2 through recycling',
      icon: '🌍',
      progress: Math.min(environmentalImpact?.co2Saved || 0, 100),
      maxProgress: 100,
      isUnlocked: (environmentalImpact?.co2Saved || 0) >= 100,
      category: 'environmental',
      rarity: 'epic',
      reward: { tokens: 500, badge: 'Earth Protector' }
    },
    {
      id: 'token_master',
      title: 'Token Master',
      description: 'Accumulate 2000 EcoTokens',
      icon: '👑',
      progress: Math.min(totalEcoTokens || 0, 2000),
      maxProgress: 2000,
      isUnlocked: (totalEcoTokens || 0) >= 2000,
      category: 'tokens',
      rarity: 'legendary',
      reward: { tokens: 1000, badge: 'Token King' }
    },
    {
      id: 'consistency_champion',
      title: 'Consistency Champion',
      description: 'Complete collections for 7 consecutive days',
      icon: '⭐',
      progress: 3, // Mock progress
      maxProgress: 7,
      isUnlocked: false,
      category: 'community',
      rarity: 'epic',
      reward: { tokens: 300, badge: 'Dedicated Recycler' }
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Achievements'},
    { id: 'recycling', label: 'Recycling'},
    { id: 'tokens', label: 'EcoTokens'},
    { id: 'environmental', label: 'Environmental'},
    { id: 'community', label: 'Community'}
  ];

  const filteredAchievements = activeFilter === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === activeFilter);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalProgress = achievements.reduce((sum, a) => sum + (a.progress / a.maxProgress) * 100, 0) / achievements.length;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-amber-300 bg-amber-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-700';
      case 'rare': return 'text-blue-700';
      case 'epic': return 'text-purple-700';
      case 'legendary': return 'text-amber-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
              <p className="text-sm text-gray-500">Track your eco-friendly milestones and earn rewards</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Achievement Progress Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>{unlockedCount}/{achievements.length} Unlocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{unlockedCount}</p>
                <p className="text-xs text-gray-500 mt-1">of {achievements.length} available</p>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-3xl font-bold text-eco-green-600 mt-2">{Math.round(totalProgress)}%</p>
                <p className="text-xs text-gray-500 mt-1">completion rate</p>
              </div>
              <div className="h-12 w-12 bg-eco-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rewards Earned</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + (a.reward?.tokens || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">bonus tokens</p>
              </div>
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === category.id
                    ? 'bg-eco-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                achievement.isUnlocked 
                  ? `${getRarityColor(achievement.rarity)} shadow-md` 
                  : 'bg-white border-gray-200 opacity-75'
              }`}
            >
              {/* Unlocked Badge */}
              {achievement.isUnlocked && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-eco-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="p-6">
                {/* Achievement Icon & Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <h3 className={`text-lg font-bold ${achievement.isUnlocked ? getRarityTextColor(achievement.rarity) : 'text-gray-600'}`}>
                      {achievement.title}
                    </h3>
                    <div className={`text-xs font-medium uppercase tracking-wider ${getRarityTextColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{achievement.progress} / {achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-sm h-2">
                    <div 
                      className={`h-2 rounded-sm transition-all duration-300 ${
                        achievement.isUnlocked ? 'bg-eco-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round((achievement.progress / achievement.maxProgress) * 100)}% Complete
                  </div>
                </div>

                {/* Reward */}
                {achievement.reward && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-1">Reward</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="text-eco-green-600 font-medium">{achievement.reward.tokens} tokens</span>
                      </div>
                      {achievement.reward.badge && (
                        <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          🏆 {achievement.reward.badge}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Unlock Date */}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Unlocked {achievement.unlockedAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No achievements in this category</h3>
            <p className="text-gray-600">Try selecting a different category to see more achievements.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
