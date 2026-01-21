import { supabase } from '@services/supabaseClient';

const PAGE_SIZE = 10;

export async function getCategories({
  page = 1,
  limit = PAGE_SIZE,
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    data: data ?? [],
    meta: {
      page,
      total: count,
      hasMore: to + 1 < count,
    },
  };
}

export async function getCategoryByUuid(id) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addCategory(categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}
