import { supabase } from '@services/supabaseClient';
import * as db from '@services/db';
import { saveCategoriesCache } from './cache';

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

  // Cache successful response for offline access
  if (data) {
    await saveCategoriesCache(data);
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
  const data = await db.insert('categories', categoryData);
  return data;
}

export async function updateCategory(id, updates) {
  const data = await db.update('categories', id, updates);
  return data;
}

export async function deleteCategory(id) {
  await db.remove('categories', id);
  return true;
}
