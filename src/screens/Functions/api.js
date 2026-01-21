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
    .select('*', { count: 'exact' })
    .order('function_date', { ascending: true })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    data,
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
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addFunction(functionData) {
  const { data, error } = await supabase
    .from('functions')
    .insert(functionData)
    .select()
    .single();

  if (error) {
    console.log('error: ', error);
    throw error;
  }

  return data;
}

export async function updateFunction(id, updates) {
  const { data, error } = await supabase
    .from('functions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.log('error: ', error);
    throw error;
  }

  return data;
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