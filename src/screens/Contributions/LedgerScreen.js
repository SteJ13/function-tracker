import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

import PaginatedList from '@components/PaginatedList';
import { getPendingReturns, markContributionReturned } from './api';

const PAGE_SIZE = 10;

export default function LedgerScreen({ navigation }) {
  const [refreshKey, setRefreshKey] = useState('ledger');
  const [data, setData] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await getPendingReturns({ page, limit });
    return {
      data: response.data,
      meta: {
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
      },
    };
  }, []);

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
      text1: 'Failed to load pending returns',
      text2: error?.message,
    });
  }, []);

  const handleMarkAsReturned = useCallback((item) => {
    Alert.alert(
      'Mark as Returned',
      `Mark "${item.person_name}"'s contribution as returned?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(item.id);
              await markContributionReturned(item.id);
              Toast.show({
                type: 'success',
                text1: 'Contribution marked as returned',
              });
              // Remove from list
              setData(prev => prev.filter(i => i.id !== item.id));
              setRefreshKey(`ledger-${Date.now()}`);
            } catch (error) {
              console.error('[Mark Returned] Error:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to mark as returned',
                text2: error?.message,
              });
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const totalAmount = useMemo(() => {
    return data.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
  }, [data]);

  const renderItem = useCallback(({ item }) => {
    const locationName = item.location?.name || 'Unknown location';
    const locationTamil = item.location?.tamil_name || '';
    const locationDisplay = locationTamil ? `${locationName} · ${locationTamil}` : locationName;
    
    const amountDisplay = item.contribution_type === 'gold'
      ? `${item.amount} grams`
      : `₹${parseFloat(item.amount).toLocaleString('en-IN')}`;

    const functionDate = item.functions?.function_date
      ? new Date(item.functions.function_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      : '';

    const familyDisplay = item.family_name ? ` (${item.family_name})` : '';

    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.personName}>{item.person_name}{familyDisplay}</Text>
            <Text style={styles.locationText}>{locationDisplay}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{amountDisplay}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.functionInfo}>
            {item.functions?.title || 'Unknown function'}
            {functionDate ? ` • ${functionDate}` : ''}
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <Text style={styles.statusText}>● Pending</Text>
            </View>

            <TouchableOpacity
              style={[styles.markButton, isProcessing && styles.markButtonDisabled]}
              onPress={() => handleMarkAsReturned(item)}
              disabled={isProcessing}
            >
              <Text style={styles.markButtonText}>
                {isProcessing ? 'Marking...' : 'Mark Returned'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [processingId, handleMarkAsReturned]);

  const EmptyComponent = useMemo(() => () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🎉</Text>
      <Text style={styles.emptyText}>No pending returns</Text>
      <Text style={styles.emptySubtext}>All contributions have been returned!</Text>
    </View>
  ), []);

  const HeaderComponent = useMemo(() => () => (
    <View style={styles.totalContainer}>
      <Text style={styles.totalLabel}>Total Pending</Text>
      <Text style={styles.totalAmount}>
        ₹{totalAmount.toLocaleString('en-IN')}
      </Text>
    </View>
  ), [totalAmount]);

  const FooterComponent = useMemo(() => () => (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('ReturnHistory')}
      >
        <Text style={styles.historyButtonText}>📋 View Return History</Text>
      </TouchableOpacity>
    </View>
  ), [navigation]);

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
        EmptyComponent={EmptyComponent}
        ListHeaderComponent={data.length > 0 ? HeaderComponent : null}
        ListFooterComponent={data.length > 0 ? FooterComponent : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  totalContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F00',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  functionInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },
  markButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  markButtonDisabled: {
    opacity: 0.6,
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  footerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  historyButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
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
