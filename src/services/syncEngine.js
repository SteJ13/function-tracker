import { getQueue, removeFromQueue } from './offlineQueue';
import { addFunction, updateFunction, deleteFunction } from '@screens/Functions/api';

/**
 * Process queued offline actions with status reporting.
 * Processes sequentially to preserve order.
 * Calls setSyncStatus to track sync state in SyncContext.
 */
export async function syncOfflineQueue(setSyncStatus) {
  const queue = await getQueue();

  if (!queue || queue.length === 0) {
    return;
  }

  // Report sync started
  setSyncStatus('syncing');

  try {
    // Process sequentially to preserve order
    for (const item of queue) {
      const { id, action, table, payload } = item;
      console.log('[SyncEngine] processing', { id, action, table, payload });

      switch (`${action}:${table}`) {
        case 'create:functions': {
          const result = await addFunction(payload, payload.user_id);
          console.log('[SyncEngine] create:functions success', result);
          await removeFromQueue(id);
          break;
        }
        case 'update:functions': {
          const result = await updateFunction(payload.id, payload, payload.user_id);
          console.log('[SyncEngine] update:functions success', result);
          await removeFromQueue(id);
          break;
        }
        case 'delete:functions': {
          const result = await deleteFunction(payload.id, payload.user_id);
          console.log('[SyncEngine] delete:functions success', result);
          await removeFromQueue(id);
          break;
        }
        default:
          // TODO: handle other tables
          break;
      }
    }

    // Report sync success
    setSyncStatus('success');
  } catch (error) {
    console.error('[SyncEngine] Sync failed:', error);
    setSyncStatus('error');
    throw error;
  }
}
