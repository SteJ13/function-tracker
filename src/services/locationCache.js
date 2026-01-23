import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATIONS_CACHE_KEY = 'LOCATIONS_CACHE';

/**
 * Save locations data to offline cache
 * @param {array} data - Array of locations to cache
 * @returns {Promise<void>}
 */
export async function saveLocationsCache(data) {
  try {
    const cacheData = {
      data: data || [],
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      LOCATIONS_CACHE_KEY,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Error saving locations cache:', error);
  }
}

/**
 * Load locations data from offline cache
 * @returns {Promise<array|null>} Cached locations or null if not exists
 */
export async function loadLocationsCache() {
  try {
    const cachedString = await AsyncStorage.getItem(LOCATIONS_CACHE_KEY);

    if (!cachedString) {
      return null;
    }

    const cacheData = JSON.parse(cachedString);

    // Validate cache structure
    if (!cacheData?.data || !Array.isArray(cacheData.data)) {
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Error loading locations cache:', error);
    return null;
  }
}

/**
 * Clear offline cache for locations
 * @returns {Promise<void>}
 */
export async function clearLocationsCache() {
  try {
    await AsyncStorage.removeItem(LOCATIONS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing locations cache:', error);
  }
}
