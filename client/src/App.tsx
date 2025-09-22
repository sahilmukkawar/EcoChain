import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { EcoChainProvider } from './contexts/EcoChainContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import WasteSubmission from './pages/WasteSubmission';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './components/Analytics';
import FactoryManagement from './components/FactoryManagement';
import FactoryDashboard from './pages/FactoryDashboard';
import FactoryProductManagement from './pages/FactoryProductManagement';
import CollectorDashboard from './pages/CollectorDashboard';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import PickupScheduling from './pages/PickupScheduling';
import CustomerHelpCenter from './pages/CustomerHelpCenter';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Achievements from './pages/Achievements';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import FactoryOrders from './pages/FactoryOrders';
import Profile from './pages/Profile';
import PendingApproval from './pages/PendingApproval';
import FactoryApplicationForm from './pages/FactoryApplicationForm';
import CollectorApplicationForm from './pages/CollectorApplicationForm';
import Materials from './pages/Materials';

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
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pending-approval" element={<ProtectedRoute element={<PendingApproval />} allowedRoles={['factory', 'collector']} />} />
                <Route path="/factory-application" element={<ProtectedRoute element={<FactoryApplicationForm />} allowedRoles={['factory']} />} />
                <Route path="/collector-application" element={<ProtectedRoute element={<CollectorApplicationForm />} allowedRoles={['collector']} />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/waste-submission" element={<WasteSubmission />} />
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['user']} />} />
                <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} />
                <Route path="/admin-dashboard/analytics" element={<ProtectedRoute element={<Analytics />} allowedRoles={['admin']} />} />
                <Route path="/admin-dashboard/factory" element={<ProtectedRoute element={<FactoryManagement />} allowedRoles={['admin']} />} />
                <Route path="/factory-dashboard" element={<ProtectedRoute element={<FactoryDashboard />} allowedRoles={['factory']} />} />
                <Route path="/factory-product-management" element={<ProtectedRoute element={<FactoryProductManagement />} allowedRoles={['factory']} />} />
                <Route path="/factory-orders" element={<ProtectedRoute element={<FactoryOrders />} allowedRoles={['factory']} />} />
                <Route path="/materials" element={<ProtectedRoute element={<Materials />} allowedRoles={['factory']} />} />
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