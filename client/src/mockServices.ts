// Mock services for the EcoChain application

// Mock order service
export const orderService = {
  calculateOrderSummary: async (cart: any[], tokenAmount: number) => {
    // Calculate subtotal from cart
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    
    // Calculate token discount (1 token = ₹1)
    const tokenDiscount = Math.min(tokenAmount, subtotal);
    
    // Calculate shipping cost (free for orders over ₹500)
    const shippingCost = subtotal > 500 ? 0 : 50;
    
    // Calculate tax (5% of subtotal after token discount)
    const taxableAmount = subtotal - tokenDiscount;
    const tax = Math.round(taxableAmount * 0.05);
    
    // Calculate total
    const total = taxableAmount + shippingCost + tax;
    
    return {
      subtotal,
      tokenDiscount,
      shippingCost,
      tax,
      total,
      tokensUsed: tokenAmount
    };
  },
  
  createOrder: async (orderData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock order data
    return {
      _id: 'order-' + Math.random().toString(36).substr(2, 9),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }
};

// Mock product service
export const productService = {
  getProducts: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock products
    return [
      {
        id: 'p1',
        name: 'Recycled Paper Notebook',
        description: 'Notebook made from 100% recycled paper',
        price: 150,
        tokenPrice: 5,
        category: 'stationery',
        imageUrl: '/images/notebook.jpg',
        stock: 50
      },
      {
        id: 'p2',
        name: 'Bamboo Toothbrush',
        description: 'Eco-friendly bamboo toothbrush',
        price: 80,
        tokenPrice: 3,
        category: 'personal-care',
        imageUrl: '/images/toothbrush.jpg',
        stock: 100
      },
      {
        id: 'p3',
        name: 'Reusable Water Bottle',
        description: 'Stainless steel water bottle',
        price: 350,
        tokenPrice: 10,
        category: 'kitchen',
        imageUrl: '/images/bottle.jpg',
        stock: 30
      }
    ];
  }
};