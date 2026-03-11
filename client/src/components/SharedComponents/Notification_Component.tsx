'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { removeNotification } from '@/store/slices/uiSlice';
import { useEffect } from 'react';

const Notification_Component = () => {
  const notifications = useSelector((s: RootState) => s.ui.notifications);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    const timer = setTimeout(() => dispatch(removeNotification(latest.id)), 4000);
    return () => clearTimeout(timer);
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  const colorMap = {
    error: 'bg-red-500/20 border-red-500/40 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    success: 'bg-green-500/20 border-green-500/40 text-green-300',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={[
            'px-5 py-3 rounded-xl border glass animate-slide-up',
            'text-sm font-medium max-w-xs',
            colorMap[n.type],
          ].join(' ')}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default Notification_Component;
