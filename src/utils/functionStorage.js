import AsyncStorage from '@react-native-async-storage/async-storage';

const FUNCTIONS_KEY = '@FunctionTracker:functions';

/**
 * Generate a simple UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all functions from storage (internal helper)
 */
export async function getAllFunctions() {
  const stored = await AsyncStorage.getItem(FUNCTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save all functions to storage (internal helper)
 */
async function saveAllFunctions(functions) {
  await AsyncStorage.setItem(FUNCTIONS_KEY, JSON.stringify(functions));
}

/**
 * Get functions with pagination support
 * 
 * @param {Object} params
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status (optional)
 * @param {string} params.categoryId - Filter by category (optional)
 * @returns {Promise<{data, page, limit, total, hasMore}>}
 */
export async function getFunctionsPaginated({ 
  page = 1, 
  limit = 10,
  status = null,
  categoryId = null 
}) {
  try {
    // 1. Load all functions
    let functions = await getAllFunctions();

    // 2. Apply filters
    if (status) {
      functions = functions.filter(f => f.status === status);
    }

    if (categoryId) {
      functions = functions.filter(f => f.categoryId === categoryId);
    }

    // 3. Sort by date (upcoming first - ascending order)
    functions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    // 4. Calculate pagination
    const total = functions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const hasMore = endIndex < total;

    // 5. Slice data for current page
    const paginatedData = functions.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      page,
      limit,
      total,
      hasMore,
    };
  } catch (error) {
    console.error('Error getting functions:', error);
    return {
      data: [],
      page,
      limit,
      total: 0,
      hasMore: false,
    };
  }
}

/**
 * Get a single function by ID
 * 
 * @param {string} id - Function ID
 * @returns {Promise<Object|null>}
 */
export async function getFunctionById(id) {
  const functions = await getAllFunctions();
  return functions.find(f => f.id === id) || null;
}

/**
 * Create a new function
 * 
 * @param {Object} functionData - Function data (without id, createdAt, updatedAt)
 * @returns {Promise<Object>} Created function with generated fields
 */
export async function createFunction(functionData) {
  const functions = await getAllFunctions();

  const now = new Date().toISOString();
  const newFunction = {
    id: generateUUID(),
    ...functionData,
    createdAt: now,
    updatedAt: now,
  };

  functions.push(newFunction);
  await saveAllFunctions(functions);

  return newFunction;
}

/**
 * Update an existing function
 * 
 * @param {string} id - Function ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated function or null if not found
 */
export async function updateFunction(id, updates) {
  const functions = await getAllFunctions();
  const index = functions.findIndex(f => f.id === id);

  if (index === -1) {
    return null;
  }

  const updatedFunction = {
    ...functions[index],
    ...updates,
    id: functions[index].id, // Prevent ID change
    createdAt: functions[index].createdAt, // Preserve createdAt
    updatedAt: new Date().toISOString(),
  };

  functions[index] = updatedFunction;
  await saveAllFunctions(functions);

  return updatedFunction;
}

/**
 * Delete a function by ID
 * 
 * @param {string} id - Function ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteFunction(id) {
  const functions = await getAllFunctions();
  const filteredFunctions = functions.filter(f => f.id !== id);

  if (filteredFunctions.length === functions.length) {
    return false; // Not found
  }

  await saveAllFunctions(filteredFunctions);
  return true;
}

/**
 * Clear all functions (for testing/reset)
 * 
 * @returns {Promise<void>}
 */
export async function clearAllFunctions() {
  await AsyncStorage.removeItem(FUNCTIONS_KEY);
}
