import { Suspense } from 'react';

import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { getSSLCertificates } from '~/lib/status-vault/actions';

import { SSLCertificatesTable } from './_components/ssl-certificates-table';
import { SSLExpirySummary } from './_components/ssl-expiry-summary';

export const metadata = {
  title: 'SSL Certificates',
};

async function SSLCertificatesPage() {
  const certificates = await getSSLCertificates();

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <Trans i18nKey={'ssl:pageTitle'} defaults={'SSL Certificates'} />
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans
              i18nKey={'ssl:pageDescription'}
              defaults={'Monitor SSL certificate expiration and grades for your HTTPS monitors.'}
            />
          </p>
        </div>

        <SSLExpirySummary certificates={certificates} />

        <Suspense fallback={<SSLCertificatesTableSkeleton />}>
          <SSLCertificatesTable certificates={certificates} />
        </Suspense>
      </div>
    </PageBody>
  );
}

function SSLCertificatesTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default withI18n(SSLCertificatesPage);
