import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { thirdwebAuth } from './auth/thirdweb';
import { moltbookIdentity } from './auth/moltbook';
import { upsertUser } from './db/supabase';

const app = express();

const PORT = Number(process.env.PORT || 3001);
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const COOKIE_NAME = 'clawdhub_auth';

app.use(cors({
  origin: APP_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/thirdweb/payload', async (req, res) => {
  try {
    const { address, chainId } = req.body ?? {};
    if (!address) {
      return res.status(400).json({ error: 'missing_address' });
    }

    const payload = await thirdwebAuth.generatePayload({
      address,
      chainId,
    });

    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate payload';
    return res.status(500).json({ error: 'payload_error', detail: message });
  }
});

app.post('/auth/thirdweb/login', async (req, res) => {
  try {
    const { payload, signature } = req.body ?? {};
    if (!payload || !signature) {
      return res.status(400).json({ error: 'missing_payload_or_signature' });
    }

    const verification = await thirdwebAuth.verifyPayload({ payload, signature });
    if (!verification.valid) {
      return res.status(401).json({ error: 'invalid_signature' });
    }

    const jwt = await thirdwebAuth.generateJWT({ payload: verification.payload });
    res.cookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const address = verification.payload.address;
    await upsertUser(process.env, address);

    return res.json({ address });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(500).json({ error: 'login_failed', detail: message });
  }
});

app.post('/auth/thirdweb/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ ok: true });
});

app.get('/auth/thirdweb/me', async (req, res) => {
  try {
    const jwt = req.cookies?.[COOKIE_NAME];
    if (!jwt) {
      return res.status(401).json({ loggedIn: false });
    }

    const verification = await thirdwebAuth.verifyJWT({ jwt });
    if (!verification.valid) {
      return res.status(401).json({ loggedIn: false });
    }

    const parsed = verification.parsedJWT;
    const address = parsed.sub ?? parsed.address;
    return res.json({ loggedIn: true, address, session: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session invalid';
    return res.status(401).json({ loggedIn: false, detail: message });
  }
});

app.post('/auth/moltbook/verify', moltbookIdentity({ required: true }), (req, res) => {
  res.json({ agent: req.moltbookAgent });
});

app.get('/me', moltbookIdentity(), (req, res) => {
  res.json({ agent: req.moltbookAgent ?? null });
});

app.listen(PORT, () => {
  console.log(`ClawdHub API listening on http://localhost:${PORT}`);
});
