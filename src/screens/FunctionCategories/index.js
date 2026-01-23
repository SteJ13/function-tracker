import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import PaginatedList from '@components/PaginatedList';
import { useNetwork } from '@context/NetworkContext';
import { getCategories, deleteCategory } from './api';
import { loadCategoriesCache } from './cache';

export default function FunctionCategoriesScreen({ navigation,route  }) {
  const { isOnline } = useNetwork();
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState('categories');
  const PAGE_SIZE = 10;

  // Load cached data when offline
  useEffect(() => {
    if (!isOnline) {
      loadOfflineData();
    }
  }, [isOnline]);

  const loadOfflineData = async () => {
    const cachedData = await loadCategoriesCache();
    if (cachedData && cachedData.length > 0) {
      setCategories(cachedData);
      Toast.show({
        type: 'info',
        text1: 'Offline Mode',
        text2: 'Showing cached categories',
      });
    } else {
      setCategories([]);
    }
  };

  // Refresh list when screen is focused (returning from form or detail)
  useFocusEffect(
    useCallback(() => {
      setCategories([]);
      setRefreshKey(`categories-${Date.now()}`);
    }, [])
  );

  const fetchData = useCallback(async ({ page, limit }) => {
    // When offline, return empty to disable pagination
    if (!isOnline) {
      return {
        data: [],
        meta: { page: 1, total: 0, hasMore: false },
      };
    }

    const result = await getCategories({ page, limit });
    return {
      data: result.data,
      meta: result.meta,
    };
  }, [isOnline]);

  const handleDataLoaded = useCallback((newItems, meta) => {
    setCategories(prev => (meta.page === 1 ? newItems : [...prev, ...newItems]));
  }, []);

  const handleError = useCallback((error, page) => {
    Toast.show({
      type: 'error',
      text1: page === 1 ? 'Unable to load categories' : 'Failed to load more',
      text2: error?.message,
    });
  }, []);

  const handleDelete = item => {
    if (!isOnline) {
      Toast.show({
        type: 'error',
        text1: 'Offline Mode',
        text2: 'Cannot delete while offline',
      });
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${item.name}"?`,
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
              const categoryId = item.id;
              await deleteCategory(categoryId);
              setCategories(prev => prev.filter(cat => cat.id !== categoryId));

              Toast.show({
                type: 'success',
                text1: 'Category deleted',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error.message,
              });
            }
          },
        },
      ]
    );
  };


  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.tamil}>{item.tamilName}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.edit, !isOnline && styles.actionBtnDisabled]}
          onPress={() => {
            if (!isOnline) {
              Toast.show({
                type: 'error',
                text1: 'Offline Mode',
                text2: 'Cannot edit while offline',
              });
              return;
            }
            navigation.navigate('FunctionCategoryForm', {
              category: item,
            });
          }}
          disabled={!isOnline}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.delete, !isOnline && styles.actionBtnDisabled]}
          onPress={() => handleDelete(item)}
          disabled={!isOnline}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PaginatedList
        key={refreshKey}
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        fetchData={fetchData}
        onDataLoaded={handleDataLoaded}
        onError={handleError}
        pageSize={PAGE_SIZE}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.fab, !isOnline && styles.fabDisabled]}
        onPress={() => {
          if (!isOnline) {
            Toast.show({
              type: 'error',
              text1: 'Offline Mode',
              text2: 'Cannot add while offline',
            });
            return;
          }
          navigation.navigate('FunctionCategoryForm');
        }}
        disabled={!isOnline}
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
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  textContainer: {
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tamil: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  fabDisabled: {
    opacity: 0.5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
});
