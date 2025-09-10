import React from 'react';
import '../App.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to EcoChain</h1>
        <p>Revolutionizing waste management through blockchain technology</p>
        <a className="cta-button" href="/marketplace">Explore Marketplace</a>
      </section>
      
      <section className="features-section">
        <h2>Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Waste Tracking</h3>
            <p>Track your waste collection and recycling efforts</p>
          </div>
          <div className="feature-card">
            <h3>Reward System</h3>
            <p>Earn tokens for your environmental contributions</p>
          </div>
          <div className="feature-card">
            <h3>Marketplace</h3>
            <p>Trade recycled goods and services</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;