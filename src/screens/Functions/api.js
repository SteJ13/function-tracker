import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@services/supabaseClient';
import * as db from '@services/db';
import { saveFunctionsCache } from './cache';

const PAGE_SIZE = 10;

// Ensure network is online before making API calls
async function ensureOnline() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    throw new Error('Offline');
  }
}

export async function getFunctions({
  page = 1,
  limit = PAGE_SIZE,
  status,
  filters = {},
}) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('functions')
    .select('*, locations(id, name), categories(id, name)', { count: 'exact' })
    .order('function_date', { ascending: true })
    .range(from, to);

  // Handle legacy status parameter for backward compatibility
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply filters
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters.location_id) {
    query = query.eq('location_id', filters.location_id);
  }

  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.function_type) {
    query = query.eq('function_type', filters.function_type);
  }

  if (filters.from_date) {
    query = query.gte('function_date', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('function_date', filters.to_date);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  // Transform location_id to location object and category_id to category object
  const transformedData = data?.map(item => ({
    ...item,
    location: item.locations || null,
    locations: undefined,
    category: item.categories || null,
    categories: undefined,
  })) || [];

  // Cache successful response on every call (including empty arrays)
  await saveFunctionsCache(transformedData);

  return {
    data: transformedData,
    meta: {
      page,
      total: count,
      hasMore: to + 1 < count,
    },
  };
}

export async function getFunctionById(id) {
  await ensureOnline();

  const { data, error } = await supabase
    .from('functions')
    .select('*, locations(id, name), categories(id, name)')
    .eq('id', id)
    .single();
  console.log('data: ', data);

  if (error) {
    throw error;
  }

  // Transform locations to location and categories to category
  return {
    ...data,
    location: data.locations || null,
    category: data.categories || null,
    locations: undefined,
    categories: undefined,
  };
}

export async function addFunction(functionData, userId) {
  await ensureOnline();

  const data = await db.insert('functions', functionData, userId);

  // Fetch with location and category data
  const { data: result, error } = await supabase
    .from('functions')
    .select('*, locations(id, name), categories(id, name)')
    .eq('id', data.id)
    .single();

  if (error) {
    throw error;
  }

  // Transform location_id to location object and category_id to category object
  return {
    ...result,
    location: result.locations || null,
    locations: undefined,
    category: result.categories || null,
    categories: undefined,
  };
}

export async function updateFunction(id, updates, userId) {
  await ensureOnline();

  await db.update('functions', id, updates, userId);

  // Fetch with location and category data
  const { data, error } = await supabase
    .from('functions')
    .select('*, locations(id, name), categories(id, name)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  // Transform locations to location and categories to category
  return {
    ...data,
    location: data.locations || null,
    category: data.categories || null,
    locations: undefined,
    categories: undefined,
  };
}

export async function deleteFunction(id) {
  await ensureOnline();

  await db.remove('functions', id);
  return true;
}

export async function getFunctionCounts() {
  await ensureOnline();

  const today = new Date().toISOString().split('T')[0];

  try {
    const { count: total, error: totalError } = await supabase
      .from('functions')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const { count: upcoming, error: upcomingError } = await supabase
      .from('functions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'upcoming');

    if (upcomingError) throw upcomingError;

    const { count: completed, error: completedError } = await supabase
      .from('functions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) throw completedError;

    const { count: todayCount, error: todayError } = await supabase
      .from('functions')
      .select('*', { count: 'exact', head: true })
      .eq('function_date', today);

    if (todayError) throw todayError;

    return {
      total: total || 0,
      upcoming: upcoming || 0,
      completed: completed || 0,
      today: todayCount || 0,
    };
  } catch (error) {
    console.error('Error fetching function counts:', error);
    return {
      total: 0,
      upcoming: 0,
      completed: 0,
      today: 0,
    };
  }
}