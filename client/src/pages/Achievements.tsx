import React from 'react';

const Achievements: React.FC = () => {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Achievements</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-white/5 to-white/2 border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Starter Recycler</h3>
          <p className="text-gray-300">Complete first collection</p>
        </div>
        <div className="bg-gradient-to-b from-white/5 to-white/2 border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Eco Saver</h3>
          <p className="text-gray-300">Earn 500 EcoTokens</p>
        </div>
        <div className="bg-gradient-to-b from-white/5 to-white/2 border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Plastic Hero</h3>
          <p className="text-gray-300">Recycle 50kg plastic</p>
        </div>
      </div>
    </div>
  );
};

export default Achievements;