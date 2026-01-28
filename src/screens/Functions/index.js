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
import { getFunctions } from './api';
import { getCategories } from '../FunctionCategories/api';
import { formatDisplayDate, formatDisplayTime } from '@utils';
import { loadFunctionsCache } from './cache';
import useFunctionActions from './useFunctionActions';
import { useNetwork } from '@context/NetworkContext';

const PAGE_SIZE = 10;
const FUNCTION_TABS = [
  { key: 'MY_FUNCTION', label: 'My Functions' },
  { key: 'INVITATION', label: 'Invitations' },
];

export default function FunctionListScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [refreshKey, setRefreshKey] = useState('functions');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('MY_FUNCTION');
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const { isOnline } = useNetwork();
  const [advancedFilters, setAdvancedFilters] = useState({
    category_id: undefined,
    location_id: undefined,
    status: [],
    from_date: undefined,
    to_date: undefined,
  });
  const { deleteFunction: deleteFunctionAction } = useFunctionActions();

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

  // Load offline cache when going offline
  useEffect(() => {
    if (!isOnline) {
      loadOfflineData();
    }
  }, [isOnline]);

  const loadOfflineData = useCallback(async () => {
    try {
      const cachedData = await loadFunctionsCache();
      if (cachedData) {
        setData(cachedData);
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Viewing cached data',
        });
      }
    } catch (error) {
      console.error('Error loading offline cache:', error);
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
        function_type: activeTab,
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
  }, [advancedFilters, activeTab]);

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

  useEffect(() => {
    setData([]);
    setRefreshKey(`functions-${activeTab}-${Date.now()}`);
  }, [activeTab]);

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

  // Delete function - disabled when offline
  const handleDelete = useCallback(
    item => {
      if (!isOnline) {
        Toast.show({
          type: 'info',
          text1: 'Add, Edit and Delete are disabled while offline.',
        });
        return;
      }

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
                await deleteFunctionAction(functionId);

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
    [deleteFunctionAction, isOnline]
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
      if (!isOnline) {
        Toast.show({
          type: 'info',
          text1: 'Add, Edit and Delete are disabled while offline.',
        });
        return;
      }
      navigation.navigate('FunctionForm', { functionId: item.id });
    },
    [navigation, isOnline]
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
              style={[
                styles.actionBtn,
                styles.edit,
                isOnline ? {} : styles.actionBtnDisabled,
              ]}
              onPress={() => handleEdit(item)}
              disabled={!isOnline}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.delete,
                isOnline ? {} : styles.actionBtnDisabled,
              ]}
              onPress={() => handleDelete(item)}
              disabled={!isOnline}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress, handleEdit, handleDelete, isOnline]
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

      // Offline with no cache
      if (!isOnline && data.length === 0) {
        return (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyText}>No Offline Cache</Text>
            <Text style={styles.emptySubtext}>
              Go online to load and cache functions
            </Text>
          </View>
        );
      }

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
    [hasActiveFilters, handleFilterClear, isOnline, data.length]
  );

  const fabLabel = activeTab === 'MY_FUNCTION' ? 'Add Function' : 'Add Invitation';
  const functionTypeParam = activeTab === 'MY_FUNCTION' ? 'MY_FUNCTION' : 'INVITATION';

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {FUNCTION_TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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

      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineIndicatorText}>📡 Offline Mode (cached data)</Text>
        </View>
      )}

      {/* FAB: Add new function - disabled when offline */}
      <TouchableOpacity
        style={[styles.fab, !isOnline && styles.fabDisabled]}
        onPress={() => {
          if (!isOnline) {
            Toast.show({
              type: 'info',
              text1: 'Add, Edit and Delete are disabled while offline.',
            });
          } else {
            navigation.navigate('FunctionForm', { function_type: functionTypeParam });
          }
        }}
        disabled={!isOnline}
      >
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabLabel}>{fabLabel}</Text>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#1976D2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
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
  actionBtnDisabled: {
    opacity: 0.5,
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
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    flexDirection: 'row',
    gap: 8,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '700',
  },
  fabLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  offlineIndicatorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});