import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

// Load queue from storage (safe parse)
async function loadQueue() {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load offline queue:', err);
    return [];
  }
}

// Persist queue to storage
async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
}

/**
 * Add an item to the offline queue
 * @param {Object} item - { id, action, table, payload, timestamp }
 */
export async function addToQueue(item) {
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
}

/**
 * Get the full offline queue
 * @returns {Promise<Array>} Queue items or empty array
 */
export async function getQueue() {
  return loadQueue();
}

/**
 * Remove an item from the queue by id
 * @param {string} id - Item id
 */
export async function removeFromQueue(id) {
  const queue = await loadQueue();
  const filtered = queue.filter(item => item.id !== id);
  await saveQueue(filtered);
}

/**
 * Clear all queued items
 */
export async function clearQueue() {
  await saveQueue([]);
}
