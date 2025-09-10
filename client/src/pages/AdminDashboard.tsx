import React from 'react';
import '../App.css';

const AdminDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Admin Portal</h1></div>
      <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
        <div className="stat-card"><h3>Users</h3><p>—</p></div>
        <div className="stat-card"><h3>Transactions</h3><p>—</p></div>
        <div className="stat-card"><h3>Revenue</h3><p>—</p></div>
      </section>
      <div className="features-grid" style={{marginTop:16}}>
        <div className="feature-card"><h3>User Management</h3><p>Oversee users and roles</p></div>
        <div className="feature-card"><h3>Analytics</h3><p>Business intelligence</p></div>
        <div className="feature-card"><h3>Configuration</h3><p>System and rules</p></div>
        <div className="feature-card"><h3>Support</h3><p>Disputes & customer care</p></div>
        <div className="feature-card"><h3>Finance</h3><p>Reports and commissions</p></div>
      </div>
    </div>
  );
};

export default AdminDashboard;

