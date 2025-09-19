# 🌱 EcoChain - Smart Waste-to-Product E-Commerce Platform

A revolutionary digital platform that transforms waste into wealth by connecting garbage collectors, users, and recycling factories in a sustainable ecosystem.

## 🎯 Vision Statement
"Turning today's waste into tomorrow's products while rewarding environmental responsibility."

## ✨ Core Value Proposition

### 🗂️ For Users
- **Earn EcoTokens** for submitting recyclable waste
- **Purchase eco-friendly products** using tokens + cash (up to 30% discount)
- **Track environmental impact** through personal dashboard
- **Convenient pickup scheduling** at doorstep

### 🚛 For Garbage Collectors
- **Optimized route planning** for efficient collection
- **Digital payment system** with transparent pricing
- **Real-time tracking** of collections and earnings
- **Direct connection** with recycling facilities

### 🏭 For Recycling Factories
- **Guaranteed raw material supply** from verified sources
- **Direct marketplace access** to sell recycled products
- **Demand forecasting tools** for production planning
- **Quality assurance** through platform verification

## 🏗️ Complete Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB Atlas** for database
- **JWT Authentication** with refresh tokens
- **Bcrypt** for password hashing
- **Mongoose** ODM for MongoDB
- **Winston** for logging
- **WebSocket** for real-time updates

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for API state management
- **Axios** for HTTP requests
- **React Hook Form** for form handling

### Database Schema
Complete MongoDB collections:
- **Users** - All user types with role-based access
- **GarbageCollections** - Waste collection workflow
- **Factories** - Factory profiles and capabilities
- **Products** - Eco-friendly product catalog
- **Orders** - E-commerce order management
- **EcoTokenTransactions** - Token economy system
- **MaterialRequests** - Factory material sourcing
- **ProductReviews** - Product feedback system
- **SystemConfiguration** - Platform settings
- **Analytics** - Business intelligence data

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

### Installation & Setup

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/ecochain.git
cd ecochain
npm install
cd client && npm install && cd ..
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Configure your MongoDB URI, JWT secrets, and other settings
```

3. **Start Development Servers**
```bash
# Terminal 1: Backend server (Port 3001)
npm run dev

# Terminal 2: Frontend server (Port 3000)
cd client && npm start
```

4. **Access the Platform**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Health Check: http://localhost:3001/api/health

## 🔌 Complete API Documentation

### 🔐 Authentication Endpoints
```
POST /api/auth/register     - Register new user (user/collector/factory/admin)
POST /api/auth/login        - User login with email/password
POST /api/auth/logout       - Secure logout
POST /api/auth/refresh      - Refresh JWT token
GET  /api/auth/me           - Get current user profile
PUT  /api/auth/profile      - Update user profile
PUT  /api/auth/change-password - Change password
```

### 🗂️ Garbage Collection Workflow
```
POST /api/collections       - Submit waste collection request
GET  /api/collections       - Get user's collection history
GET  /api/collections/:id   - Get specific collection details
PUT  /api/collections/:id/status - Update collection status
POST /api/collections/:id/verify - Verify collection quality
```

### 🛒 E-Commerce & Products
```
GET  /api/products          - Browse products with filters
GET  /api/products/:id      - Get product details + reviews
POST /api/products          - Create product (Factory only)
PUT  /api/products/:id      - Update product (Factory only)
DELETE /api/products/:id    - Delete product (Factory only)
POST /api/products/:id/reviews - Add product review

