import { use } from 'react';

import { PageBody } from '@kit/ui/page';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { StatusPageSettingsContainer } from '../_components/status-page-settings-container';

function StatusPageSettingsPage() {
  use(requireUserInServerComponent());

  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col lg:max-w-4xl'}>
        <StatusPageSettingsContainer />
      </div>
    </PageBody>
  );
}

export default withI18n(StatusPageSettingsPage);
