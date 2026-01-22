import { supabase } from '@services/supabaseClient';

const PAGE_SIZE = 10;

export async function getFunctions({
  page = 1,
  limit = PAGE_SIZE,
  status,
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('functions')
    .select('*, locations(id, name)', { count: 'exact' })
    .order('function_date', { ascending: true })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  // Transform location_id to location object
  const transformedData = data?.map(item => ({
    ...item,
    location: item.locations || null,
    locations: undefined,
  })) || [];

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
  const { data, error } = await supabase
    .from('functions')
    .select('*, locations(id, name)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  // Transform location_id to location object
  return {
    ...data,
    location: data.locations || null,
    locations: undefined,
  };
}

export async function addFunction(functionData) {
  const { data, error } = await supabase
    .from('functions')
    .insert(functionData)
    .select('*, locations(id, name)')
    .single();

  if (error) {
    console.log('error: ', error);
    throw error;
  }

  // Transform location_id to location object
  return {
    ...data,
    location: data.locations || null,
    locations: undefined,
  };
}

export async function updateFunction(id, updates) {
  const { data, error } = await supabase
    .from('functions')
    .update(updates)
    .eq('id', id)
    .select('*, locations(id, name)')
    .single();

  if (error) {
    console.log('error: ', error);
    throw error;
  }

  // Transform location_id to location object
  return {
    ...data,
    location: data.locations || null,
    locations: undefined,
  };
}

export async function deleteFunction(id) {
  const { error } = await supabase
    .from('functions')
    .delete()
    .eq('id', id);

  if (error) {
    console.log('error: ', error);
    throw error;
  }

  return true;
}

export async function getFunctionCounts() {
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