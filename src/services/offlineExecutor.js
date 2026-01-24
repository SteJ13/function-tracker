import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import { addToQueue } from './offlineQueue';

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Executes an action immediately when online, or queues it when offline.
 * Must be called from within React (follows Rules of Hooks because it uses useAuth/useNetwork).
 * @param {Object} config
 * @param {'create'|'update'|'delete'} config.action
 * @param {string} config.table
 * @param {Object} config.payload
 * @param {Function} config.apiCall - async (payload, userId) => result
 */
export function executeOfflineAction({ action, table, payload, apiCall }) {
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  const runOnline = async () => apiCall(payload, user.id);

  const queueItem = {
    id: generateTempId(),
    action,
    table,
    payload,
    timestamp: Date.now(),
  };

  const runOffline = async () => {
    await addToQueue(queueItem);
    return queueItem;
  };

  return isOnline ? runOnline() : runOffline();
}
