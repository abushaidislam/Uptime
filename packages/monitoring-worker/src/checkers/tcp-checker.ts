import { createConnection } from 'net';
import type { HealthCheckResult } from '../types.js';
import type { HealthChecker } from './interfaces.js';

export class TcpChecker implements HealthChecker {
  async check(
    url: string,
    timeout: number,
    _expectedStatus?: number
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const { hostname, port } = this.parseUrl(url);
      
      await this.connectWithTimeout(hostname, parseInt(port, 10), timeout * 1000);
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
        timestamp: new Date().toISOString(),
        location: 'default',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      let errorMessage = 'TCP connection failed';
      if (error instanceof Error) {
        if (error.message.includes('ETIMEDOUT')) {
          errorMessage = `Connection timed out after ${timeout}s`;
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - service may be down';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'Host not found';
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

  private parseUrl(url: string): { hostname: string; port: string } {
    // Handle formats: hostname:port, tcp://hostname:port, or just hostname
    let cleanUrl = url.replace(/^tcp:\/\//, '');
    
    const parts = cleanUrl.split(':');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { hostname: parts[0], port: parts[1] };
    }
    
    // Default ports for common services
    const defaultPorts: Record<string, string> = {
      'postgres': '5432',
      'mysql': '3306',
      'redis': '6379',
      'mongodb': '27017',
      'ssh': '22',
      'smtp': '587',
    };

    const hostname = parts[0] ?? cleanUrl;
    // Try to infer port from hostname or use 80 as default
    const portStr = (hostname && defaultPorts[hostname]) || '80';
    
    return { hostname, port: portStr };
  }

  private connectWithTimeout(
    hostname: string,
    port: number,
    timeoutMs: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = createConnection(port, hostname);
      const timeoutId = setTimeout(() => {
        socket.destroy();
        reject(new Error('ETIMEDOUT'));
      }, timeoutMs);

      socket.on('connect', () => {
        clearTimeout(timeoutId);
        socket.end();
        resolve();
      });

      socket.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }
}
