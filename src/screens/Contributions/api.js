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

export async function markContributionReturned(contributionId) {
  await ensureOnline();

  if (!contributionId) {
    throw new Error('Missing contribution ID');
  }

  const { data, error } = await supabase
    .from('contributions')
    .update({
      returned: true,
      returned_at: new Date().toISOString(),
    })
    .eq('id', contributionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPendingReturns({ page = 1, limit = PAGE_SIZE }) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('contributions')
    .select(
      'id, person_name, family_name, amount, contribution_type, returned, created_at, locations:place_id(id, name, tamil_name), functions(id, title, function_date, function_type)',
      { count: 'exact' }
    )
    .eq('direction', 'GIVEN_TO_ME')
    .eq('returned', false)
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

export async function searchReturnHistory({ page = 1, limit = PAGE_SIZE, searchQuery = '' }) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('contributions')
    .select(
      'id, person_name, family_name, spouse_name, amount, contribution_type, returned_at, locations:place_id(id, name, tamil_name), functions(id, title, function_date)',
      { count: 'exact' }
    )
    .eq('returned', true)
    .order('returned_at', { ascending: false });

  // Add search filters if query provided
  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    query = query.or(
      `person_name.ilike.${q},family_name.ilike.${q},spouse_name.ilike.${q}`
    );
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw error;
  }

  // Filter by location name on client side (since it's in joined table)
  let filteredData = data || [];
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredData = filteredData.filter(item => {
      const locName = item.locations?.name?.toLowerCase() || '';
      const locTamil = item.locations?.tamil_name?.toLowerCase() || '';
      return locName.includes(q) || locTamil.includes(q);
    });
  }

  const transformedData = filteredData.map(item => ({
    ...item,
    location: item.locations || null,
    locations: undefined,
  }));

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

export async function getSuggestions({ personName, familyName, placeId }) {
  await ensureOnline();

  if (!personName || !placeId) {
    return [];
  }

  let query = supabase
    .from('contributions')
    .select(
      'id, person_name, family_name, amount, contribution_type, created_at, locations:place_id(id, name, tamil_name), functions(id, title, function_date)'
    )
    .eq('direction', 'GIVEN_TO_ME')
    .eq('returned', false)
    .eq('place_id', placeId)
    .ilike('person_name', `%${personName}%`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (familyName && familyName.trim()) {
    query = query.ilike('family_name', `%${familyName}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    location: item.locations || null,
    locations: undefined,
  }));
}
