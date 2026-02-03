import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import type { ThirdwebClient } from 'thirdweb';
import { base } from 'thirdweb/chains';

interface AuthSession {
  loggedIn: boolean;
  address?: string | null;
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json() as Promise<T>;
}

export default function App({ client }: { client: ThirdwebClient }) {
  const [session, setSession] = useState<AuthSession>({ loggedIn: false });
  const [moltbookToken, setMoltbookToken] = useState('');
  const [moltbookAgent, setMoltbookAgent] = useState<MoltbookAgent | null>(null);
  const [status, setStatus] = useState<string>('');

  const authConfig = useMemo(() => ({
    async getLoginPayload(params: { address: string; chainId?: number }) {
      return apiRequest('/auth/thirdweb/payload', {
        method: 'POST',
        body: JSON.stringify({ address: params.address, chainId: params.chainId }),
      });
    },
    async doLogin(params: { payload: unknown; signature: string }) {
      await apiRequest('/auth/thirdweb/login', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async isLoggedIn() {
      try {
        const data = await apiRequest<AuthSession>('/auth/thirdweb/me');
        return data.loggedIn;
      } catch {
        return false;
      }
    },
    async doLogout() {
      await apiRequest('/auth/thirdweb/logout', { method: 'POST' });
    },
  }), []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiRequest<AuthSession>('/auth/thirdweb/me');
      setSession(data);
    } catch {
      setSession({ loggedIn: false });
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const verifyMoltbook = async () => {
    setStatus('Verifying Moltbook identity...');
    try {
      const data = await apiRequest<{ agent: MoltbookAgent }>('/auth/moltbook/verify', {
        method: 'POST',
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
