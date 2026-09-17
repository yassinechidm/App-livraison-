/**
 * Quickly Livraison — API & Client-Side Rate Limiter
 * Implements a sliding-window counter algorithm with automatic cleanup,
 * preventing spam, brute-force attempts, and excessive API calls.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  label?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  error?: string;
}

export class RateLimitError extends Error {
  public readonly resetAfterSeconds: number;
  public readonly action: string;

  constructor(action: string, resetAfterSeconds: number, customMessage?: string) {
    const message =
      customMessage ||
      `Trop de requêtes pour cette action. Veuillez patienter ${resetAfterSeconds}s avant de réessayer.`;
    super(message);
    this.name = 'RateLimitError';
    this.action = action;
    this.resetAfterSeconds = resetAfterSeconds;
  }
}

// Pre-configured rate limiting rules for critical application actions
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  // Auth endpoints: strict thresholds
  'auth:login': { windowMs: 60 * 1000, maxRequests: 5, label: 'Connexion' },
  'auth:register': { windowMs: 60 * 1000, maxRequests: 3, label: 'Inscription' },
  'auth:otp-request': { windowMs: 60 * 1000, maxRequests: 1, label: 'Demande OTP' },
  'auth:otp-verify': { windowMs: 60 * 1000, maxRequests: 5, label: 'Vérification OTP' },
  'auth:password-reset': { windowMs: 60 * 1000, maxRequests: 3, label: 'Réinitialisation mot de passe' },
  'auth:profile-update': { windowMs: 60 * 1000, maxRequests: 10, label: 'Mise à jour profil' },

  // Orders: prevent double-orders, rapid clicking, and spam
  'order:create': { windowMs: 60 * 1000, maxRequests: 3, label: 'Création de commande' },
  'order:cancel': { windowMs: 60 * 1000, maxRequests: 3, label: 'Annulation de commande' },
  'order:status-update': { windowMs: 60 * 1000, maxRequests: 15, label: 'Mise à jour statut' },

  // Addresses: normal user edits
  'address:save': { windowMs: 60 * 1000, maxRequests: 10, label: 'Sauvegarde adresse' },

  // Search & queries: prevent flooding
  'search:query': { windowMs: 60 * 1000, maxRequests: 30, label: 'Recherche' },

  // Default fallback for any general endpoint
  'api:default': { windowMs: 60 * 1000, maxRequests: 60, label: 'Requête API' },
};

interface RequestLog {
  timestamps: number[];
}

export class MemoryRateLimiter {
  private logs: Map<string, RequestLog> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Run garbage collection every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  /**
   * Cleans up expired timestamp logs from memory.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, log] of this.logs.entries()) {
      // Remove timestamps older than 5 minutes
      log.timestamps = log.timestamps.filter((ts) => now - ts < 5 * 60 * 1000);
      if (log.timestamps.length === 0) {
        this.logs.delete(key);
      }
    }
  }

  /**
   * Generates a unique key for the action and optional user/identifier.
   */
  private buildKey(action: string, identifier?: string): string {
    const safeId = identifier ? String(identifier).trim() : 'anonymous';
    return `${action}:${safeId}`;
  }

  /**
   * Checks if an action is permitted within the rate limit window.
   * If permitted, records the request timestamp.
   */
  public check(
    action: string,
    identifier?: string,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const rule = {
      ...(RATE_LIMIT_RULES[action] || RATE_LIMIT_RULES['api:default']),
      ...customConfig,
    };

    const key = this.buildKey(action, identifier);
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    let log = this.logs.get(key);
    if (!log) {
      log = { timestamps: [] };
      this.logs.set(key, log);
    }

    // Filter timestamps within current sliding window
    log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

    const currentCount = log.timestamps.length;

    if (currentCount >= rule.maxRequests) {
      // Calculate how many seconds until the oldest request falls out of the window
      const oldestTs = log.timestamps[0] || now;
      const resetAfterMs = Math.max(1000, rule.windowMs - (now - oldestTs));
      const resetAfterSeconds = Math.ceil(resetAfterMs / 1000);

      const label = rule.label || action;
      return {
        allowed: false,
        limit: rule.maxRequests,
        remaining: 0,
        resetAfterSeconds,
        error: `Limite atteinte pour "${label}". Veuillez patienter ${resetAfterSeconds}s avant de réessayer.`,
      };
    }

    // Record this request
    log.timestamps.push(now);

    return {
      allowed: true,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - (currentCount + 1)),
      resetAfterSeconds: Math.ceil(rule.windowMs / 1000),
    };
  }

  /**
   * Asserts that an action is permitted. Throws `RateLimitError` if exceeded.
   */
  public assert(
    action: string,
    identifier?: string,
    customConfig?: Partial<RateLimitConfig>
  ): void {
    const result = this.check(action, identifier, customConfig);
    if (!result.allowed) {
      throw new RateLimitError(action, result.resetAfterSeconds, result.error);
    }
  }

  /**
   * Resets rate limit for a specific action and identifier (e.g. after successful login).
   */
  public reset(action: string, identifier?: string): void {
    const key = this.buildKey(action, identifier);
    this.logs.delete(key);
  }

  /**
   * Destroys internal interval timer (useful in tests or unmount).
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global shared client-side rate limiter
export const clientRateLimiter = new MemoryRateLimiter();

