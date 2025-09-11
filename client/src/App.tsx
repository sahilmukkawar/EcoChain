import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider, SyncProvider, CartProvider, EcoChainProvider } from './mockContext.tsx';
import Navigation from './components/Navigation.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import Marketplace from './pages/Marketplace.tsx';
import WasteSubmission from './pages/WasteSubmission.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import FactoryDashboard from './pages/FactoryDashboard.tsx';
import CollectorDashboard from './pages/CollectorDashboard.tsx';
import Checkout from './pages/Checkout.tsx';
import OrderConfirmation from './pages/OrderConfirmation.tsx';
import OrderTracking from './pages/OrderTracking.tsx';
import PickupScheduling from './pages/PickupScheduling.tsx';
import CustomerHelpCenter from './pages/CustomerHelpCenter.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';

function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <CartProvider>
          <EcoChainProvider>
            <div className="App">
              <Navigation />
              <main className="App-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/waste-submission" element={<WasteSubmission />} />
                  <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['user']} />} />
                  <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} />
                  <Route path="/factory-dashboard" element={<ProtectedRoute element={<FactoryDashboard />} allowedRoles={['factory']} />} />
                  <Route path="/collector-dashboard" element={<ProtectedRoute element={<CollectorDashboard />} allowedRoles={['collector']} />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                  <Route path="/order-tracking/:trackingNumber" element={<OrderTracking />} />
                  <Route path="/pickup-scheduling/:collectionId" element={<PickupScheduling />} />
                  <Route path="/help" element={<CustomerHelpCenter />} />
                </Routes>
              </main>
              <footer className="App-footer">
                <p>&copy; {new Date().getFullYear()} EcoChain. All rights reserved.</p>
              </footer>
            </div>
          </EcoChainProvider>
        </CartProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;