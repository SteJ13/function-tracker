import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import { getFunctions, deleteFunction } from './api';
import { formatDisplayDate, formatDisplayTime } from '@utils';

const PAGE_SIZE = 10;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function FunctionListScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState('functions');

  // Refresh list when screen is focused (returning from form or detail)
  useFocusEffect(
    useCallback(() => {
      setData([]);
      setRefreshKey(`functions-${Date.now()}`);
    }, [])
  );

  // API call with status filter
  const fetchData = useCallback(async ({ page, limit }) => {
    const filterStatus = activeFilter === 'all' ? null : activeFilter;

    const response = await getFunctions({
      page,
      limit,
      status: filterStatus,
    });

    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, [activeFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setData([]);
  }, [activeFilter]);

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

  // Empty state component
  const EmptyComponent = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No functions yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the + button to create your first function
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                activeFilter === filter.id && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter.id && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#1976D2',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  filterTabTextActive: {
    color: '#1976D2',
    fontWeight: '600',
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
