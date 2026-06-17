import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import SearchInput from '@components/SearchInput';
import { supabase } from '@services/supabaseClient';
import { formatContributionAmount } from '@utils/contributionFormatters';
import { getContributions, deleteContribution } from './api';
import styles from './ListScreen.styles';

const PAGE_SIZE = 10;

export default function ContributionsListScreen({ navigation, route }) {
  const functionId = route?.params?.functionId;
  const [data, setData] = useState([]);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!functionId) {
      Toast.show({ type: 'error', text1: 'Invalid function ID' });
      navigation.goBack();
    }
  }, [functionId, navigation]);

  const reloadList = useCallback(() => {
    setData([]);
    setReloadVersion(version => version + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reloadList();
    }, [reloadList])
  );

  const handleSearch = useCallback((text) => {
    setData([]);
    setSearchTerm(text);
  }, []);

  const fetchData = useCallback(async ({ page, limit }) => {
    const query = searchTerm.trim();

    if (query) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const searchPattern = `%${query}%`;
      const { data: matchingLocations, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .ilike('tamil_name', searchPattern);

      if (locationError) {
        throw locationError;
      }

      const locationIds = (matchingLocations || []).map(location => location.id);
      const filters = [
        `person_name.ilike.${searchPattern}`,
        `family_name.ilike.${searchPattern}`,
      ];

      if (locationIds.length > 0) {
        filters.push(`place_id.in.(${locationIds.join(',')})`);
      }

      const { data: searchData, count, error } = await supabase
        .from('contributions')
        .select('*, locations:place_id(id, name, tamil_name)', { count: 'exact' })
        .eq('function_id', functionId)
        .or(filters.join(','))
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const transformedData = searchData?.map(item => ({
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

    const response = await getContributions({ functionId, page, limit });

    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, [functionId, searchTerm, reloadVersion]);

  const handleDataLoaded = useCallback((newItems, meta) => {
    if (meta.page === 1) {
      setData(newItems);
    } else {
      setData(prev => [...prev, ...newItems]);
    }
  }, []);

  const handleError = useCallback((error) => {
    Toast.show({
      type: 'error',
      text1: 'Failed to load contributions',
      text2: error?.message,
    });
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete Contribution',
      `Delete contribution by "${item.person_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContribution(item.id);
              Toast.show({ type: 'success', text1: 'Contribution deleted' });
              reloadList();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to delete contribution',
                text2: error?.message,
              });
            }
          },
        },
      ]
    );
  }, [reloadList]);

  const renderItem = useCallback(({ item }) => {
    const placeName = item.location?.name || 'Unknown place';
    const placeTamil = item.location?.tamil_name || '';
    const placeDisplay = placeTamil ? `${placeName} Â· ${placeTamil}` : placeName;
    const amountDisplay = formatContributionAmount(
      item.contribution_type,
      item.amount
    );

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.personName}>{item.person_name}</Text>
          <Text style={styles.amountText}>{amountDisplay}</Text>
        </View>
        <Text style={styles.placeText}>{placeDisplay}</Text>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, item.returned ? styles.returned : styles.notReturned]}>
            <Text style={styles.statusText}>{item.returned ? 'Returned' : 'Not returned'}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('ContributionsEdit', { contribution: item, functionId })}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [handleDelete, navigation, functionId]);

  const EmptyComponent = useMemo(() => () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>
        {searchTerm ? 'No matching contributions' : 'No contributions yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchTerm
          ? 'Try a different name or Tamil location'
          : 'Tap + to add your first contribution'}
      </Text>
    </View>
  ), [searchTerm]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Search person, family, Tamil location..."
          debounceMs={300}
          onSearch={handleSearch}
        />
      </View>

      <PaginatedList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        fetchData={fetchData}
        onDataLoaded={handleDataLoaded}
        onError={handleError}
        pageSize={PAGE_SIZE}
        emptyComponent={EmptyComponent}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContributionsAdd', { functionId })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}
