import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { EcoChainProvider } from './contexts/EcoChainContext.tsx';
import Navigation from './components/Navigation.tsx';
import Footer from './components/Footer.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import Marketplace from './pages/Marketplace.tsx';
import WasteSubmission from './pages/WasteSubmission.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import Analytics from './components/Analytics.tsx';
import FactoryDashboard from './pages/FactoryDashboard.tsx';
import FactoryProductManagement from './pages/FactoryProductManagement.tsx';
import CollectorDashboard from './pages/CollectorDashboard.tsx';
import Checkout from './pages/Checkout.tsx';
import Cart from './pages/Cart.tsx';
import OrderConfirmation from './pages/OrderConfirmation.tsx';
import OrderTracking from './pages/OrderTracking.tsx';
import PickupScheduling from './pages/PickupScheduling.tsx';
import CustomerHelpCenter from './pages/CustomerHelpCenter.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Achievements from './pages/Achievements.tsx';
import Wallet from './pages/Wallet.tsx';
import Orders from './pages/Orders.tsx';
import FactoryOrders from './pages/FactoryOrders.tsx';
import Profile from './pages/Profile.tsx';

function App() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AuthProvider>
      <EcoChainProvider>
        <CartProvider>

          <Navigation />
          <main className="flex-grow "> {/* Add padding-top to account for fixed navbar */}
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/waste-submission" element={<WasteSubmission />} />
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['user']} />} />
                <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} />
                <Route path="/admin-dashboard/analytics" element={<ProtectedRoute element={<Analytics />} allowedRoles={['admin']} />} />
                <Route path="/factory-dashboard" element={<ProtectedRoute element={<FactoryDashboard />} allowedRoles={['factory']} />} />
                <Route path="/factory-product-management" element={<ProtectedRoute element={<FactoryProductManagement />} allowedRoles={['factory']} />} />
                <Route path="/factory-orders" element={<ProtectedRoute element={<FactoryOrders />} allowedRoles={['factory']} />} />
                <Route path="/collector-dashboard" element={<ProtectedRoute element={<CollectorDashboard />} allowedRoles={['collector']} />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/order-tracking/:trackingNumber" element={<OrderTracking />} />
                <Route path="/pickup-scheduling/:collectionId" element={<PickupScheduling />} />
                <Route path="/help" element={<CustomerHelpCenter />} />
                <Route path="/orders" element={<ProtectedRoute element={<Orders />} allowedRoles={['user']} />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/wallet" element={<ProtectedRoute element={<Wallet />} allowedRoles={['user']} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} allowedRoles={['user', 'admin', 'factory', 'collector']} />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />

        </CartProvider>
      </EcoChainProvider>
    </AuthProvider>
  );
}

export default App;