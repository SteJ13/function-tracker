import { supabase } from './supabaseClient';

/**
 * Insert a new record with automatic user_id injection
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @param {string} userId - User ID to inject
 * @returns {Promise<object>} Supabase response
 */
export async function insert(table, data, userId) {
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
 * @param {string} userId - User ID for updated_by
 * @returns {Promise<object>} Supabase response
 */
export async function update(table, id, data, userId) {
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
