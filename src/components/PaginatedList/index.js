import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';

/**
 * Reusable paginated list component with infinite scroll
 * Manages pagination lifecycle and loading states internally
 * 
 * @param {Array} data - Array of items to display
 * @param {Function} renderItem - FlatList renderItem function
 * @param {Function} keyExtractor - FlatList keyExtractor function
 * @param {Function} fetchData - API call only: ({ page, limit }) => Promise<{ data, meta }>
 * @param {Function} onDataLoaded - Called with new items: (newItems, meta) => void
 * @param {Function} onError - Called on error: (error, page) => void
 * @param {number} pageSize - Items per page (default: 10)
 * @param {Function} onRefresh - Optional pull-to-refresh callback
 * @param {React.Component} emptyComponent - Component to show when data is empty
 * @param {Object} contentContainerStyle - Additional container styles
 * @param {Object} style - FlatList style
 */
export default function PaginatedList({
  data = [],
  renderItem,
  keyExtractor,
  fetchData,
  onDataLoaded,
  onError,
  pageSize = 10,
  onRefresh,
  emptyComponent: EmptyComponent,
  contentContainerStyle,
  style,
  ...restProps
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const isLoadingRef = useRef(false);

  // Load initial data on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const result = await fetchData({ page: 1, limit: pageSize });

        onDataLoaded(result.data, result.meta);
        setCurrentPage(result.meta.page);
        setHasMore(result.meta.hasMore);
      } catch (error) {
        onError?.(error, 1);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [pageSize, fetchData, onDataLoaded, onError]);

  // Handle refresh (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchData({ page: 1, limit: pageSize });

      onDataLoaded(result.data, result.meta);
      setCurrentPage(result.meta.page);
      setHasMore(result.meta.hasMore);

      onRefresh?.();
    } catch (error) {
      onError?.(error, 1);
    } finally {
      setLoading(false);
    }
  }, [pageSize, fetchData, onDataLoaded, onError, onRefresh]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading || isLoadingRef.current) {
      return;
    }

    if (fetchData && typeof fetchData === 'function') {
      isLoadingRef.current = true;
      const nextPage = currentPage + 1;

      setLoadingMore(true);

      Promise.resolve(fetchData({ page: nextPage, limit: pageSize }))
        .then(result => {
          onDataLoaded(result.data, result.meta);
          setCurrentPage(result.meta.page);
          setHasMore(result.meta.hasMore);
        })
        .catch(error => {
          onError?.(error, nextPage);
        })
        .finally(() => {
          setLoadingMore(false);
          isLoadingRef.current = false;
        });
    }
  }, [hasMore, loadingMore, loading, currentPage, pageSize, fetchData, onDataLoaded, onError]);

  // Footer component: shows loading indicator or end message
  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#1976D2" />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.endText}>No more items</Text>
        </View>
      );
    }

    return null;
  }, [loadingMore, hasMore, data.length]);

  // Empty component: shows when no data
  const renderEmpty = useCallback(() => {
    // Don't show empty state during initial load
    if (loading) {
      return null;
    }

    // Custom empty component if provided
    if (EmptyComponent) {
      return <EmptyComponent />;
    }

    // Default empty state
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No items found</Text>
      </View>
    );
  }, [loading, EmptyComponent]);

  // Refresh control (optional)
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={loading && data.length > 0} // Only show spinner if data exists
      onRefresh={onRefresh}
      colors={['#1976D2']} // Android
      tintColor="#1976D2" // iOS
    />
  ) : undefined;

  // Show full-screen loader during initial load
  if (loading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
      ]}
      style={style}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      {...restProps}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  endText: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
