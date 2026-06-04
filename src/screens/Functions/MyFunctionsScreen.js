import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
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
import { getFunctionStatus, sortFunctionsByStatus } from '@utils/statusHelper';

const PAGE_SIZE = 10;

export default function MyFunctionsScreen({ navigation }) {
    const [data, setData] = useState([]);
    const [refreshKey, setRefreshKey] = useState('my-functions');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [categories, setCategories] = useState([]);
    const { isOnline } = useNetwork();
    const [advancedFilters, setAdvancedFilters] = useState({
        category_id: undefined,
        location_id: undefined,
        from_date: undefined,
        to_date: undefined,
    });
    const { deleteFunction: deleteFunctionAction } = useFunctionActions();

    // Load categories on mount
    useEffect(() => {
        loadFilterOptions();
    }, []);

    const loadFilterOptions = useCallback(async () => {
        try {
            const categoriesRes = await getCategories({ page: 1, limit: 100 });
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
                const myFunctions = cachedData.filter(f => f.function_type === 'MY_FUNCTION');
                const sorted = sortFunctionsByStatus(myFunctions);
                setData(sorted);
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
        if (advancedFilters.from_date || advancedFilters.to_date) count++;
        return count;
    }, [advancedFilters]);

    // Set header options with filter button
    useEffect(() => {
        const filterCount = getActiveFilterCount();
        navigation.setOptions({
            title: 'My Functions',
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

    // Refresh list when screen is focused
    useFocusEffect(
        useCallback(() => {
            setData([]);
            setRefreshKey(`my-functions-${Date.now()}`);
        }, [])
    );

    // Fetch data with MY_FUNCTION type filter
    const fetchData = useCallback(async ({ page, limit }) => {
        const response = await getFunctions({
            page,
            limit,
            filters: {
                category_id: advancedFilters.category_id,
                location_id: advancedFilters.location_id,
                from_date: advancedFilters.from_date,
                to_date: advancedFilters.to_date,
                function_type: 'MY_FUNCTION', // Only MY_FUNCTION type
            },
        });

        // Sort by status
        const sorted = sortFunctionsByStatus(response.data);

        return {
            data: sorted,
            meta: {
                page: response.meta.page,
                total: response.meta.total,
                hasMore: response.meta.hasMore,
            },
        };
    }, [advancedFilters]);

    // Handle filter apply
    const handleFilterApply = useCallback((appliedFilters) => {
        setAdvancedFilters(appliedFilters);
        setData([]);
        setRefreshKey(`my-functions-${Date.now()}`);
        setShowFilterPanel(false);
    }, []);

    // Handle filter clear
    const handleFilterClear = useCallback(() => {
        setAdvancedFilters({
            category_id: undefined,
            location_id: undefined,
            from_date: undefined,
            to_date: undefined,
        });
        setData([]);
        setRefreshKey(`my-functions-${Date.now()}`);
        setShowFilterPanel(false);
    }, []);

    // Reset when filters change
    useEffect(() => {
        setData([]);
    }, [advancedFilters]);

    // Handle new data from PaginatedList
    const handleDataLoaded = useCallback((newItems, meta) => {
        setData(prevData => {
            if (meta.page === 1) {
                return newItems;
            }
            return [...prevData, ...newItems];
        });
    }, []);

    // Handle errors
    const handleError = useCallback((error, page) => {
        Toast.show({
            type: 'error',
            text1: page === 1 ? 'Failed to load functions' : 'Failed to load more',
        });
    }, []);

    // Delete function
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
                                setData(prevData => prevData.filter(f => f.id !== functionId));
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

    // Navigate to detail
    const handlePress = useCallback(
        item => {
            navigation.navigate('FunctionDetail', { functionId: item.id });
        },
        [navigation]
    );

    // Navigate to edit
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

    // Render item with computed status
    const renderItem = useCallback(
        ({ item }) => {
            const displayDate = formatDisplayDate(item.function_date);
            const displayTime = formatDisplayTime(item.function_date, item.function_time);
            const status = getFunctionStatus(item.function_date, item.function_time);

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
                        <View style={[styles.badge, { backgroundColor: status.color }]}>
                            <Text style={styles.badgeText}>
                                {status.label}
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
                            style={[styles.viewContributionsButton]}
                            onPress={() => navigation.navigate('ContributionsList', { functionId: item.id })}
                        >
                            <Text style={styles.viewContributionsButtonText}>View Contributions</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            );
        },
        [handlePress, handleEdit, handleDelete, isOnline]
    );

    // Check active filters
    const hasActiveFilters = useCallback(() => {
        return (
            advancedFilters.category_id ||
            advancedFilters.location_id ||
            advancedFilters.from_date ||
            advancedFilters.to_date
        );
    }, [advancedFilters]);

    // Empty state
    const EmptyComponent = useCallback(
        () => {
            const filtersActive = hasActiveFilters();

            if (!isOnline && data.length === 0) {
                return (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📡</Text>
                        <Text style={styles.emptyText}>No Offline Cache</Text>
                        <Text style={styles.emptySubtext}>Go online to load and cache functions</Text>
                    </View>
                );
            }

            return (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    {filtersActive ? (
                        <>
                            <Text style={styles.emptyText}>No functions match your filters</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                            <TouchableOpacity
                                style={styles.clearFiltersButton}
                                onPress={handleFilterClear}
                            >
                                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.emptyText}>No functions found</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to create your first function</Text>
                        </>
                    )}
                </View>
            );
        },
        [hasActiveFilters, handleFilterClear, isOnline, data]
    );

    return (
        <View style={styles.container}>
            <PaginatedList
                key={refreshKey}
                data={data}
                fetchData={fetchData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                onDataLoaded={handleDataLoaded}
                onError={handleError}
                emptyComponent={EmptyComponent}
                pageSize={PAGE_SIZE}
            />

            <Modal
                visible={showFilterPanel}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterPanel(false)}
            >
                <FunctionFilters
                    filters={advancedFilters}
                    categoryOptions={categories}
                    onApply={handleFilterApply}
                    onClear={handleFilterClear}
                />
            </Modal>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    if (isOnline) {
                        navigation.navigate('FunctionForm');
                    } else {
                        Toast.show({
                            type: 'info',
                            text1: 'Add, Edit and Delete are disabled while offline.',
                        });
                    }
                }}
            >
                <Text style={styles.fabText}>+</Text>
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        position: 'relative',
    },
    headerButtonText: {
        fontSize: 18,
    },
    filterBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
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
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        marginBottom: 12,
    },
    date: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
    },
    location: {
        fontSize: 13,
        color: '#555',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionBtnDisabled: {
        opacity: 0.5,
    },
    edit: {
        backgroundColor: '#E3F2FD',
    },
    delete: {
        backgroundColor: '#FFEBEE',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
    },
    viewContributionsButton: {
        backgroundColor: '#1976D2',
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewContributionsButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 2,
    },
});
