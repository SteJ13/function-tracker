import { supabase } from './supabaseClient';
import { getUser } from '@utils/authStorage';

/**
 * Get current user ID from AsyncStorage
 * @throws {Error} if user not found
 * @returns {Promise<string>} user ID
 */
async function getUserId() {
  const user = await getUser();
  
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
}

/**
 * Insert a new record with automatic user_id injection
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {Promise<object>} Supabase response
 */
export async function insert(table, data) {
  const userId = await getUserId();
  
  const payload = {
    ...data,
    user_id: userId,
  };

  const { data: result, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

/**
 * Update a record with automatic updated_by injection
 * @param {string} table - Table name
 * @param {string|number} id - Record id
 * @param {object} data - Data to update
 * @returns {Promise<object>} Supabase response
 */
export async function update(table, id, data) {
  const userId = await getUserId();
  
  const payload = {
    ...data,
    updated_by: userId,
  };

  const { data: result, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

/**
 * Delete a record by id
 * @param {string} table - Table name
 * @param {string|number} id - Record id
 * @returns {Promise<void>}
 */
export async function remove(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

/**
 * Select records with custom query builder
 * @param {string} table - Table name
 * @param {function} queryBuilderCallback - Callback that receives supabase query builder
 * @returns {Promise<array>} Array of records
 */
export async function select(table, queryBuilderCallback) {
  let query = supabase.from(table).select();
  
  if (queryBuilderCallback && typeof queryBuilderCallback === 'function') {
    query = queryBuilderCallback(query);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data || [];
}
