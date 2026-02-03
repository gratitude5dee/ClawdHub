import { createThirdwebClient } from 'thirdweb';
import { createAuth } from 'thirdweb/auth';
import { privateKeyToAccount } from 'thirdweb/wallets';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const client = createThirdwebClient({
  secretKey: requireEnv('THIRDWEB_SECRET_KEY'),
});

const adminAccount = privateKeyToAccount({
  client,
  privateKey: requireEnv('THIRDWEB_PRIVATE_KEY'),
});

export const thirdwebAuth = createAuth({
  domain: requireEnv('THIRDWEB_DOMAIN'),
  client,
  adminAccount,
});
