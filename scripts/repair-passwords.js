require('dotenv').config();
const connectDB = require('../database/connection');
const User = require('../database/models/User');

async function repairSeededPasswords() {
  const targets = [
    { email: 'admin@ecochain.com', password: 'Admin@123' },
    { email: 'factory@ecochain.com', password: 'Factory@123' },
    { email: 'collector@ecochain.com', password: 'Collector@123' },
    { email: 'user@ecochain.com', password: 'User@123' }
  ];

  await connectDB();

  for (const t of targets) {
    const user = await User.findOne({ 'personalInfo.email': t.email }).select('+password');
    if (!user) {
      console.log(`[repair] Skipping, not found: ${t.email}`);
      continue;
    }
    user.password = t.password; // Will be hashed by pre-save hook
    await user.save();
    console.log(`[repair] Updated password for ${t.email}`);
  }

  console.log('[repair] Done.');
  process.exit(0);
}

repairSeededPasswords().catch(err => {
  console.error('[repair] Failed:', err);
  process.exit(1);
});


