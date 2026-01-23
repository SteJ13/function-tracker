import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_CACHE_KEY = 'CATEGORIES_CACHE';

/**
 * Save categories data to offline cache
 * @param {array} data - Array of categories to cache
 * @returns {Promise<void>}
 */
export async function saveCategoriesCache(data) {
  try {
    const cacheData = {
      data: data || [],
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      CATEGORIES_CACHE_KEY,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Error saving categories cache:', error);
  }
}

/**
 * Load categories data from offline cache
 * @returns {Promise<array|null>} Cached categories or null if not exists
 */
export async function loadCategoriesCache() {
  try {
    const cachedString = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);

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
    console.error('Error loading categories cache:', error);
    return null;
  }
}

/**
 * Clear offline cache for categories
 * @returns {Promise<void>}
 */
export async function clearCategoriesCache() {
  try {
    await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing categories cache:', error);
  }
}
