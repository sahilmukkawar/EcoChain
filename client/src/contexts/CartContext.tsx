import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  tokenPrice: number;
  category?: string;
  imageUrl?: string;
  sustainabilityScore?: number;
  status?: 'available' | 'sold_out';
}

// Define the CartItem interface
export interface CartItem {
  product: Product;
  quantity: number;
}

// Define the CartContext interface
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  tokenTotal: number;
}

// Create the CartContext
const CartContext = createContext<CartContextType | undefined>(undefined);

// Create the CartProvider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from localStorage only for authenticated users
  useEffect(() => {
    if (user) {
      const userCartKey = `cart_${user.id || user.userId}`;
      const savedCart = localStorage.getItem(userCartKey);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          localStorage.removeItem(userCartKey);
        }
      }
    }
  }, [user]);

  // Save cart to localStorage whenever it changes (for authenticated users only)
  useEffect(() => {
    if (user && cart.length >= 0) {
      const userCartKey = `cart_${user.id || user.userId}`;
      localStorage.setItem(userCartKey, JSON.stringify(cart));
    }
  }, [cart, user]);

  // Clear cart when user logs out and clean up user-specific cart data
  useEffect(() => {
    if (!user) {
      setCart([]);
      // Clean up any cart data from localStorage when user logs out
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [user]);

  // Add product to cart with stock validation
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Check if we can add more (assuming stock validation on backend)
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Update product quantity in cart with validation
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.max(1, quantity) } // Ensure minimum quantity of 1
        : item
    ));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate cart totals with proper rounding
  const cartTotal = Math.round(cart.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0) * 100) / 100;
  
  const tokenTotal = Math.round(cart.reduce((total, item) => {
    return total + (item.product.tokenPrice * item.quantity);
  }, 0));

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        tokenTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};