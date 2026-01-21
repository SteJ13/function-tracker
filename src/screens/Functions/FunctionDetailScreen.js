import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { getFunctionById, deleteFunction } from './api';

export default function FunctionDetailScreen({ navigation, route }) {
  const functionId = route?.params?.functionId;

  const [functionData, setFunctionData] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load function data
        const data = await getFunctionById(functionId);
        if (!data) {
          Toast.show({ type: 'error', text1: 'Function not found' });
          navigation.goBack();
          return;
        }
        setFunctionData(data);

        // TODO: Fetch categories from API and build category map
        const categories = {
          '1': 'Marriage',
          '2': 'Birthday',
          '3': 'Anniversary',
          '4': 'Celebration',
          '5': 'Event',
        };
        setCategoryMap(categories);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to load function' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (functionId) {
      loadData();
    } else {
      Toast.show({ type: 'error', text1: 'Missing function ID' });
      navigation.goBack();
    }
  }, [functionId, navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('FunctionForm', { functionId });
  }, [functionId, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Function',
      `Are you sure you want to delete "${functionData?.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFunction(functionId);

            if (success) {
              Toast.show({ type: 'success', text1: 'Function deleted' });
              navigation.goBack();
            } else {
              Toast.show({ type: 'error', text1: 'Failed to delete function' });
            }
          },
        },
      ]
    );
  }, [functionId, functionData?.title, navigation]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  if (!functionData) {
    return null;
  }

  const getCategoryName = categoryId => {
    return categoryMap[categoryId] || categoryId;
  };

  const getStatusStyle = status => {
    switch (status) {
      case 'upcoming':
        return styles.statusBadgeUpcoming;
      case 'completed':
        return styles.statusBadgeCompleted;
      case 'cancelled':
        return styles.statusBadgeCancelled;
      default:
        return styles.statusBadgeUpcoming;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{functionData.title}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(functionData.status)]}>
          <Text style={styles.statusText}>{functionData.status.charAt(0).toUpperCase() + functionData.status.slice(1)}</Text>
        </View>
      </View>

      {/* Date & Time Section */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Date & Time</Text>
          <Text style={styles.cardValue}>
            {functionData.date} at {functionData.time}
          </Text>
        </View>
      </View>

      {/* Category Section */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Category</Text>
          <Text style={styles.cardValue}>{getCategoryName(functionData.categoryId)}</Text>
        </View>
      </View>

      {/* Location Section */}
      {functionData.location ? (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Location</Text>
            <Text style={styles.cardValue}>{functionData.location}</Text>
          </View>
        </View>
      ) : null}

      {/* Notes Section */}
      {functionData.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <Text style={styles.notesText}>{functionData.notes}</Text>
        </View>
      ) : null}

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        <Text style={styles.metaText}>
          Created: {new Date(functionData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.metaText}>
          Updated: {new Date(functionData.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FA',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  /* Header Section */
  headerSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 34,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeUpcoming: {
    backgroundColor: '#2196F3',
  },
  statusBadgeCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },

  /* Card Sections */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'column',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginTop: 4,
  },

  /* Metadata Section */
  metadataSection: {
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
