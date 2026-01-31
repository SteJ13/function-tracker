import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getLocations, deleteLocation } from './api';

import EditIcon from '@components/Icons/EditIcon';
import DeleteIcon from '@components/Icons/DeleteIcon';
import PlusIcon from '@components/Icons/PlusIcon';
import SearchIcon from '@components/Icons/SearchIcon';
import MapMarkerOffIcon from '@components/Icons/MapMarkerOffIcon';

export default function LocationListScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const res = await getLocations({ search });
      setData(res.data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load locations' });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused, fetchData, refreshKey]);

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

  const renderItem = ({ item }) => {
    const isDeleting = deletingId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          {item.tamil_name ? (
            <Text style={styles.tamilName}>{item.tamil_name}</Text>
          ) : null}
        </View>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('LocationAddEdit', { location: item, onRefresh: fetchData })}
          >
            <EditIcon size={18} color="#fff" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            <DeleteIcon size={18} color="#fff" />
            <Text style={styles.buttonText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <SearchIcon size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location (English or Tamil)..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          placeholderTextColor="#aaa"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={fetchData}
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyState}>
                <MapMarkerOffIcon size={48} color="#bbb" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LocationAddEdit', { onRefresh: fetchData })}
        activeOpacity={0.85}
      >
        <PlusIcon size={28} color="#fff" style={styles.fabIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    color: '#888',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  tamilName: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#1976D2',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#bbb',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
