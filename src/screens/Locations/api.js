import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@services/supabaseClient';

const PAGE_SIZE = 10;

async function ensureOnline() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    throw new Error('Offline');
  }
}

export async function getLocations({ page = 1, limit = PAGE_SIZE, search = '' }) {
  await ensureOnline();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('locations')
    .select('id, name, tamil_name', { count: 'exact' })
    .order('name', { ascending: true });

  // Add search filter if provided
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`name.ilike.${q},tamil_name.ilike.${q}`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw error;
  }

  const total = count || 0;

  return {
    data: data || [],
    meta: {
      page,
      total,
      hasMore: total > to + 1,
    },
  };
}

export async function addLocation({ name, tamil_name }) {
  await ensureOnline();

  if (!name || !name.trim()) {
    throw new Error('Location name is required');
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: name.trim(),
      tamil_name: tamil_name?.trim() || null,
    })
    .select()
    .single(); // .single() is correct here for insert returning one row

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLocation(id, { name, tamil_name }) {
  await ensureOnline();

  if (!id) {
    throw new Error('Location ID is required');
  }

  if (!name || !name.trim()) {
    throw new Error('Location name is required');
  }

  const { data, error } = await supabase
    .from('locations')
    .update({
      name: name.trim(),
      tamil_name: tamil_name?.trim() || null,
    })
    .eq('id', id)
    .select(); // No .single() for update

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
}

export async function deleteLocation(id) {
  await ensureOnline();

  if (!id) {
    throw new Error('Location ID is required');
  }

  // Check if location is used by any contributions
  const { data: contributions, error: checkError } = await supabase
    .from('contributions')
    .select('id', { count: 'exact' })
    .eq('place_id', id);
  console.log('[deleteLocation] contributions check:', { contributions, checkError });

  if (checkError) {
    console.error('[deleteLocation] contributions check error:', checkError);
    throw checkError;
  }

  if (contributions && contributions.length > 0) {
    console.warn('[deleteLocation] Location in use by contributions:', contributions);
    throw new Error(
      'Cannot delete this location because it is being used by one or more contributions. Please update or delete those contributions first.'
    );
  }

  const { error: deleteError, data: deleteData } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  console.log('[deleteLocation] delete result:', { deleteError, deleteData });

  if (deleteError) {
    console.error('[deleteLocation] delete error:', deleteError);
    throw deleteError;
  }

  return true;
}
