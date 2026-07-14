import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import PaginatedList from '@components/PaginatedList';
import SearchInput from '@components/SearchInput';
import { getGivenContributions, getGivenContributionsSummary, markContributionReturned } from './api';
import FilterSheet from '@components/Filters/FilterSheet';

const PAGE_SIZE = 10;

export default function GivenContributionsScreen({ navigation }) {
    const [refreshKey, setRefreshKey] = useState('givenContributions');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalCashGold, setTotalCashGold] = useState({ cash: 0, gold: 0, count: 0 });
    const [filters, setFilters] = useState({});

    console.log('totalCashGold: ', totalCashGold);

    useEffect(() => {
        getSumary();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (

                <FilterSheet
                    filters={[
                        {
                            type: 'contributionType',
                            title: 'Contribution Type',
                            options: [
                                { label: 'Cash', value: 'CASH' },
                                { label: 'Gold', value: 'GOLD' },
                            ],
                        },

                        {
                            type: 'location',
                            title: 'Location',
                        },
                    ]}
                    onApply={handleFilterApply}
                />
            ),
        });
    }, [navigation]);

    const handleFilterApply = useCallback((appliedFilters) => {
        setFilters(appliedFilters);
        setRefreshKey(`givenContributions-${Date.now()}`);
    }, []);

    const getSumary = useCallback(async () => {
        try {
            const summary = await getGivenContributionsSummary();
            setTotalCashGold(summary);
        } catch (error) {
            console.error('Error fetching given contributions summary:', error);
        }
    }, []);

    const fetchData = useCallback(async ({ page, limit }) => {
        const response = await getGivenContributions({
            page,
            limit,
            searchQuery: searchTerm,
            filters
        });
        return {
            data: response.data,
            meta: {
                page: response.meta.page,
                total: response.meta.total,
                hasMore: response.meta.hasMore,
            },
        };
    }, [searchTerm, filters]);

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
            text1: 'Failed to load given contributions',
            text2: error?.message,
        });
    }, []);

    const handleSearch = useCallback((text) => {
        setSearchTerm(text);
    }, []);


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
                        <View
                            style={[
                                styles.statusBadge,
                                styles.givenBadge,
                            ]}
                        >
                            <Text style={styles.statusText}>
                                ● Given
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }, []);

    const EmptyComponent = useMemo(() => () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>No received contributions 🎉</Text>
            <Text style={styles.emptySubtext}>
                {searchTerm ? 'No matches found' : 'All contributions have been returned!'}
            </Text>
        </View>
    ), [searchTerm]);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.searchContainer}>
                    <SearchInput
                        placeholder="Search by name or location..."
                        debounceMs={300}
                        onSearch={handleSearch}
                    />
                </View>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Pending</Text>
                    <View style={styles.totalRow}>
                        <View style={styles.totalColumn}>
                            <Text style={styles.totalValueLabel}>Cash</Text>
                            <Text style={styles.totalAmountCash}>₹{totalCashGold.cash.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalColumn}>
                            <Text style={styles.totalValueLabel}>Gold</Text>
                            <Text style={styles.totalAmountGold}>{totalCashGold.gold} g</Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalColumn}>
                            <Text style={styles.totalValueLabel}>Count</Text>
                            <Text style={styles.totalAmountGold}>{totalCashGold.count}</Text>
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
    givenBadge: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#81C784',
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
