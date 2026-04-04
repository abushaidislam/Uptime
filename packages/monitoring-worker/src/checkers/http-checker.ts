import type { HealthCheckResult } from '../types.js';
import type { HealthChecker } from './interfaces.js';

export class HttpChecker implements HealthChecker {
  async check(
    url: string,
    timeout: number,
    expectedStatus?: number
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'StatusVault-Monitor/1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const isExpectedStatus = expectedStatus
        ? response.status === expectedStatus
        : response.status >= 200 && response.status < 400;

      return {
        status: isExpectedStatus ? 'up' : 'down',
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        location: 'default',
        error: isExpectedStatus ? undefined : `Unexpected status code: ${response.status}`,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Request timed out after ${timeout}s`;
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ENOTFOUND')) {
          errorMessage = 'DNS lookup failed - host not found';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused';
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timed out';
        } else if (error.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || 
                   error.message.includes('UNABLE_TO_VERIFY_ISSUER')) {
          errorMessage = 'SSL certificate verification failed';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        status: 'down',
        responseTime,
        timestamp: new Date().toISOString(),
        location: 'default',
        error: errorMessage,
      };
    }
  }
}
