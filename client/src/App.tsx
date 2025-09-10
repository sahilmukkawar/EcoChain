import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header.tsx';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import MarketplacePage from './pages/Marketplace.tsx';

// Import pages as they are created
// import Home from './pages/Home';
// import Dashboard from './pages/Dashboard';
// import Marketplace from './pages/Marketplace';
// import CollectionRequest from './pages/CollectionRequest';
// import FactoryDashboard from './pages/FactoryDashboard';
// import AdminPortal from './pages/AdminPortal';
// import Wallet from './pages/Wallet';
// import Achievements from './pages/Achievements';

// Temporary placeholder components can be implemented in their own files later
const Dashboard = () => <div>User Dashboard - Coming Soon</div>;
// const Marketplace = () => <div>Marketplace - Coming Soon</div>;
const CollectionRequest = () => <div>Collection Request - Coming Soon</div>;
const FactoryDashboard = () => <div>Factory Dashboard - Coming Soon</div>;
const AdminPortal = () => <div>Admin Portal - Coming Soon</div>;
const Wallet = () => <div>Wallet - Coming Soon</div>;
const Achievements = () => <div>Achievements - Coming Soon</div>;

function App() {
  return (
    <div className="App">
      <Header />
      
      <main className="App-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/collection-request" element={<CollectionRequest />} />
          <Route path="/factory-dashboard" element={<FactoryDashboard />} />
          <Route path="/admin-portal" element={<AdminPortal />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/achievements" element={<Achievements />} />
        </Routes>
      </main>
      
      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About EcoChain</h4>
            <p>Transforming waste into wealth by connecting garbage collectors, users, and recycling factories in a sustainable ecosystem.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/marketplace">Marketplace</a></li>
              <li><a href="/collection-request">Request Collection</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@ecochain.com</p>
            <p>Phone: +1 (123) 456-7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} EcoChain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;