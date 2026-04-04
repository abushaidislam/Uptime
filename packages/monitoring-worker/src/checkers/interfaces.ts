import type { HealthCheckResult, SSLInfo } from '../types.js';

export interface HealthChecker {
  check(url: string, timeout: number, expectedStatus?: number): Promise<HealthCheckResult>;
}

export interface SSLChecker {
  check(url: string, timeout: number): Promise<SSLInfo>;
}
