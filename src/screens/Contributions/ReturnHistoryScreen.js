import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import { searchReturnHistory } from './api';

const PAGE_SIZE = 10;

export default function ReturnHistoryScreen({ navigation }) {
  const [refreshKey, setRefreshKey] = useState('history');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchTimer = React.useRef(null);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
      setData([]);
      setRefreshKey(`history-${Date.now()}`);
    }, 400);
  }, []);

  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await searchReturnHistory({
      page,
      limit,
      searchQuery: debouncedQuery,
    });
    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, [debouncedQuery]);

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
      text1: 'Failed to load return history',
      text2: error?.message,
    });
  }, []);

  const renderItem = useCallback(({ item }) => {
    const locationName = item.location?.name || 'Unknown location';
    const locationTamil = item.location?.tamil_name || '';
    const locationDisplay = locationTamil
      ? `${locationName} · ${locationTamil}`
      : locationName;

    const amountDisplay = item.contribution_type === 'gold'
      ? `${item.amount} grams`
      : `₹${parseFloat(item.amount).toLocaleString('en-IN')}`;

    const functionDate = item.functions?.function_date
      ? new Date(item.functions.function_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

    const returnedDate = item.returned_at
      ? new Date(item.returned_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

    const spouseDisplay = item.spouse_name ? ` + ${item.spouse_name}` : '';
    const familyDisplay = item.family_name ? ` (${item.family_name})` : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.personName}>
              {item.person_name}
              {familyDisplay}
              {spouseDisplay}
            </Text>
            <Text style={styles.locationText}>{locationDisplay}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{amountDisplay}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailsRow}>
            <Text style={styles.label}>Function:</Text>
            <Text style={styles.value}>
              {item.functions?.title || 'Unknown function'}
              {functionDate ? ` (${functionDate})` : ''}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.label}>Returned:</Text>
            <Text style={[styles.value, styles.returnedDate]}>{returnedDate}</Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const EmptyComponent = useMemo(() => () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✓</Text>
      <Text style={styles.emptyText}>No return history yet</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'No matches found' : 'Returned contributions will appear here'}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or location..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
      </View>

      <PaginatedList
        key={refreshKey}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        fetchData={fetchData}
        onDataLoaded={handleDataLoaded}
        onError={handleError}
        pageSize={PAGE_SIZE}
        EmptyComponent={EmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    color: '#555',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  returnedDate: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
