import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import { getLocations, deleteLocation } from './api';

const PAGE_SIZE = 10;

export default function LocationsListScreen({ navigation }) {
  const [refreshKey, setRefreshKey] = useState('locations');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const searchTimer = React.useRef(null);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
      setData([]);
      setRefreshKey(`locations-${Date.now()}`);
    }, 400);
  }, []);

  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await getLocations({
      page,
      limit,
      search: debouncedQuery,
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
      text1: 'Failed to load locations',
      text2: error?.message,
    });
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete Location',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item.id);
              await deleteLocation(item.id);
              Toast.show({
                type: 'success',
                text1: 'Location deleted',
              });
              setData([]);
              setRefreshKey(`locations-${Date.now()}`);
            } catch (error) {
              console.error('[Delete Location] Error:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to delete location',
                text2: error?.message,
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(({ item }) => {
    const tamilName = item.tamil_name ? ` · ${item.tamil_name}` : '';
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.locationName}>
            {item.name}
            <Text style={styles.tamilName}>{tamilName}</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() =>
              navigation.navigate('LocationAddEdit', { location: item })
            }
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            <Text style={styles.actionText}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [deletingId, handleDelete, navigation]);

  const EmptyComponent = useMemo(() => () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Text style={styles.emptyText}>No locations yet</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? 'No matches found'
          : 'Tap + to add your first location'}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location (English or Tamil)..."
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LocationAddEdit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tamilName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#C62828',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
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
