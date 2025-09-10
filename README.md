# EcoChain: Smart Waste-to-Product E-Commerce Platform

## Overview
EcoChain is a comprehensive platform that connects waste collectors, users, and manufacturing factories to create a circular economy. The platform enables users to schedule waste collection, rewards them with eco-tokens, and allows them to purchase recycled products using these tokens.

## Architecture

### Mobile Applications
- **User App (React Native)**: For users to schedule waste collection and purchase recycled products
- **Collector App (React Native)**: For waste collectors to manage pickups and deliveries

### Web Applications
- **Factory Dashboard (React/Next.js)**: For factories to manage material requests and product listings
- **Admin Dashboard (React/Next.js)**: For platform administrators to monitor and manage the system

### Backend Services
- **Auth Service**: Handles authentication and authorization
- **Users Service**: Manages user profiles and preferences
- **Collections Service**: Handles waste collection scheduling and tracking
- **Vision Service**: AI-powered waste classification and quality assessment
- **Matching Service**: Matches collections to factories based on material type and location
- **Routing Service**: Optimizes collection routes for collectors
- **Wallet Service**: Manages eco-token transactions
- **Marketplace Service**: Handles product listings and purchases
- **Orders Service**: Manages order processing and fulfillment
- **Factories Service**: Manages factory profiles and material requests
- **Analytics Service**: Provides insights and reporting
- **Admin Service**: Handles administrative functions

### Infrastructure
- **Database**: MongoDB Atlas
- **Queue**: Redis + BullMQ
- **API Gateway**: NGINX / API Gateway
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or managed logging service
- **CI/CD**: GitHub Actions + Terraform + Kubernetes/ECS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

### Installation

1. Clone the repository
   ```
   git clone https://github.com/username/ecochain.git
   cd ecochain
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Copy the `.env.example` file to `.env` (if available)
   - Update the MongoDB connection string and other environment variables

4. Set up the database
   ```
   npm run setup-db
   ```
   
   This will:
   - Initialize the database with required collections and indexes
   - Create seed data for testing
   - Verify the database connection and models

### Running the Application

```
npm run dev
```

Refer to individual service directories for additional setup instructions.

## Development Roadmap

1. MVP with plastic/paper/metal waste types
2. Expand to additional waste types
3. Enhance AI models with feedback loops
4. Scale infrastructure for production

## License

Proprietary - All rights reserved