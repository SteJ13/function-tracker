import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
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
import { useNetwork } from '@context/NetworkContext';
import FunctionCard from '@components/FunctionCard';
import { getFunctionStatus, sortFunctionsByStatus } from '@utils/statusHelper';
import { FUNCTION_TYPES } from '@globalConstant';

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
                const myFunctions = cachedData.filter(f => f.function_type === FUNCTION_TYPES.MY_FUNCTION);
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

    // // Set header options with filter button
    // useEffect(() => {
    //     const filterCount = getActiveFilterCount();
    //     navigation.setOptions({
    //         title: 'My Functions',
    //         headerRight: () => (
    //             <TouchableOpacity
    //                 style={styles.headerButton}
    //                 onPress={() => setShowFilterPanel(true)}
    //             >
    //                 <Text style={styles.headerButtonText}>⚙️</Text>
    //                 {filterCount > 0 && (
    //                     <View style={styles.filterBadge}>
    //                         <Text style={styles.filterBadgeText}>{filterCount}</Text>
    //                     </View>
    //                 )}
    //             </TouchableOpacity>
    //         ),
    //     });
    // }, [navigation, getActiveFilterCount]);

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
                function_type: FUNCTION_TYPES.MY_FUNCTION, // Only MY_FUNCTION type
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

    // Navigate to detail
    const handlePress = useCallback(
        item => {
            navigation.navigate('FunctionDetail', { functionId: item.id });
        },
        [navigation]
    );

    // Render item with computed status
    const renderItem = useCallback(
        ({ item }) => {
            const displayDate = formatDisplayDate(item.function_date);
            const displayTime = formatDisplayTime(
                item.function_date,
                item.function_time
            );

            const status = getFunctionStatus(
                item.function_date,
                item.function_time
            );

            return (
                <FunctionCard
                    item={item}
                    status={status}
                    displayDate={displayDate}
                    displayTime={displayTime}
                    onPress={handlePress}
                    showContributionsButton={true}
                    onViewContributions={(selectedItem) =>
                        navigation.navigate('ContributionsList', {
                            functionId: selectedItem.id,
                        })
                    }
                />
            );
        },
        [handlePress, navigation]
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
