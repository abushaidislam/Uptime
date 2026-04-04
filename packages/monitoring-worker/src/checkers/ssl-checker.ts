import forge from 'node-forge';
import type { SSLInfo } from '../types.js';
import type { SSLChecker } from './interfaces.js';
import { connect } from 'tls';

export class SslChecker implements SSLChecker {
  async check(url: string, timeout: number): Promise<SSLInfo> {
    try {
      const hostname = this.extractHostname(url);
      const port = this.extractPort(url);

      const certificate = await this.getCertificate(hostname, port, timeout * 1000);
      
      if (!certificate) {
        return {
          valid: false,
          error: 'Could not retrieve SSL certificate',
        };
      }

      const parsed = forge.pki.certificateFromPem(certificate);
      const validity = parsed.validity;
      
      if (!validity.notAfter) {
        return {
          valid: false,
          error: 'Invalid certificate - no expiry date found',
        };
      }

      const expiryDate = validity.notAfter.toISOString();
      const daysUntilExpiry = Math.ceil(
        (validity.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const issuer = parsed.issuer.getField('CN')?.value || 'Unknown';

      return {
        valid: daysUntilExpiry > 0,
        expiryDate,
        daysUntilExpiry,
        issuer,
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
    // Remove protocol if present
    let cleanUrl = url.replace(/^https?:\/\//, '');
    // Remove path, query, fragment
    const pathParts = cleanUrl.split('/');
    cleanUrl = pathParts[0] ?? cleanUrl;
    const queryParts = cleanUrl.split('?');
    cleanUrl = queryParts[0] ?? cleanUrl;
    const fragParts = cleanUrl.split('#');
    cleanUrl = fragParts[0] ?? cleanUrl;
    // Remove port if present
    return cleanUrl.split(':')[0] ?? cleanUrl;
  }

  private extractPort(url: string): number {
    if (url.startsWith('https://')) return 443;
    
    const match = url.match(/:\d+/);
    if (match) {
      return parseInt(match[0].slice(1), 10);
    }
    
    return 443; // Default to HTTPS
  }

  private getCertificate(
    hostname: string,
    port: number,
    timeoutMs: number
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('ETIMEDOUT'));
      }, timeoutMs);

      try {
        const socket = connect({
          host: hostname,
          port: port,
          rejectUnauthorized: false, // Allow self-signed for checking
        });

        socket.on('secureConnect', () => {
          clearTimeout(timeoutId);
          const cert = socket.getPeerCertificate(true);
          socket.end();
          
          if (cert && cert.raw) {
            const pemCert = forge.pki.certificateToPem(
              forge.pki.certificateFromAsn1(
                forge.asn1.fromDer(cert.raw.toString('binary'))
              )
            );
            resolve(pemCert);
          } else {
            resolve(null);
          }
        });

        socket.on('error', (err: Error) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  }
}
