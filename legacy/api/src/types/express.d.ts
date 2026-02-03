import type { MoltbookAgent } from './moltbook';

declare global {
  namespace Express {
    interface Request {
      moltbookAgent?: MoltbookAgent;
    }
  }
}

export {};
