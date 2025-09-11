// utils/paymentRates.js
// Indian industry standard rates for waste collection in INR per kg

/**
 * Waste collection payment rates based on Indian industry standards
 * These rates are for collector payments, reflecting current market rates
 */
const COLLECTOR_PAYMENT_RATES = {
  // Plastic waste rates (INR per kg)
  plastic: {
    baseRate: 12, // PET bottles, containers
    qualityMultipliers: {
      excellent: 1.4,  // Clean, sorted plastic
      good: 1.2,       // Minor cleaning needed
      fair: 1.0,       // Standard condition
      poor: 0.7        // Contaminated/mixed
    }
  },
  
  // Paper waste rates (INR per kg)
  paper: {
    baseRate: 8,     // Newspapers, cardboard
    qualityMultipliers: {
      excellent: 1.3,  // Clean, white paper
      good: 1.1,       // Minor stains
      fair: 1.0,       // Standard condition
      poor: 0.6        // Wet/damaged paper
    }
  },
  
  // Metal waste rates (INR per kg)
  metal: {
    baseRate: 25,    // Aluminum, steel scrap
    qualityMultipliers: {
      excellent: 1.5,  // Pure metal, no rust
      good: 1.2,       // Minor rust/dirt
      fair: 1.0,       // Standard condition
      poor: 0.8        // Heavy rust/contamination
    }
  },
  
  // Glass waste rates (INR per kg)
  glass: {
    baseRate: 3,     // Bottles, containers
    qualityMultipliers: {
      excellent: 1.3,  // Clean, unbroken
      good: 1.1,       // Minor chips
      fair: 1.0,       // Standard condition
      poor: 0.5        // Broken/contaminated
    }
  },
  
  // Electronic waste rates (INR per kg)
  electronic: {
    baseRate: 35,    // Phones, computers
    qualityMultipliers: {
      excellent: 1.6,  // Working condition
      good: 1.3,       // Minor defects
      fair: 1.0,       // Standard e-waste
      poor: 0.7        // Severely damaged
    }
  },
  
  // Organic waste rates (INR per kg)
  organic: {
    baseRate: 2,     // Composting material
    qualityMultipliers: {
      excellent: 1.2,  // Fresh, no contamination
      good: 1.0,       // Standard condition
      fair: 0.8,       // Some contamination
      poor: 0.5        // High contamination
    }
  },
  
  // Other/mixed waste rates (INR per kg)
  other: {
    baseRate: 5,     // Mixed recyclables
    qualityMultipliers: {
      excellent: 1.2,
      good: 1.0,
      fair: 0.8,
      poor: 0.6
    }
  }
};

/**
 * Additional bonuses and incentives
 */
const PAYMENT_BONUSES = {
  // Volume bonuses (minimum kg required)
  volumeBonus: {
    50: 1.1,   // 10% bonus for 50kg+
    100: 1.15, // 15% bonus for 100kg+
    200: 1.2   // 20% bonus for 200kg+
  },
  
  // Distance bonuses (additional travel compensation)
  distanceBonus: {
    perKm: 2, // INR 2 per km for distant locations
    minimumDistance: 5 // km
  },
  
  // Time slot bonuses
  timeSlotBonus: {
    earlyMorning: 1.05,  // 5% bonus for 6-8 AM
    lateEvening: 1.05,   // 5% bonus for 6-8 PM
    weekend: 1.1         // 10% bonus for weekends
  }
};

/**
 * Calculate collector payment based on Indian industry standards
 * @param {string} wasteType - Type of waste collected
 * @param {number} weight - Weight in kilograms
 * @param {string} quality - Quality grade (excellent, good, fair, poor)
 * @param {Object} options - Additional calculation options
 * @returns {Object} Payment calculation breakdown
 */
function calculateCollectorPayment(wasteType, weight, quality = 'fair', options = {}) {
  const {
    distance = 0,
    timeSlot = '',
    isWeekend = false,
    pickupDate = new Date()
  } = options;
  
  // Get base rate for waste type
  const wasteRates = COLLECTOR_PAYMENT_RATES[wasteType] || COLLECTOR_PAYMENT_RATES.other;
  const baseRate = wasteRates.baseRate;
  const qualityMultiplier = wasteRates.qualityMultipliers[quality] || wasteRates.qualityMultipliers.fair;
  
  // Calculate base payment
  let basePayment = baseRate * weight * qualityMultiplier;
  
  // Apply volume bonus
  let volumeMultiplier = 1;
  if (weight >= 200) volumeMultiplier = PAYMENT_BONUSES.volumeBonus[200];
  else if (weight >= 100) volumeMultiplier = PAYMENT_BONUSES.volumeBonus[100];
  else if (weight >= 50) volumeMultiplier = PAYMENT_BONUSES.volumeBonus[50];
  
  // Apply distance bonus
  let distanceBonus = 0;
  if (distance > PAYMENT_BONUSES.distanceBonus.minimumDistance) {
    distanceBonus = (distance - PAYMENT_BONUSES.distanceBonus.minimumDistance) * PAYMENT_BONUSES.distanceBonus.perKm;
  }
  
  // Apply time slot bonus
  let timeSlotMultiplier = 1;
  if (isWeekend) {
    timeSlotMultiplier = PAYMENT_BONUSES.timeSlotBonus.weekend;
  } else if (timeSlot.includes('6:00 AM') || timeSlot.includes('7:00 AM')) {
    timeSlotMultiplier = PAYMENT_BONUSES.timeSlotBonus.earlyMorning;
  } else if (timeSlot.includes('6:00 PM') || timeSlot.includes('7:00 PM')) {
    timeSlotMultiplier = PAYMENT_BONUSES.timeSlotBonus.lateEvening;
  }
  
  // Calculate final payment
  const qualityAdjustedPayment = basePayment * volumeMultiplier * timeSlotMultiplier;
  const totalPayment = qualityAdjustedPayment + distanceBonus;
  
  return {
    breakdown: {
      wasteType,
      weight,
      quality,
      baseRate,
      qualityMultiplier,
      volumeMultiplier,
      timeSlotMultiplier,
      distanceBonus,
      basePayment: Math.round(basePayment * 100) / 100,
      qualityAdjustedPayment: Math.round(qualityAdjustedPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100
    },
    currency: 'INR',
    paymentSummary: {
      baseAmount: Math.round(basePayment * 100) / 100,
      bonuses: Math.round((totalPayment - basePayment) * 100) / 100,
      finalAmount: Math.round(totalPayment * 100) / 100
    }
  };
}

/**
 * Get display-friendly rate information
 */
function getPaymentRateInfo() {
  return {
    rates: COLLECTOR_PAYMENT_RATES,
    bonuses: PAYMENT_BONUSES,
    currency: 'INR',
    unit: 'per kg',
    lastUpdated: '2024-01-15'
  };
}

module.exports = {
  COLLECTOR_PAYMENT_RATES,
  PAYMENT_BONUSES,
  calculateCollectorPayment,
  getPaymentRateInfo
};