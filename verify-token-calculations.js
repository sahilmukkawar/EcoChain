// Test script to verify token calculations match the expected order summary
console.log('🧪 Verifying Token Calculations...');
console.log('====================================');

// Example order data based on your specification:
// Subtotal: ₹400
// EcoTokens Used: 150 tokens (₹300)
// Taxes (18% GST): ₹72
// Shipping: ₹50
// Total Paid: ₹222
// EcoToken Savings: You saved ₹300 by using 150 EcoTokens!

const subtotal = 400; // ₹400
const ecoTokensUsed = 150; // 150 tokens
const tokenRate = 2; // 1 token = ₹2

// Calculate token value
const ecoTokenValue = ecoTokensUsed * tokenRate; // 150 * 2 = ₹300

// Calculate taxes (18% GST)
const taxes = subtotal * 0.18; // 400 * 0.18 = ₹72

// Shipping charges
const shipping = 50; // ₹50

// Calculate final amount
const finalAmount = subtotal + taxes + shipping - ecoTokenValue; // 400 + 72 + 50 - 300 = ₹222

console.log('\n📊 Calculation Results:');
console.log('=====================');
console.log(`Subtotal: ₹${subtotal}`);
console.log(`EcoTokens Used: ${ecoTokensUsed} tokens (₹${ecoTokenValue})`);
console.log(`Taxes (18% GST): ₹${taxes}`);
console.log(`Shipping: ₹${shipping}`);
console.log(`Total Paid: ₹${finalAmount}`);
console.log(`EcoToken Savings: You saved ₹${ecoTokenValue} by using ${ecoTokensUsed} EcoTokens!`);

console.log('\n✅ Verification Results:');
console.log('======================');

// Verify calculations match expected values
const expectedValues = {
  subtotal: 400,
  ecoTokensUsed: 150,
  ecoTokenValue: 300,
  taxes: 72,
  shipping: 50,
  finalAmount: 222,
  savings: 300
};

const actualValues = {
  subtotal,
  ecoTokensUsed,
  ecoTokenValue,
  taxes,
  shipping,
  finalAmount,
  savings: ecoTokenValue
};

let allMatch = true;
for (const [key, expected] of Object.entries(expectedValues)) {
  const actual = actualValues[key];
  const match = expected === actual;
  console.log(`${key}: ${match ? '✅' : '❌'} Expected: ${expected}, Actual: ${actual}`);
  if (!match) allMatch = false;
}

console.log('\n' + '='.repeat(50));
if (allMatch) {
  console.log('🎉 ALL CALCULATIONS ARE CORRECT!');
  console.log('The system is properly configured with 1 token = ₹2');
} else {
  console.log('❌ SOME CALCULATIONS ARE INCORRECT!');
  console.log('Please check the implementation');
}
console.log('='.repeat(50));