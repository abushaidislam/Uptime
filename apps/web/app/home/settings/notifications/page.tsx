import { use } from 'react';

import { PageBody } from '@kit/ui/page';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { NotificationChannelsContainer } from './_components/notification-channels-container';

function NotificationsSettingsPage() {
  use(requireUserInServerComponent());

  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col lg:max-w-4xl'}>
        <NotificationChannelsContainer />
      </div>
    </PageBody>
  );
}

export default withI18n(NotificationsSettingsPage);
