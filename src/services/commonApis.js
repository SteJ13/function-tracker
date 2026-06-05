import { supabase } from './supabaseClient';

/**
 * Search family names from historical contributions
 */
export const searchFamilyNames = async (query) => {
    try {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const { data, error } = await supabase
            .from('contributions')
            .select('family_name')
            .not('family_name', 'is', null)
            .ilike('family_name', `%${query.trim()}%`)
            .limit(10);

        if (error) {
            console.error('[searchFamilyNames]', error);
            return [];
        }

        const uniqueNames = [
            ...new Set(
                (data || [])
                    .map(item => item.family_name?.trim())
                    .filter(Boolean)
            ),
        ];

        return uniqueNames;
    } catch (err) {
        console.error('[searchFamilyNames Exception]', err);
        return [];
    }
};

/**
 * Get all unique family names
 */
export const getDistinctFamilyNames = async () => {
    try {
        const { data, error } = await supabase
            .from('contributions')
            .select('family_name')
            .not('family_name', 'is', null);

        if (error) {
            console.error('[getDistinctFamilyNames]', error);
            return [];
        }

        return [
            ...new Set(
                (data || [])
                    .map(item => item.family_name?.trim())
                    .filter(Boolean)
            ),
        ].sort();
    } catch (err) {
        console.error('[getDistinctFamilyNames Exception]', err);
        return [];
    }
};