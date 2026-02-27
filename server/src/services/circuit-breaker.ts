// ============================================================
// SocialHomes.Ai — Circuit Breaker Pattern
// Task 5.2.5: Per-source failure tracking, state machine,
// configurable thresholds, fallback activation, metrics
// ============================================================

// ---- Types ----

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;     // failures before opening (default: 5)
  successThreshold: number;     // successes in half-open to close (default: 2)
  timeout: number;              // ms before half-open (default: 60000)
  monitorWindowMs: number;      // rolling window for failure count (default: 120000)
  fallbackFn?: () => unknown;
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureAt: number;
  lastSuccessAt: number;
  openedAt: number;
  totalFailures: number;
  totalSuccesses: number;
  totalRequests: number;
  consecutiveFailures: number;
  lastError?: string;
  failures: number[]; // timestamps of recent failures
}

// ---- Registry ----

const circuits = new Map<string, CircuitBreakerState>();
const configs = new Map<string, CircuitBreakerConfig>();

// ---- Default Config ----

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,        // 60 seconds
  monitorWindowMs: 120000, // 2 minutes
};

// ---- Public API ----

export function registerCircuitBreaker(config: CircuitBreakerConfig): void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  configs.set(config.name, fullConfig);
  circuits.set(config.name, {
    state: 'closed',
    failureCount: 0,
    successCount: 0,
    lastFailureAt: 0,
    lastSuccessAt: 0,
    openedAt: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    totalRequests: 0,
    consecutiveFailures: 0,
    failures: [],
  });
}

