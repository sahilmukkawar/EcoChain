import React from 'react';
import '../App.css';

const CollectorDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Collector Dashboard</h1></div>
      <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
        <div className="stat-card"><h3>Today Pickups</h3><p>—</p></div>
        <div className="stat-card"><h3>Earnings</h3><p>—</p></div>
        <div className="stat-card"><h3>Route Stops</h3><p>—</p></div>
      </section>
      <div className="features-grid" style={{marginTop:16}}>
        <div className="feature-card"><h3>Route Optimization</h3><p>AI-powered routing</p></div>
        <div className="feature-card"><h3>Collection Management</h3><p>Scan & verify</p></div>
        <div className="feature-card"><h3>Earnings Tracker</h3><p>Real-time metrics</p></div>
        <div className="feature-card"><h3>Navigation</h3><p>Integrated GPS</p></div>
        <div className="feature-card"><h3>Quality Scanner</h3><p>Camera assessment</p></div>
      </div>
    </div>
  );
};

export default CollectorDashboard;

