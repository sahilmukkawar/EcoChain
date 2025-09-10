# EcoChain Token Economics

## Overview

The EcoChain token economy is designed to incentivize sustainable waste management behaviors while creating a circular economy marketplace. Eco-tokens serve as the platform's utility token, rewarding users for recycling activities and enabling purchases of recycled products.

## Token Utility

### For Users
- **Earn tokens** by contributing recyclable waste
- **Spend tokens** on recycled products in the marketplace
- **Track sustainability impact** through token activity
- **Achieve status levels** based on recycling activity and token holdings

### For Collectors
- **Earn tokens** for efficient collection and verification
- **Optimize routes** to maximize token earnings
- **Build reputation** through quality verification

### For Factories
- **Acquire quality materials** through token-incentivized collections
- **Sell recycled products** for tokens and/or fiat currency
- **Offer token discounts** on products to drive circular economy

## Token Earning Mechanisms

### Base Collection Rewards

Tokens are awarded based on material type, weight, and quality:

```
Base Tokens = Weight (kg) × Material Base Rate
```

Initial base rates per kilogram:
- Plastic: 10 tokens/kg
- Paper: 8 tokens/kg
- Metal: 15 tokens/kg
- Glass: 6 tokens/kg (future expansion)
- Electronics: 20 tokens/kg (future expansion)

### Quality Multipliers

The quality of materials affects token rewards:

```
Quality-Adjusted Tokens = Base Tokens × Quality Multiplier
```

Quality multipliers:
- Poor: 0.8x
- Fair: 1.0x
- Good: 1.2x
- Excellent: 1.5x

Quality is determined by the Vision AI model and verified by collectors and factories.

### Bonus Mechanisms

1. **Volume Bonus**
   ```
   Volume Bonus = Base Tokens × 0.1 (if Weight > 10kg)
   ```

2. **Frequency Bonus**
   ```
   Frequency Bonus = Base Tokens × 0.05 × ConsecutiveWeeks
   ```
   (Capped at 0.25 or 5 consecutive weeks)

3. **Cleanliness Bonus**
   ```
   Cleanliness Bonus = Base Tokens × 0.15 (if Cleanliness Score > 0.9)
   ```

4. **Referral Bonus**
   - 50 tokens for each new user referral who completes their first collection
   - 10% of referred user's tokens for their first month (capped at 200 tokens)

### Total Token Calculation

```
Total Tokens = Base Tokens × Quality Multiplier + Volume Bonus + Frequency Bonus + Cleanliness Bonus
```

## Token Spending Mechanisms

### Marketplace Purchases

Products in the marketplace have dual pricing:
- Fiat currency price (INR, USD, etc.)
- Token price (partial or full payment)

Token-to-fiat conversion is not fixed but follows a beneficial ratio to incentivize token usage:

```
Token Value (in marketplace) = 1.2-1.5× the token earning rate
```

For example, if users earn tokens at an effective rate of ₹1 per token, they can redeem tokens at ₹1.2-1.5 per token in the marketplace.

### Token Discounts

Products may offer special token-only discounts:

```
Discount = Regular Price × (0.1 to 0.3) when paying with tokens
```

### Status Level Benefits

Users achieve status levels based on recycling activity and token holdings:

1. **Green Starter**: New users
   - Standard token earning rates

2. **Eco Contributor** (1,000+ lifetime tokens)
   - +5% token earning bonus
   - Access to exclusive marketplace items

3. **Sustainability Champion** (5,000+ lifetime tokens)
   - +10% token earning bonus
   - Priority collection scheduling
   - Special marketplace discounts

4. **Earth Guardian** (20,000+ lifetime tokens)
   - +15% token earning bonus
   - VIP collection service
   - Maximum marketplace discounts
   - Input on platform development

## Token Supply and Economics

### Supply Mechanism

- **Dynamic supply**: Tokens are minted when earned through recycling activities
- **No hard cap**: Supply grows with platform activity but is controlled through economic mechanisms
- **Burn mechanism**: Percentage of tokens spent in marketplace are burned to control inflation

### Economic Controls

1. **Earning Rate Adjustment**
   - Base rates can be adjusted based on material market values
   - Quality multipliers can be tuned based on factory feedback
   - Bonus mechanisms can be modified to target specific behaviors

2. **Spending Incentives**
   - Marketplace discounts adjusted to maintain healthy token velocity
   - Limited-time promotions to encourage token spending

3. **Burn Rate**
   - 10-30% of tokens spent in marketplace are burned
   - Burn rate adjustable based on token supply and inflation metrics

