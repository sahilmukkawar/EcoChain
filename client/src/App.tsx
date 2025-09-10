import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Marketplace from './pages/Marketplace.tsx';
import Wallet from './pages/Wallet.tsx';
import Achievements from './pages/Achievements.tsx';
import FactoryDashboard from './pages/FactoryDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import CollectorDashboard from './pages/CollectorDashboard.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Contexts
import { SyncProvider } from './contexts/SyncContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';

// Components
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';

function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/factory" element={<ProtectedRoute roles={["factory","admin"]}><FactoryDashboard /></ProtectedRoute>} />
              <Route path="/collector" element={<ProtectedRoute roles={["collector","admin"]}><CollectorDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;