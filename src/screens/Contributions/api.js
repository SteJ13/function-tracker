import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@services/supabaseClient';
import * as db from '@services/db';
import { FUNCTION_TYPES } from '@globalConstant';

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
    .order('id', { ascending: false })
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
    console.log('error: ', error);
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

export async function getPendingReturns({ page = 1, limit = PAGE_SIZE, searchQuery = '', filters = {} }) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('contributions')
    .select(
      'id, person_name, family_name, spouse_name, amount, contribution_type, returned, created_at, locations:place_id(id, name, tamil_name), functions!inner(id, title, function_date, function_type)',
      { count: 'exact' }
    )
    .eq('direction', 'GIVEN_TO_ME')
    .eq('returned', false)
    .eq('functions.function_type', FUNCTION_TYPES.MY_FUNCTION)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (filters.contributionType) {
    query = query.eq(
      'contribution_type',
      filters.contributionType
    );
  }

  if (filters.locationId) {
    query = query.eq(
      'place_id',
      filters.locationId
    );
  }

  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    console.log('SEARCH QUERY FIXED');
    query = query.or(
      `person_name.ilike.${q},family_name.ilike.${q},spouse_name.ilike.${q}`
    );
  }

  query = query.range(from, to);
  const { data, count, error } = await query;

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

export async function getGivenContributions({
  page = 1,
  limit = PAGE_SIZE,
  searchQuery = '',
  filters = {},
}) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('contributions')
    .select(
      `
      id,
      person_name,
      family_name,
      spouse_name,
      amount,
      contribution_type,
      created_at,
      locations:place_id(id,name,tamil_name),
      functions!inner(
        id,
        title,
        function_date,
        function_type
      )
    `,
      { count: 'exact' }
    )
    .eq('direction', 'I_GAVE')
    .eq('functions.function_type', FUNCTION_TYPES.MY_FUNCTION)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (filters.contributionType) {
    query = query.eq(
      'contribution_type',
      filters.contributionType
    );
  }

  if (filters.locationId) {
    query = query.eq(
      'place_id',
      filters.locationId
    );
  }

  if (searchQuery?.trim()) {
    const q = `%${searchQuery.trim()}%`;

    query = query.or(
      `person_name.ilike.${q},family_name.ilike.${q},spouse_name.ilike.${q}`
    );
  }

  const { data, count, error } =
    await query.range(from, to);

  if (error) {
    throw error;
  }

  const transformedData =
    (data || []).map(item => ({
      ...item,
      location: item.locations || null,
      locations: undefined,
    }));

  return {
    data: transformedData,
    meta: {
      page,
      total: count || 0,
      hasMore: (count || 0) > to + 1,
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
      'id, person_name, family_name, spouse_name, amount, contribution_type, returned_at, locations:place_id(id, name, tamil_name), functions!inner(id, title, function_date, function_type)',
      { count: 'exact' }
    )
    .eq('returned', true)
    .eq('direction', 'GIVEN_TO_ME')
    .eq('functions.function_type', FUNCTION_TYPES.MY_FUNCTION)
    .order('id', { ascending: false })
    .order('returned_at', { ascending: false });

  // Add search filters if query provided
  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    query = query.or(
      `person_name.ilike.${q},family_name.ilike.${q},spouse_name.ilike.${q},locations.name.ilike.${q},locations.tamil_name.ilike.${q}`
    );
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw error;
  }

  const transformedData = (data || []).map(item => ({
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
      'id, person_name, family_name, amount, contribution_type, spouse_name, created_at, locations:place_id(id, name, tamil_name), functions!inner(id, title, function_date, function_type), notes'
    )
    .eq('direction', 'GIVEN_TO_ME')
    .eq('returned', false)
    .eq('place_id', placeId)
    .eq('functions.function_type', FUNCTION_TYPES.MY_FUNCTION)
    .order('id', { ascending: false })
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

export const getPendingReturnsSummary = async () => {
  const { data, error } = await supabase
    .from('contributions')
    .select(`
      amount,
      contribution_type,
      functions!inner(function_type)
    `)
    .eq('direction', 'GIVEN_TO_ME')
    .eq('returned', false)
    .eq('functions.function_type', FUNCTION_TYPES.MY_FUNCTION)
    .order('id', { ascending: false })

  if (error) {
    throw error;
  }

  return (data || []).reduce(
    (summary, item) => {
      const amount = parseFloat(item.amount) || 0;

      if ((item.contribution_type || '').toLowerCase() === 'gold') {
        summary.gold += amount;
      } else {
        summary.cash += amount;
      }

      return summary;
    },
    {
      cash: 0,
      gold: 0,
      count: data?.length || 0,
    }
  );
};

export const getGivenContributionsSummary = async () => {
  const { data, error } = await supabase
    .from('contributions')
    .select(`
      amount,
      contribution_type,
      functions!inner(function_type)
    `)
    .eq('direction', 'I_GAVE')
    .eq(
      'functions.function_type',
      FUNCTION_TYPES.MY_FUNCTION
    );

  if (error) {
    throw error;
  }

  return (data || []).reduce(
    (summary, item) => {
      const amount =
        parseFloat(item.amount) || 0;

      if (
        (item.contribution_type || '')
          .toUpperCase() === 'GOLD'
      ) {
        summary.gold += amount;
      } else {
        summary.cash += amount;
      }

      return summary;
    },
    {
      cash: 0,
      gold: 0,
      count: data?.length || 0,
    }
  );
};