4. **Token Velocity Targets**
   - Target: 70% of tokens used within 90 days of earning
   - Incentives adjusted to maintain healthy circulation

## Token Economy Governance

### Parameter Adjustment

Key economic parameters are adjustable through the SystemConfiguration collection:

```json
{
  "configId": "token_economy_params",
  "category": "tokenEconomy",
  "key": "baseRates",
  "value": {
    "plastic": 10,
    "paper": 8,
    "metal": 15
  },
  "lastUpdated": "2023-06-01T00:00:00Z",
  "updatedBy": "admin_001"
}
```

### Adjustment Frequency

- **Weekly monitoring** of token metrics
- **Monthly review** of economic parameters
- **Quarterly adjustments** to base rates and multipliers if needed
- **Emergency adjustments** possible in case of economic imbalance

## Metrics and Monitoring

### Key Performance Indicators

1. **Token Velocity**: Average time between earning and spending
2. **Token Distribution**: Gini coefficient of token holdings
3. **Earning/Burning Ratio**: Ratio of new tokens minted to tokens burned
4. **Marketplace Token Usage**: Percentage of marketplace transactions using tokens
5. **User Engagement**: Correlation between token activity and user retention

### Monitoring Dashboard

The admin dashboard includes a Token Economics section with:

- Real-time token supply metrics
- Token velocity charts
- Earning and burning trends
- Economic parameter adjustment interface
- Simulation tools for parameter changes

## Implementation Details

### Token Transactions

All token transactions are recorded in the EcoTokenTransactions collection with detailed metadata:

```json
{
  "transactionId": "tx_001",
  "userId": "u_001",
  "type": "collection_reward",
  "amount": 62,
  "relatedId": "col_001",
  "description": "Reward for plastic collection",
  "balanceBefore": 58,
  "balanceAfter": 120,
  "status": "completed",
  "metadata": {
    "materialType": "plastic",
    "weight": 5.2,
    "qualityScore": 0.82,
    "baseRate": 10,
    "qualityMultiplier": 1.2,
    "bonuses": {
      "volume": 0,
      "frequency": 0,
      "cleanliness": 0
    }
  },
  "timestamp": "2023-07-10T12:30:00Z"
}
```

### User Wallet

User wallets are embedded in the user document for efficient access:

```json
{
  "userId": "u_001",
  "ecoWallet": {
    "currentBalance": 120,
    "totalEarned": 500,
    "totalSpent": 380,
    "lastTransaction": "2023-07-10T12:30:00Z",
    "statusLevel": "Eco Contributor"
  }
}
```

## Security and Compliance

### Security Measures

1. **Transaction Validation**
   - Multi-level approval for large token issuances
   - Fraud detection for unusual earning patterns
   - Rate limiting for token-earning activities

2. **Wallet Security**
   - Authentication required for all token transactions
   - Transaction signing for marketplace purchases
   - Suspicious activity monitoring

### Compliance

1. **Regulatory Considerations**
   - Tokens are utility tokens with no cash value
   - No secondary market trading
   - Compliance with local regulations on loyalty programs

2. **Transparency**
   - Public metrics on token supply and economics
   - Clear documentation of earning and spending mechanisms
   - Advance notice of parameter changes

## Future Enhancements

### Planned Developments

1. **Community Governance**
   - Allow high-status users to vote on economic parameters
   - Community proposals for new token utilities

2. **Enhanced Token Utility**
   - Token staking for premium features
   - Token-backed sustainability certificates
   - Partnership programs with external merchants

3. **Advanced Economics**
   - Dynamic pricing based on material market values
   - Predictive models for token economy optimization
   - Regional token economies for local marketplaces

## Sprint Plan for Token Economy Implementation

### Sprint 1: Core Token Mechanics
- Implement token earning calculations in Collections Service
- Create EcoTokenTransactions collection and API
- Develop basic wallet functionality in User Service

### Sprint 2: Marketplace Integration
- Implement token spending in Marketplace Service
- Develop dual pricing system for products
- Create token burn mechanism

### Sprint 3: Bonus Mechanisms
- Implement quality multipliers with Vision AI integration
- Develop volume and frequency bonus logic
- Create referral system

### Sprint 4: Admin Controls
- Build token economy dashboard
- Implement parameter adjustment interface
- Develop monitoring and alerting system

### Sprint 5: User Experience
- Create user-facing token history and analytics
- Implement status levels and benefits
- Develop gamification elements