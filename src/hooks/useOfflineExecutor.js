import { useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import { addToQueue } from '@services/offlineQueue';

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Hook that provides executeOfflineAction method
 * Executes an action immediately when online, or queues it when offline.
 */
export default function useOfflineExecutor() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  const executeOfflineAction = useCallback(
    async ({ action, table, payload, apiCall }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (isOnline) {
        return apiCall(payload, user.id);
      }

      const queueItem = {
        id: generateTempId(),
        action,
        table,
        payload,
        timestamp: Date.now(),
      };

      await addToQueue(queueItem);
      return queueItem;
    },
    [user, isOnline]
  );

  return { executeOfflineAction };
}
