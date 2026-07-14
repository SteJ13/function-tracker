import { supabase } from './supabaseClient';

/**
 * Search family names from historical contributions
 */
export const searchContributionField = async (field, searchText) => {
    const SEARCHABLE_CONTRIBUTION_FIELDS = ['family_name', 'person_name', 'spouse_name'];

    if (!SEARCHABLE_CONTRIBUTION_FIELDS.includes(field)) {
        return [];
    }

    const trimmedText = searchText?.trim();
    if (!trimmedText || trimmedText.length < 2) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('contributions')
            .select(field)
            .not(field, 'is', null)
            .neq(field, '')
            .ilike(field, `%${trimmedText}%`)
            .limit(20);

        if (error) {
            console.error('[searchContributionField]', error);
            return [];
        }

        const uniqueValues = [];
        const seenValues = new Set();

        (data || []).forEach((item) => {
            const value = item[field]?.trim();
            if (!value) {
                return;
            }

            const key = value.toLowerCase();
            if (seenValues.has(key)) {
                return;
            }

            seenValues.add(key);
            uniqueValues.push(value);
        });

        return uniqueValues;
    } catch (err) {
        console.error('[searchContributionField Exception]', err);
        return [];
    }
};

export const searchFamilyNames = async (query) => searchContributionField('family_name', query);

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