import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    Pressable,
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
import FunctionCard from '@components/FunctionCard';
import { getFunctionStatus, sortFunctionsByStatus } from '@utils/statusHelper';
import { FUNCTION_TYPES } from '@globalConstant';

const PAGE_SIZE = 10;

export default function InvitationsScreen({ navigation }) {
    const [data, setData] = useState([]);
    const [refreshKey, setRefreshKey] = useState('invitations');
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
                const invitations = cachedData.filter(f => f.function_type === FUNCTION_TYPES.INVITATION);
                const sorted = sortFunctionsByStatus(invitations);
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
            title: 'Invitations',
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
            setRefreshKey(`invitations-${Date.now()}`);
        }, [])
    );

    // Fetch data with INVITATION type filter
    const fetchData = useCallback(async ({ page, limit }) => {
        const response = await getFunctions({
            page,
            limit,
            filters: {
                category_id: advancedFilters.category_id,
                location_id: advancedFilters.location_id,
                from_date: advancedFilters.from_date,
                to_date: advancedFilters.to_date,
                function_type: FUNCTION_TYPES.INVITATION, // Only INVITATION type
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
        const isChanged =
            appliedFilters.category_id !== advancedFilters.category_id ||
            appliedFilters.location_id !== advancedFilters.location_id ||
            appliedFilters.from_date !== advancedFilters.from_date ||
            appliedFilters.to_date !== advancedFilters.to_date;

        if (isChanged) {
            setAdvancedFilters(appliedFilters);
            setData([]);
            setRefreshKey(`invitations-${Date.now()}`);
        }
        setShowFilterPanel(false);
    }, [advancedFilters]);

    // Handle filter clear
    const handleFilterClear = useCallback(() => {
        const hasFilters =
            advancedFilters.category_id !== undefined ||
            advancedFilters.location_id !== undefined ||
            advancedFilters.from_date !== undefined ||
            advancedFilters.to_date !== undefined;

        if (hasFilters) {
            setAdvancedFilters({
                category_id: undefined,
                location_id: undefined,
                from_date: undefined,
                to_date: undefined,
            });
            setData([]);
            setRefreshKey(`invitations-${Date.now()}`);
        }
        setShowFilterPanel(false);
    }, [advancedFilters]);

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
            text1: page === 1 ? 'Failed to load invitations' : 'Failed to load more',
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
                'Remove Invitation',
                `Are you sure you want to remove this invitation?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const functionId = item.id;
                                await deleteFunctionAction(functionId);
                                setData(prevData => prevData.filter(f => f.id !== functionId));
                                Toast.show({
                                    type: 'success',
                                    text1: 'Invitation removed',
                                });
                            } catch (error) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Failed to remove invitation',
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
                    showEditDeleteButtons={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            );
        },
        [handlePress, handleEdit, handleDelete]
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
                        <Text style={styles.emptySubtext}>Go online to load and cache invitations</Text>
                    </View>
                );
            }

            return (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📬</Text>
                    {filtersActive ? (
                        <>
                            <Text style={styles.emptyText}>No invitations match your filters</Text>
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
                            <Text style={styles.emptyText}>No invitations found</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to add an invitation</Text>
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
                <View style={styles.modalBackdrop}>
                    <Pressable style={styles.backdropTouchable} onPress={() => setShowFilterPanel(false)} />
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Filters</Text>
                            <Pressable onPress={() => setShowFilterPanel(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </Pressable>
                        </View>
                        <FunctionFilters
                            filters={advancedFilters}
                            categoryOptions={categories}
                            onApply={handleFilterApply}
                            onClear={handleFilterClear}
                        />
                    </View>
                </View>
            </Modal>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    if (isOnline) {
                        navigation.navigate('FunctionForm', { function_type: FUNCTION_TYPES.INVITATION });
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
    optionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        backgroundColor: '#fff',
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
    clearFiltersButton: {
        backgroundColor: '#1976D2',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    clearFiltersButtonText: {
        color: '#FFF',
        fontWeight: '600',
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },

    backdropTouchable: {
        flex: 1,
    },

    bottomSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '60%',
        overflow: 'hidden',
    },

    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },

    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    closeButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: '600',
    },
});
