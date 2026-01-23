import AsyncStorage from '@react-native-async-storage/async-storage';

const FUNCTIONS_CACHE_KEY = 'FUNCTIONS_CACHE';

/**
 * Save functions data to offline cache
 * @param {array} data - Array of functions to cache
 * @returns {Promise<void>}
 */
export async function saveFunctionsCache(data) {
  try {
    const cacheData = {
      data: data || [],
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      FUNCTIONS_CACHE_KEY,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Error saving functions cache:', error);
  }
}

/**
 * Load functions data from offline cache
 * @returns {Promise<array|null>} Cached functions or null if not exists
 */
export async function loadFunctionsCache() {
  try {
    const cachedString = await AsyncStorage.getItem(FUNCTIONS_CACHE_KEY);

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
    console.error('Error loading functions cache:', error);
    return null;
  }
}

/**
 * Clear offline cache for functions
 * @returns {Promise<void>}
 */
export async function clearFunctionsCache() {
  try {
    await AsyncStorage.removeItem(FUNCTIONS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing functions cache:', error);
  }
}
