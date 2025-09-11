import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
  ecoTokens: number;
  role: 'user' | 'admin' | 'collector' | 'factory';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false
});

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-id',
    name: 'Mock User',
    email: 'user@example.com',
    address: '123 Eco Street, Green City',
    ecoTokens: 50,
    role: 'user'
  });

  const login = async (email: string, password: string) => {
    // Mock login functionality
    setUser({
      id: 'mock-user-id',
      name: 'Mock User',
      email,
      address: '123 Eco Street, Green City',
      ecoTokens: 50,
      role: 'user'
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Cart types
interface CartProduct {
  id: string;
  name: string;
  price: number;
  tokenPrice: number;
  imageUrl?: string;
  category: string;
}

interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  tokenTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartTotal: 0,
  tokenTotal: 0,
  itemCount: 0
});

export const CartProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [tokenTotal, setTokenTotal] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(0);

  // Update totals when cart changes
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tokens = cart.reduce((sum, item) => sum + (item.product.tokenPrice * item.quantity), 0);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    setCartTotal(total);
    setTokenTotal(tokens);
    setItemCount(count);
  }, [cart]);

  const addToCart = (product: CartProduct, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      tokenTotal,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

// Add the missing hooks
export const useSync = () => {
  // Add your sync logic here
  return {
    isOnline: true,
    syncData: () => Promise.resolve(),
  };
};

export const useEcoChain = () => {
  // Add your EcoChain logic here
  return {
    // Add your EcoChain state and methods
    data: null,
    loading: false,
    error: null,
  };
};