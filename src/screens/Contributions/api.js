import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@services/supabaseClient';
import * as db from '@services/db';

const PAGE_SIZE = 10;

async function ensureOnline() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    throw new Error('Offline');
  }
}

export async function getContributions({ functionId, page = 1, limit = PAGE_SIZE }) {
  await ensureOnline();

  if (!functionId) {
    throw new Error('Missing function ID');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('contributions')
    .select('*, locations:place_id(id, name, tamil_name)', { count: 'exact' })
    .eq('function_id', functionId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const transformedData = data?.map(item => ({
    ...item,
    location: item.locations || null,
    locations: undefined,
  })) || [];

  const total = count || 0;

  return {
    data: transformedData,
    meta: {
      page,
      total,
      hasMore: total > to + 1,
    },
  };
}

export async function addContribution(contributionData, userId) {
  await ensureOnline();

  const inserted = await db.insert('contributions', contributionData, userId);

  const { data, error } = await supabase
    .from('contributions')
    .select('*, locations:place_id(id, name, tamil_name)')
    .eq('id', inserted.id)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    location: data.locations || null,
    locations: undefined,
  };
}

export async function updateContribution(id, updates, userId) {
  await ensureOnline();

  await db.update('contributions', id, updates, userId);

  const { data, error } = await supabase
    .from('contributions')
    .select('*, locations:place_id(id, name, tamil_name)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    location: data.locations || null,
    locations: undefined,
  };
}

export async function deleteContribution(id) {
  await ensureOnline();

  await db.remove('contributions', id);
  return true;
}
