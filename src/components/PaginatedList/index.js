import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

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
 * @param {Function} onRefresh - Optional callback after refresh completes
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
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const isLoadingRef = useRef(false);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      setIsOffline(offline);

      // If coming back online and there's an error, attempt retry
      if (!offline && error) {
        setError(null);
      }
    });

    return unsubscribe;
  }, [error]);

  // Load initial data on mount
  useEffect(() => {
    const loadInitial = async () => {
      // Skip if offline
      if (isOffline) {
        setError('No internet connection');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchData({ page: 1, limit: pageSize });

        onDataLoaded(result.data, result.meta);
        setCurrentPage(result.meta.page);
        setHasMore(result.meta.hasMore);
      } catch (err) {
        const errorMsg = err?.message || 'Failed to load data';
        setError(errorMsg);
        onError?.(err, 1);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [pageSize, fetchData, onDataLoaded, onError, isOffline]);

  // Handle refresh (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    // Skip if offline
    if (isOffline) {
      setError('No internet connection');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchData({ page: 1, limit: pageSize });

      onDataLoaded(result.data, result.meta);
      setCurrentPage(result.meta.page);
      setHasMore(result.meta.hasMore);

      onRefresh?.();
    } catch (err) {
      const errorMsg = err?.message || 'Failed to load data';
      setError(errorMsg);
      onError?.(err, 1);
    } finally {
      setLoading(false);
    }
  }, [pageSize, fetchData, onDataLoaded, onError, onRefresh, isOffline]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    // Do not load more if: offline, error, loadingMore, loading, no more data, or already loading
    if (isOffline || error || !hasMore || loadingMore || loading || isLoadingRef.current) {
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
        .catch(err => {
          const errorMsg = err?.message || 'Failed to load more';
          setError(errorMsg);
          onError?.(err, nextPage);
        })
        .finally(() => {
          setLoadingMore(false);
          isLoadingRef.current = false;
        });
    }
  }, [hasMore, loadingMore, loading, currentPage, pageSize, fetchData, onDataLoaded, onError, isOffline, error]);

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

  // Error component with retry button
  const renderError = useCallback(() => {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }, [error, handleRefresh]);

  // Offline component
  const renderOffline = useCallback(() => {
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineIcon}>📡</Text>
        <Text style={styles.offlineText}>No Internet Connection</Text>
        <Text style={styles.offlineSubtext}>Please check your connection and try again</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleRefresh]);

  // Refresh control
  const refreshControl = (
    <RefreshControl
      refreshing={loading && data.length > 0}
      onRefresh={handleRefresh}
      colors={['#1976D2']}
      tintColor="#1976D2"
    />
  );

  // Show full-screen loader during initial load
  if (loading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show offline state if no data yet
  if (isOffline && data.length === 0) {
    return renderOffline();
  }

  // Show error state if no data yet
  if (error && data.length === 0) {
    return renderError();
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    paddingHorizontal: 20,
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 4,
  },
  offlineSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
