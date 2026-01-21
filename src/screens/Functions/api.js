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

export async function addFunction(functionData) {
  await supabase.from('functions').insert(functionData);
}

export async function updateFunction(id, updates) {
  await supabase.from('functions').update(updates).eq('id', id);
}

export async function deleteFunction(id) {
  await supabase.from('functions').delete().eq('id', id);
}