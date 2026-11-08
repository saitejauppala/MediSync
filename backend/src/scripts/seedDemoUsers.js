const User = require('../models/User');

const demoAccountDefinitions = [
  {
    name: 'MediSync Demo Patient',
    email: 'patient@medisync.io',
    role: 'patient',
    passwordVariable: 'MEDISYNC_DEMO_PATIENT_PASSWORD',
  },
  {
    name: 'MediSync Demo Hospital Administrator',
    email: 'hospitaladmin@medisync.io',
    role: 'hospital_admin',
    passwordVariable: 'MEDISYNC_DEMO_HOSPITAL_ADMIN_PASSWORD',
  },
  {
    name: 'MediSync Demo Platform Administrator',
    email: 'admin@medisync.io',
    role: 'platform_admin',
    passwordVariable: 'MEDISYNC_DEMO_PLATFORM_ADMIN_PASSWORD',
  },
];

class DemoSeedError extends Error {}

const getDemoAccounts = (env) => {
  const accounts = demoAccountDefinitions.map((definition) => {
    const password = env[definition.passwordVariable];
    if (!password || password.length < 16) {
      throw new DemoSeedError(
        `${definition.passwordVariable} must be set to a unique password of at least 16 characters.`
      );
    }

    return { ...definition, password };
  });

  if (new Set(accounts.map(({ password }) => password)).size !== accounts.length) {
    throw new DemoSeedError('Each demo account must use a different password.');
  }

  return accounts;
};

const ensureExistingAccountRole = (account, existingUser) => {
  if (existingUser.role !== account.role) {
    throw new DemoSeedError(
      `Existing demo account ${account.email} has role ${existingUser.role}; expected ${account.role}. No account data was changed.`
    );
  }
};

const existingAccountResult = async (account, existingUser) => ({
  email: account.email,
  role: account.role,
  status: await existingUser.comparePassword(account.password) ? 'unchanged' : 'password-mismatch',
});

const seedDemoUsers = async ({ env = process.env, UserModel = User } = {}) => {
  const accounts = getDemoAccounts(env);
  const existingAccounts = await UserModel.find({
    email: { $in: accounts.map(({ email }) => email) },
  }).select('email role +password');
  const existingByEmail = new Map(existingAccounts.map((user) => [user.email, user]));

  for (const account of accounts) {
    const existing = existingByEmail.get(account.email);
    if (existing) ensureExistingAccountRole(account, existing);
  }

  const results = [];
  for (const account of accounts) {
    const existing = existingByEmail.get(account.email);
    if (existing) {
      results.push(await existingAccountResult(account, existing));
      continue;
    }

    try {
      await UserModel.create({
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
      });
      results.push({ email: account.email, role: account.role, status: 'created' });
    } catch (error) {
      if (error.code !== 11000) throw error;

      const concurrentlyCreatedUser = await UserModel.findOne({ email: account.email }).select('email role +password');
      if (!concurrentlyCreatedUser) throw error;
      ensureExistingAccountRole(account, concurrentlyCreatedUser);
      results.push(await existingAccountResult(account, concurrentlyCreatedUser));
    }
  }

  return results;
};

const runProductionDemoSeed = async () => {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');

  if (process.env.NODE_ENV !== 'production') {
    throw new DemoSeedError('Demo-user seeding is permitted only with NODE_ENV=production.');
  }
  if (process.env.MEDISYNC_ENABLE_DEMO_USER_SEED !== 'true') {
    throw new DemoSeedError('Set MEDISYNC_ENABLE_DEMO_USER_SEED=true for this explicit one-off operation.');
  }
  if (!process.env.MONGODB_URI) {
    throw new DemoSeedError('MONGODB_URI must be configured for the production database.');
  }
  getDemoAccounts(process.env);

  let connected = false;
  try {
    await connectDB();
    connected = true;
    const results = await seedDemoUsers();
    for (const result of results) {
      const detail = result.status === 'password-mismatch'
        ? 'existing password differs; account was not changed'
        : result.status;
      console.log(`Demo account ${result.email} (${result.role}): ${detail}.`);
    }
    if (results.some(({ status }) => status === 'password-mismatch')) {
      throw new DemoSeedError(
        'One or more existing demo passwords differ from configuration; no existing password was changed.'
      );
    }
  } finally {
    if (connected) await disconnectDB();
  }
};

if (require.main === module) {
  runProductionDemoSeed().catch((error) => {
    if (error instanceof DemoSeedError) {
      console.error(`Demo-user seed stopped: ${error.message}`);
    } else {
      console.error('Demo-user seed failed. Check Railway configuration and database connectivity; sensitive details were not logged.');
    }
    process.exitCode = 1;
  });
}

module.exports = { DemoSeedError, seedDemoUsers };
