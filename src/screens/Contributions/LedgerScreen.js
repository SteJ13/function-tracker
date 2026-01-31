import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import PaginatedList from '@components/PaginatedList';
import { getPendingReturns, markContributionReturned } from './api';

const PAGE_SIZE = 10;

export default function LedgerScreen({ navigation }) {
  const [refreshKey, setRefreshKey] = useState('ledger');
  const [data, setData] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchTimer = useRef(null);

  const fetchData = useCallback(async ({ page, limit }) => {
    const response = await getPendingReturns({
      page,
      limit,
      searchQuery: debouncedQuery,
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
      text1: 'Failed to load pending returns',
      text2: error?.message,
    });
  }, []);

  const handleMarkAsReturned = useCallback((item) => {
    if (processingId) {
      return;
    }

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
              // Refresh list to reflect latest DB state
              setData(prev => prev.filter(i => i.id !== item.id));
              setRefreshKey(`ledger-${debouncedQuery}-${Date.now()}`);
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
  }, [processingId, debouncedQuery]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
      setData([]);
      setRefreshKey(`ledger-${text}-${Date.now()}`);
    }, 400);
  }, []);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const amount = parseFloat(item.amount) || 0;
        if (item.contribution_type === 'gold') {
          acc.gold += amount;
        } else {
          acc.cash += amount;
        }
        return acc;
      },
      { cash: 0, gold: 0 }
    );
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
    const isDisabled = Boolean(processingId);

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
              style={[styles.markButton, isDisabled && styles.markButtonDisabled]}
              onPress={() => handleMarkAsReturned(item)}
              disabled={isDisabled}
            >
              <Text style={styles.markButtonText}>
                {isProcessing ? 'Marking...' : 'Mark as Returned'}
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
      <Text style={styles.emptyText}>No pending returns 🎉</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'No matches found' : 'All contributions have been returned!'}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Pending</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalColumn}>
              <Text style={styles.totalValueLabel}>Cash</Text>
              <Text style={styles.totalAmountCash}>₹{totals.cash.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalColumn}>
              <Text style={styles.totalValueLabel}>Gold</Text>
              <Text style={styles.totalAmountGold}>{totals.gold} g</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.listContainer}>
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
      </View>
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ReturnHistory')}
        >
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  listContainer: {
    flex: 1,
  },
  totalContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  totalColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A94A6',
    marginBottom: 4,
  },
  totalAmountCash: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  totalAmountGold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  totalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E9F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderLeftWidth: 5,
    borderLeftColor: '#FF8A00',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
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
    color: '#6B7280',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: '#FFF1E6',
    borderWidth: 1,
    borderColor: '#FFC07A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C05621',
  },
  markButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  markButtonDisabled: {
    opacity: 0.6,
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7ECF2',
  },
  historyButton: {
    backgroundColor: '#EEF5FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
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