POST /api/orders            - Create new order with token usage
GET  /api/orders/my-orders  - Get user's order history
GET  /api/orders/:id        - Get order details
PATCH /api/orders/:id/status - Update order status
PATCH /api/orders/:id/cancel - Cancel order
```

### 💰 EcoToken System
```
GET  /api/tokens/wallet     - Get wallet balance & sustainability score
GET  /api/tokens/transactions - Get transaction history
POST /api/tokens/award      - Award tokens (Admin/Collector only)
GET  /api/tokens/opportunities - Get earning opportunities
POST /api/tokens/calculate  - Calculate potential token earnings
```

### 🏭 Factory Management
```
POST /api/factories/register - Register factory profile
GET  /api/factories/profile  - Get factory profile
PUT  /api/factories/profile  - Update factory profile
GET  /api/factories          - Browse all factories
GET  /api/factories/dashboard - Factory dashboard stats
POST /api/factories/material-requests - Create material request
GET  /api/factories/material-requests - Get factory's requests
GET  /api/factories/products - Get factory's products
```

## 💎 Key Features Implemented

### 🔒 Advanced Security
- **JWT Authentication** with access & refresh tokens
- **Role-based access control** (User/Collector/Factory/Admin)
- **Password encryption** with bcrypt
- **Input validation** and sanitization
- **Rate limiting** and CORS protection

### 💰 Token Economy System
- **Dynamic token calculation** based on material type, weight, and quality
- **Token-to-money conversion** (1 token = ₹2)
- **Maximum 30% token usage** per order
- **Complete transaction history** and wallet management
- **Sustainability scoring** system

### 🛒 Complete E-Commerce Platform
- **Product catalog** with search and filters
- **Shopping cart** and checkout process
- **Order management** with status tracking
- **Review and rating** system
- **Inventory management** for factories

### 📊 Business Intelligence
- **Real-time analytics** dashboard
- **Environmental impact** tracking
- **Performance metrics** for all user types
- **Revenue and commission** tracking

## 🌍 Environmental Impact Tracking

The platform calculates and displays:
- **CO2 Emissions Saved** (kg CO2 equivalent)
- **Trees Equivalent** planted
- **Energy Saved** (kWh)
- **Water Conserved** (liters)
- **Waste Diverted** from landfills

## 💼 Revenue Model

1. **E-commerce Commission** (5-10% per sale)
2. **Factory Partnership Fees** (₹5,000-50,000/month)
3. **Premium Features** (Analytics, priority matching)
4. **Advertisement Revenue** (Eco-brand partnerships)
5. **Data Insights** (Anonymized market analytics)

## 🗄️ Database Architecture

### User Management
- Multi-role user system (User/Collector/Factory/Admin)
- Comprehensive profile management
- EcoWallet integration
- Sustainability scoring

### Waste Collection Workflow
- Request → Schedule → Collect → Verify → Process → Complete
- Quality assessment and token calculation
- Real-time status tracking
- Geographic optimization

### E-Commerce Engine
- Product catalog with sustainability metrics
- Order processing with token integration
- Inventory management
- Review and rating system

### Token Economy
- Transaction logging
- Wallet management
- Earning opportunities
- Spending controls

## 🚀 Deployment Ready

The platform is production-ready with:
- **Environment configuration** management
- **Error handling** and logging
- **Database connection** management
- **WebSocket** real-time updates
- **Scalable architecture**

## 🌐 Deployment Instructions

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following configuration:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `MONGODB_URI` - Your MongoDB connection string
     - `JWT_SECRET` - Your JWT secret key
     - `JWT_REFRESH_SECRET` - Your JWT refresh secret key
     - Any other environment variables from `.env.example`

### Frontend Deployment (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Set the following configuration:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Add environment variables if needed:
   - `REACT_APP_API_URL` - Your backend API URL (https://ecochain-j1nj.onrender.com/api)

### Frontend Deployment (Render Alternative)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the following configuration:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `client/build`
   - **Root Directory**: `client`

### Environment Variables

For security, never commit your `.env` file to version control. Instead, configure environment variables directly in the deployment platform dashboard.

Create a `.env` file in your local development environment with the following variables:
```bash
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
# ... other variables from .env.example
```

## 📈 Next Steps for Production

1. **Set up MongoDB Atlas** cluster
2. **Configure environment variables** with real values
3. **Set up payment gateway** (Stripe/Razorpay)
4. **Deploy to cloud** (AWS/Heroku/Vercel/Netlify)
5. **Set up CI/CD pipeline**
6. **Configure monitoring** and analytics
7. **Add SSL certificates**
8. **Set up backup strategies**

## 🔧 Development Commands

```bash
# Backend Development
npm run dev          # Start with nodemon
npm run start        # Production start
npm run test         # Run tests
npm run lint         # Code linting
npm run setup-db     # Initialize database

# Frontend Development
cd client
npm start            # Development server
npm run build        # Production build
npm test             # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Contact

- **Email**: support@ecochain.com
- **Documentation**: [docs.ecochain.com](https://docs.ecochain.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ecochain/issues)

---

**Built with ❤️ for a sustainable future 🌍**