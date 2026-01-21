import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import PaginatedList from '@components/PaginatedList';
import { getCategories, deleteCategory } from './api';

export default function FunctionCategoriesScreen({ navigation,route  }) {
  const [categories, setCategories] = useState([]);
  const PAGE_SIZE = 10;
  const listKey = route?.params?.refreshKey
    ? `categories-${route.params.refreshKey}`
    : 'categories';

  useEffect(() => {
    if (route?.params?.refreshKey) {
      setCategories([]);
      navigation.setParams({ refreshKey: null });
    }
  }, [route?.params?.refreshKey, navigation]);

  const fetchData = useCallback(async ({ page, limit }) => {
    const result = await getCategories({ page, limit });
    return {
      data: result.data,
      meta: result.meta,
    };
  }, []);

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

  const handleRefresh = useCallback(() => {
    setCategories([]);
  }, []);

  const handleDelete = item => {
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
              await deleteCategory(item.id);
              setCategories(prev => prev.filter(cat => cat.id !== item.id));

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
          style={[styles.actionBtn, styles.edit]}
          onPress={() =>
            navigation.navigate('FunctionCategoryForm', {
              category: item,
            })
          }
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
    </View>
  );

  return (
    <View style={styles.container}>
      <PaginatedList
        key={listKey}
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
        style={styles.fab}
        onPress={() => navigation.navigate('FunctionCategoryForm')}
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
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
});
