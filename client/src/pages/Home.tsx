import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to EcoChain</h1>
        <p className="text-xl text-gray-600 mb-8">Revolutionizing waste management through blockchain technology</p>
        <a 
          href="/marketplace" 
          className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-xl transition-all duration-300"
        >
          Explore Marketplace
        </a>
      </section>
      
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Our Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-3">Waste Tracking</h3>
            <p className="text-gray-600">Track your waste collection and recycling efforts</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-3">Reward System</h3>
            <p className="text-gray-600">Earn tokens for your environmental contributions</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-3">Marketplace</h3>
            <p className="text-gray-600">Trade recycled goods and services</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;