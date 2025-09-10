import React from 'react';
import '../App.css';

const Achievements: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Achievements</h1>
      </div>
      <div className="features-grid">
        <div className="feature-card"><h3>Starter Recycler</h3><p>Complete first collection</p></div>
        <div className="feature-card"><h3>Eco Saver</h3><p>Earn 500 EcoTokens</p></div>
        <div className="feature-card"><h3>Plastic Hero</h3><p>Recycle 50kg plastic</p></div>
      </div>
    </div>
  );
};

export default Achievements;