/**
 * Execute a function with circuit breaker protection.
 *
 * - Closed: requests pass through normally. Failures increment counter.
 * - Open: requests are immediately rejected (or fallback is called).
 * - Half-open: one request is allowed through. Success closes, failure re-opens.
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallbackFn?: () => T | Promise<T>,
): Promise<T> {
  const config = configs.get(name);
  let circuit = circuits.get(name);

  // Auto-register if not configured
  if (!config || !circuit) {
    registerCircuitBreaker({ name, ...DEFAULT_CONFIG });
    circuit = circuits.get(name)!;
  }

  const cfg = configs.get(name)!;
  circuit.totalRequests++;

  // Clean up old failures outside the monitoring window
  const now = Date.now();
  circuit.failures = circuit.failures.filter(t => now - t < cfg.monitorWindowMs);
  circuit.failureCount = circuit.failures.length;

  // State transition: open -> half-open after timeout
  if (circuit.state === 'open' && now - circuit.openedAt >= cfg.timeout) {
    circuit.state = 'half-open';
    circuit.successCount = 0;
    console.log(`[circuit-breaker] ${name}: open -> half-open`);
  }

  // Open state: reject or fallback
  if (circuit.state === 'open') {
    const fb = fallbackFn || cfg.fallbackFn;
    if (fb) {
      return fb() as T;
    }
    throw new CircuitBreakerError(
      `Circuit breaker '${name}' is OPEN. Service unavailable. Last error: ${circuit.lastError || 'unknown'}`,
      name,
      circuit.state,
    );
  }

  // Closed or Half-open: attempt the call
  try {
    const result = await fn();
    onSuccess(name, circuit, cfg);
    return result;
  } catch (err: any) {
    onFailure(name, circuit, cfg, err.message);
    // Re-throw unless we have a fallback
    const fb = fallbackFn || cfg.fallbackFn;
    if (fb) {
      return fb() as T;
    }
    throw err;
  }
}

// ---- Internal Handlers ----

function onSuccess(name: string, circuit: CircuitBreakerState, config: CircuitBreakerConfig): void {
  circuit.totalSuccesses++;
  circuit.lastSuccessAt = Date.now();
  circuit.consecutiveFailures = 0;

  if (circuit.state === 'half-open') {
    circuit.successCount++;
    if (circuit.successCount >= config.successThreshold) {
      circuit.state = 'closed';
      circuit.failureCount = 0;
      circuit.failures = [];
      console.log(`[circuit-breaker] ${name}: half-open -> closed`);
    }
  }
}

function onFailure(name: string, circuit: CircuitBreakerState, config: CircuitBreakerConfig, error: string): void {
  const now = Date.now();
  circuit.totalFailures++;
  circuit.lastFailureAt = now;
  circuit.consecutiveFailures++;
  circuit.lastError = error;
  circuit.failures.push(now);

  // Clean window
  circuit.failures = circuit.failures.filter(t => now - t < config.monitorWindowMs);
  circuit.failureCount = circuit.failures.length;

  if (circuit.state === 'half-open') {
    // Any failure in half-open immediately re-opens
    circuit.state = 'open';
    circuit.openedAt = now;
    circuit.successCount = 0;
    console.log(`[circuit-breaker] ${name}: half-open -> open (failure in test request)`);
  } else if (circuit.state === 'closed' && circuit.failureCount >= config.failureThreshold) {
    circuit.state = 'open';
    circuit.openedAt = now;
    console.log(`[circuit-breaker] ${name}: closed -> open (${circuit.failureCount} failures in window)`);
  }
}

// ---- Status & Metrics ----

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  consecutiveFailures: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastError?: string;
  config: {
    failureThreshold: number;
    successThreshold: number;
    timeoutMs: number;
  };
}

export function getCircuitBreakerStatus(name: string): CircuitBreakerStatus | null {
  const circuit = circuits.get(name);
  const config = configs.get(name);
  if (!circuit || !config) return null;

  return {
    name,
    state: circuit.state,
    failureCount: circuit.failureCount,
    successCount: circuit.successCount,
    totalRequests: circuit.totalRequests,
    totalFailures: circuit.totalFailures,
    totalSuccesses: circuit.totalSuccesses,
    consecutiveFailures: circuit.consecutiveFailures,
    lastFailureAt: circuit.lastFailureAt ? new Date(circuit.lastFailureAt).toISOString() : null,
    lastSuccessAt: circuit.lastSuccessAt ? new Date(circuit.lastSuccessAt).toISOString() : null,
    lastError: circuit.lastError,
    config: {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeoutMs: config.timeout,
    },
  };
}

export function getAllCircuitBreakerStatuses(): CircuitBreakerStatus[] {
  const statuses: CircuitBreakerStatus[] = [];
  for (const name of circuits.keys()) {
    const status = getCircuitBreakerStatus(name);
    if (status) statuses.push(status);
  }
  return statuses;
}

export function resetCircuitBreaker(name: string): boolean {
  const circuit = circuits.get(name);
  if (!circuit) return false;

  circuit.state = 'closed';
  circuit.failureCount = 0;
  circuit.successCount = 0;
  circuit.consecutiveFailures = 0;
  circuit.failures = [];
  console.log(`[circuit-breaker] ${name}: manually reset to closed`);
  return true;
}

// ---- Custom Error ----

export class CircuitBreakerError extends Error {
  circuitName: string;
  circuitState: CircuitState;

  constructor(message: string, circuitName: string, circuitState: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.circuitName = circuitName;
    this.circuitState = circuitState;
  }
}

// ---- Pre-register External API Circuits ----

const EXTERNAL_API_CIRCUITS: CircuitBreakerConfig[] = [
  { name: 'police.uk', failureThreshold: 5, successThreshold: 2, timeout: 60000, monitorWindowMs: 120000 },
  { name: 'open-meteo', failureThreshold: 5, successThreshold: 2, timeout: 60000, monitorWindowMs: 120000 },
  { name: 'defra-flood', failureThreshold: 5, successThreshold: 2, timeout: 60000, monitorWindowMs: 120000 },
  { name: 'postcodes.io', failureThreshold: 5, successThreshold: 2, timeout: 30000, monitorWindowMs: 60000 },
  { name: 'uprn.uk', failureThreshold: 5, successThreshold: 2, timeout: 30000, monitorWindowMs: 60000 },
  { name: 'nomis', failureThreshold: 3, successThreshold: 2, timeout: 120000, monitorWindowMs: 300000 },
  { name: 'vertex-ai', failureThreshold: 3, successThreshold: 1, timeout: 30000, monitorWindowMs: 60000 },
];

for (const config of EXTERNAL_API_CIRCUITS) {
  registerCircuitBreaker(config);
}
