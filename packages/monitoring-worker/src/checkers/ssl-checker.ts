import type { DetailedPeerCertificate } from 'tls';
import { connect } from 'tls';

import type { SSLInfo } from '../types.js';
import type { SSLChecker } from './interfaces.js';

export class SslChecker implements SSLChecker {
  async check(url: string, timeout: number): Promise<SSLInfo> {
    try {
      const hostname = this.extractHostname(url);
      const port = this.extractPort(url);
      const certificate = await this.getCertificate(
        hostname,
        port,
        timeout * 1000,
      );

      if (!certificate?.valid_to) {
        return {
          valid: false,
          error: 'Could not retrieve SSL certificate',
        };
      }

      const notAfter = new Date(certificate.valid_to);

      if (Number.isNaN(notAfter.getTime())) {
        return {
          valid: false,
          error: 'Invalid certificate expiry date',
        };
      }

      const daysUntilExpiry = Math.ceil(
        (notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      return {
        valid: daysUntilExpiry > 0,
        expiryDate: notAfter.toISOString(),
        daysUntilExpiry,
        issuer: this.getIssuerName(certificate),
        error: daysUntilExpiry <= 0 ? 'SSL certificate has expired' : undefined,
      };
    } catch (error) {
      let errorMessage = 'SSL check failed';

      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - cannot check SSL';
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timed out';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  private extractHostname(url: string): string {
    let cleanUrl = url.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.split('/')[0] ?? cleanUrl;
    cleanUrl = cleanUrl.split('?')[0] ?? cleanUrl;
    cleanUrl = cleanUrl.split('#')[0] ?? cleanUrl;
    return cleanUrl.split(':')[0] ?? cleanUrl;
  }

  private extractPort(url: string): number {
    if (url.startsWith('https://')) {
      return 443;
    }

    const match = url.match(/:\d+/);

    if (match) {
      return parseInt(match[0].slice(1), 10);
    }

    return 443;
  }

  private getCertificate(
    hostname: string,
    port: number,
    timeoutMs: number,
  ): Promise<DetailedPeerCertificate | null> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const finish = (
        callback: typeof resolve | typeof reject,
        value: DetailedPeerCertificate | Error | null,
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        callback(value as never);
      };

      const socket = connect({
        host: hostname,
        port,
        rejectUnauthorized: false,
        servername: hostname,
      });

      const timeoutId = setTimeout(() => {
        socket.destroy();
        finish(reject, new Error('ETIMEDOUT'));
      }, timeoutMs);

      try {
        socket.once('secureConnect', () => {
          const cert = socket.getPeerCertificate(true);
          socket.end();
          finish(resolve, cert && Object.keys(cert).length > 0 ? cert : null);
        });

        socket.once('error', (err: Error) => {
          socket.destroy();
          finish(reject, err);
        });
      } catch (err) {
        socket.destroy();
        finish(reject, err as Error);
      }
    });
  }

  private getIssuerName(certificate: DetailedPeerCertificate): string {
    const issuer = certificate.issuer;

    if (!issuer) {
      return 'Unknown';
    }

    return issuer.CN || issuer.O || issuer.OU || 'Unknown';
  }
}
