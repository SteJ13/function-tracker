import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import { getContributions, deleteContribution } from './api';

const PAGE_SIZE = 10;

export default function ContributionsListScreen({ navigation, route }) {
  const functionId = route?.params?.functionId;
  const [data, setData] = useState([]);
  const [refreshKey, setRefreshKey] = useState('contributions');

  useEffect(() => {
    if (!functionId) {
      Toast.show({ type: 'error', text1: 'Invalid function ID' });
      navigation.goBack();
    }
  }, [functionId, navigation]);

  useFocusEffect(
    useCallback(() => {
      setData([]);
      setRefreshKey(`contributions-${Date.now()}`);
    }, [])
  );

  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await getContributions({ functionId, page, limit });

    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, [functionId]);

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
              setData([]);
              setRefreshKey(`contributions-${Date.now()}`);
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
  }, []);

  const renderItem = useCallback(({ item }) => {
    const placeName = item.location?.name || 'Unknown place';
    const placeTamil = item.location?.tamil_name || '';
    const placeDisplay = placeTamil ? `${placeName} · ${placeTamil}` : placeName;
    const amountDisplay = item.contribution_type === 'gold'
      ? `${item.amount} grams`
      : `₹${parseFloat(item.amount).toLocaleString('en-IN')}`;

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
      <Text style={styles.emptyText}>No contributions yet</Text>
      <Text style={styles.emptySubtext}>Tap + to add your first contribution</Text>
    </View>
  ), []);

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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContributionsAdd', { functionId })}
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
  },
  placeText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returned: {
    backgroundColor: '#4CAF50',
  },
  notReturned: {
    backgroundColor: '#BDBDBD',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
  },
});
