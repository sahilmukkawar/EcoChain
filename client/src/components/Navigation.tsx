import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useCart } from "../contexts/CartContext.tsx";
import {
  User,
  Wallet,
  LogOut,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Settings,
  BarChart3,
  Users,
  Wrench,
  Factory,
  Package,
  Recycle,
  Truck,
  DollarSign,
  LayoutDashboard,
  Upload,
  Award,
  Leaf
} from "lucide-react";

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close profile dropdown on outside click
    if (!isProfileMenuOpen) return;
    function handler(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    // Close mobile menu on outside click
    if (!isMobileMenuOpen) return;
    function handler(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Role-based navigation items with proper icons
  function getNavigationItems() {
    const commonItems = [
      { to: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    ];
    
    if (!isAuthenticated) return commonItems;
    
    switch (user?.role) {
      case "admin":
        return [
          ...commonItems,
          { to: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/analytics", label: "Analytics", icon: BarChart3 },
          { to: "/users", label: "Manage Users", icon: Users },
          { to: "/system-config", label: "System Config", icon: Settings },
        ];
      case "factory":
        return [
          ...commonItems,
          { to: "/factory-dashboard", label: "Dashboard", icon: Factory },
          { to: "/factory-product-management", label: "Product Management", icon: Package },
          { to: "/materials", label: "Materials", icon: Recycle },
          { to: "/production", label: "Production", icon: Settings },
          { to: "/orders", label: "Orders", icon: ShoppingCart },
        ];
      case "collector":
        return [
          { to: "/collector-dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/collections", label: "Collections", icon: Recycle },
          { to: "/routes", label: "Routes", icon: Truck },
          { to: "/earnings", label: "Earnings", icon: DollarSign },
        ];
      default:
        return [
          ...commonItems,
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/waste-submission", label: "Submit Waste", icon: Upload },
          { to: "/wallet", label: "Wallet", icon: Wallet },
          { to: "/achievements", label: "Achievements", icon: Award },
        ];
    }
  }

  const navigationItems = getNavigationItems();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(prev => !prev);
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  // Cart Icon Button
  function CartButton() {
    const cartCount = cart.length;
    return (
      <Link
        to="/cart"
        className="relative p-2 rounded-full bg-green-50 hover:bg-green-100 transition-all text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        title={`Shopping Cart (${cartCount} items)`}
        aria-label={`Shopping Cart with ${cartCount} items`}
      >
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
    );
  }

  // Profile/Wallet Dropdown Button
  function ProfileDropdown() {
    return (
      <div className="relative" ref={profileMenuRef}>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          onClick={toggleProfileMenu}
          aria-label="Open profile menu"
          aria-expanded={isProfileMenuOpen}
          aria-haspopup="true"
        >
          <User size={20} className="text-green-600" />
          <span className="hidden md:inline font-medium text-green-700 max-w-32 truncate">
            {user?.name}
          </span>
          <ChevronDown 
            size={16} 
            className={`text-green-600 transition-transform duration-200 ${
              isProfileMenuOpen ? "rotate-180" : ""
            }`} 
          />
        </button>
        
        {isProfileMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white border border-gray-200 z-50 py-1 animate-in slide-in-from-top-2 duration-200">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <User size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-700 text-sm truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-green-600 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
            
            {/* EcoTokens Balance */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-green-800">
                <Leaf size={16} className="text-green-500" />
                <span className="font-semibold text-sm">
                  {user?.ecoWallet?.currentBalance || 0} EcoTokens
                </span>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-green-800 hover:bg-green-50 transition-colors"
              >
                <User size={16} />
                <span>Profile</span>
              </Link>
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav 
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled ? "shadow-lg bg-white/95 backdrop-blur-sm border-gray-200" : "bg-white border-gray-100"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg"
            aria-label="EcoChain Home"
          >
            <Leaf size={32} className="text-green-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-400 text-transparent bg-clip-text">
              EcoChain
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    isActive
                      ? "text-green-600 bg-green-100 shadow-sm"
                      : "text-green-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth/Profile/Cart Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && <CartButton />}
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border border-green-200 bg-white text-green-700 hover:bg-green-50 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-400 text-white shadow-sm hover:from-green-600 hover:to-blue-500 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && <CartButton />}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-green-700 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Mobile Menu Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf size={24} className="text-green-500" />
            <span className="text-green-700 font-bold text-lg">Menu</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-green-700 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            aria-label="Close mobile menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-green-100 text-green-700 border-l-4 border-green-500"
                      : "text-green-700 hover:bg-green-50"
                  }`}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth/Profile Section */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {isAuthenticated ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-green-800 truncate">
                      {user?.name}
                    </div>
                    <div className="text-sm text-green-600 capitalize">
                      {user?.role}
                    </div>
                  </div>
                </div>

                {/* EcoTokens Balance */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                  <Leaf size={20} className="text-green-500" />
                  <span className="font-semibold text-green-700">
                    {user?.ecoWallet?.currentBalance || 0} EcoTokens
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={handleLinkClick}
                  className="block w-full px-4 py-3 text-center rounded-lg border border-green-200 bg-white text-green-700 hover:bg-green-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={handleLinkClick}
                  className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-green-500 to-blue-400 text-white shadow-sm hover:from-green-600 hover:to-blue-500 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;