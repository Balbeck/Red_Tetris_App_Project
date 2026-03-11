'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import Notification_Component from '@/components/SharedComponents/Notification_Component';

const Providers = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    {children}
    <Notification_Component />
  </Provider>
);

export default Providers;
