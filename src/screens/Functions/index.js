import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import FunctionFilters from '@components/Filters/FunctionFilters';
import { getFunctions, deleteFunction } from './api';
import { getCategories } from '../FunctionCategories/api';
import { formatDisplayDate, formatDisplayTime } from '@utils';

const PAGE_SIZE = 10;

export default function FunctionListScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [refreshKey, setRefreshKey] = useState('functions');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    category_id: undefined,
    location_id: undefined,
    status: [],
    from_date: undefined,
    to_date: undefined,
  });

  // Load categories and locations on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [categoriesRes] = await Promise.all([
        getCategories({ page: 1, limit: 100 }),
      ]);

      const categoryOptions = categoriesRes.data.map(cat => ({
        value: cat.id,
        label: cat.name,
      }));
      setCategories(categoryOptions);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  // Calculate active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (advancedFilters.category_id) count++;
    if (advancedFilters.location_id) count++;
    if (advancedFilters.status?.length > 0) count++;
    if (advancedFilters.from_date || advancedFilters.to_date) count++;
    return count;
  }, [advancedFilters]);

  // Set header options with filter button
  useEffect(() => {
    const filterCount = getActiveFilterCount();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowFilterPanel(true)}
        >
          <Text style={styles.headerButtonText}>⚙️</Text>
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, getActiveFilterCount]);

  // Refresh list when screen is focused (returning from form or detail)
  useFocusEffect(
    useCallback(() => {
      setData([]);
      setRefreshKey(`functions-${Date.now()}`);
    }, [])
  );

  // API call with advanced filters only
  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await getFunctions({
      page,
      limit,
      filters: {
        category_id: advancedFilters.category_id,
        location_id: advancedFilters.location_id,
        status: advancedFilters.status?.length > 0 ? advancedFilters.status : undefined,
        from_date: advancedFilters.from_date,
        to_date: advancedFilters.to_date,
      },
    });

    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, [advancedFilters]);

  // Handle filter apply
  const handleFilterApply = useCallback((appliedFilters) => {
    setAdvancedFilters(appliedFilters);
    setData([]);
    setRefreshKey(`functions-${Date.now()}`);
    setShowFilterPanel(false);
  }, []);

  // Handle filter clear
  const handleFilterClear = useCallback(() => {
    setAdvancedFilters({
      category_id: undefined,
      location_id: undefined,
      status: [],
      from_date: undefined,
      to_date: undefined,
    });
    setData([]);
    setRefreshKey(`functions-${Date.now()}`);
    setShowFilterPanel(false);
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setData([]);
  }, [advancedFilters]);

  // Handle new data from PaginatedList
  const handleDataLoaded = useCallback((newItems, meta) => {
    setData(prevData => {
      if (meta.page === 1) {
        return newItems;
      }
      return [...prevData, ...newItems];
    });
  }, []);

  // Handle errors from PaginatedList
  const handleError = useCallback((error, page) => {
    Toast.show({
      type: 'error',
      text1: page === 1 ? 'Failed to load functions' : 'Failed to load more',
    });
  }, []);

  // Delete function
  const handleDelete = useCallback(
    item => {
      Alert.alert(
        'Delete Function',
        `Are you sure you want to delete "${item.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const functionId = item.id;
                await deleteFunction(functionId);

                setData(prevData =>
                  prevData.filter(f => f.id !== functionId)
                );

                Toast.show({
                  type: 'success',
                  text1: 'Function deleted',
                });
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to delete function',
                  text2: error?.message,
                });
              }
            },
          },
        ]
      );
    },
    []
  );

  // Navigate to detail screen
  const handlePress = useCallback(
    item => {
      navigation.navigate('FunctionDetail', { functionId: item.id });
    },
    [navigation]
  );

  // Navigate to edit screen
  const handleEdit = useCallback(
    item => {
      navigation.navigate('FunctionForm', { functionId: item.id });
    },
    [navigation]
  );

  // Render list item
  const renderItem = useCallback(
    ({ item }) => {
      const displayDate = formatDisplayDate(item.function_date);
      const displayTime = formatDisplayTime(
        item.function_date,
        item.function_time || item.time
      );

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.badge, styles[`badge_${item.status}`]]}>
              <Text style={styles.badgeText}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.date}>
              📅 {displayDate}{displayTime ? ` at ${displayTime}` : ''}
            </Text>
            {item.location?.name && (
              <Text style={styles.location} numberOfLines={1}>
                📍 {item.location.name}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.edit]}
              onPress={() => handleEdit(item)}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.delete]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress, handleEdit, handleDelete]
  );

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      advancedFilters.category_id ||
      advancedFilters.location_id ||
      (advancedFilters.status?.length > 0) ||
      advancedFilters.from_date ||
      advancedFilters.to_date
    );
  }, [advancedFilters]);

  // Empty state component
  const EmptyComponent = useCallback(
    () => {
      const filtersActive = hasActiveFilters();

      return (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          {filtersActive ? (
            <>
              <Text style={styles.emptyText}>No functions match your filters</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters to see more results
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={handleFilterClear}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>No functions yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create your first function
              </Text>
            </>
          )}
        </View>
      );
    },
    [hasActiveFilters, handleFilterClear]
  );

  return (
    <View style={styles.container}>
      <PaginatedList
        key={refreshKey}
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

      {/* Advanced Filter Panel Modal */}
      <Modal
        visible={showFilterPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilterPanel(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <FunctionFilters
          filters={advancedFilters}
          categoryOptions={categories}
          locationOptions={locations}
          onChange={setAdvancedFilters}
          onApply={handleFilterApply}
          onClear={handleFilterClear}
        />
      </Modal>

      {/* FAB: Add new function */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FunctionForm')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
    position: 'relative',
  },
  headerButtonText: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badge_upcoming: {
    backgroundColor: '#E3F2FD',
  },
  badge_completed: {
    backgroundColor: '#E8F5E9',
  },
  badge_cancelled: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#333',
  },
  cardBody: {
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#777',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  edit: {
    backgroundColor: '#1976D2',
  },
  delete: {
    backgroundColor: '#E53935',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
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
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976D2',
    borderRadius: 6,
    marginTop: 8,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
});
