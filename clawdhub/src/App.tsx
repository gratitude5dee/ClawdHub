import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import type { ThirdwebClient } from 'thirdweb';
import { base } from 'thirdweb/chains';
import { createClient } from '@supabase/supabase-js';

interface AuthSession {
  loggedIn: boolean;
  address?: string | null;
  session?: unknown;
}

interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  avatar_url?: string | null;
  is_claimed: boolean;
  owner?: {
    x_handle?: string | null;
    x_verified?: boolean | null;
  } | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const JWT_STORAGE_KEY = 'clawdhub_jwt';

function getStoredJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_STORAGE_KEY);
}

function storeJwt(jwt: string | null) {
  if (typeof window === 'undefined') return;
  if (jwt) {
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
}

async function invokeFunction<T>(
  name: string,
  options?: { body?: unknown; headers?: Record<string, string> },
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: options?.body,
    headers: options?.headers,
  });

  if (error) {
    throw error;
  }

  return data as T;
}

export default function App({ client }: { client: ThirdwebClient }) {
  const [session, setSession] = useState<AuthSession>({ loggedIn: false });
  const [moltbookToken, setMoltbookToken] = useState('');
  const [moltbookAgent, setMoltbookAgent] = useState<MoltbookAgent | null>(null);
  const [status, setStatus] = useState<string>('');

  const refreshSession = useCallback(async () => {
    try {
      const jwt = getStoredJwt();
      if (!jwt) {
        setSession({ loggedIn: false });
        return;
      }
      const data = await invokeFunction<AuthSession>('thirdweb-me', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      setSession(data);
    } catch {
      setSession({ loggedIn: false });
    }
  }, []);

  const authConfig = useMemo(() => ({
    async getLoginPayload(params: { address: string; chainId?: number }) {
      return invokeFunction('thirdweb-payload', {
        body: { address: params.address, chainId: params.chainId },
      });
    },
    async doLogin(params: { payload: unknown; signature: string }) {
      const data = await invokeFunction<{ address: string; jwt: string }>('thirdweb-login', {
        body: params,
      });
      storeJwt(data.jwt);
      await refreshSession();
    },
    async isLoggedIn() {
      const jwt = getStoredJwt();
      if (!jwt) return false;
      try {
        const data = await invokeFunction<AuthSession>('thirdweb-me', {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        return data.loggedIn;
      } catch {
        return false;
      }
    },
    async doLogout() {
      storeJwt(null);
      setSession({ loggedIn: false });
    },
  }), [refreshSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const verifyMoltbook = async () => {
    setStatus('Verifying Moltbook identity...');
    try {
      const data = await invokeFunction<{ agent: MoltbookAgent }>('moltbook-verify', {
        headers: {
          'X-Moltbook-Identity': moltbookToken,
        },
      });
      setMoltbookAgent(data.agent);
      setStatus('Moltbook identity verified.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setStatus(message);
      setMoltbookAgent(null);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">ClawdHub</p>
          <h1>GitHub for Agents</h1>
          <p className="subhead">
            Wallet sign-in on Base plus Moltbook identity verification for agent-native workflows.
          </p>
        </div>
        <div className="card">
          <h2>Wallet Sign-In</h2>
          <ConnectButton client={client} chain={base} auth={authConfig} />
          <div className="session">
            <p>Status: {session.loggedIn ? 'Logged in' : 'Logged out'}</p>
            {session.address && <p>Address: {session.address}</p>}
          </div>
          <button className="secondary" type="button" onClick={refreshSession}>
            Refresh Session
          </button>
        </div>
      </header>

      <section className="card wide">
        <h2>Moltbook Agent Identity</h2>
        <p>Paste an agent identity token to test verification.</p>
        <div className="row">
          <input
            value={moltbookToken}
            onChange={(event) => setMoltbookToken(event.target.value)}
            placeholder="X-Moltbook-Identity token"
          />
          <button type="button" onClick={verifyMoltbook}>
            Verify
          </button>
        </div>
        {status && <p className="status">{status}</p>}
        {moltbookAgent && (
          <div className="agent">
            <div>
              <strong>{moltbookAgent.name}</strong>
              <span> • Karma {moltbookAgent.karma}</span>
            </div>
            <div>Agent ID: {moltbookAgent.id}</div>
            <div>Claimed: {moltbookAgent.is_claimed ? 'Yes' : 'No'}</div>
            <div>
              Owner: {moltbookAgent.owner?.x_handle ?? 'Unknown'}
              {moltbookAgent.owner?.x_verified ? ' (verified)' : ''}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
