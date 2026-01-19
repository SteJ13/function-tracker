# Pagination Strategy for React Native List Screens

## 🎯 Design Goals

- ✅ Reusable across all list screens (Functions, Events, Categories)
- ✅ FlatList-compatible with minimal boilerplate
- ✅ Backend-ready (easy swap from AsyncStorage to API)
- ✅ Supports infinite scroll, pull-to-refresh, empty states
- ✅ Clear separation: Data Layer → Hook Layer → UI Layer

---

## 📊 Pagination State Shape

### Core State Object

```javascript
{
  // Data
  data: [],                    // Array of items (accumulated for infinite scroll)
  
  // Pagination metadata
  page: 1,                     // Current page number (1-indexed)
  limit: 10,                   // Items per page
  total: 0,                    // Total items in database/storage
  hasMore: false,              // Whether more pages exist
  
  // Loading states
  isLoading: false,            // Initial load
  isLoadingMore: false,        // Loading next page
  isRefreshing: false,         // Pull-to-refresh
  
  // Error handling
  error: null,                 // Error message or null
  
  // Cache metadata (optional)
  lastFetched: null,           // ISO timestamp of last successful fetch
  filters: {}                  // Current active filters
}
```

### State Transitions

```javascript
// Initial state
{
  data: [],
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  isLoading: true,      // ← Initial load
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,
  filters: {}
}

// After initial load success
{
  data: [/* 10 items */],
  page: 1,
  limit: 10,
  total: 45,
  hasMore: true,         // ← 45 > 10
  isLoading: false,      // ← Done
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  lastFetched: "2026-01-19T10:30:00.000Z",
  filters: {}
}

// During load more (infinite scroll)
{
  data: [/* 10 items */],
  page: 1,               // ← Still page 1 in state
  limit: 10,
  total: 45,
  hasMore: true,
  isLoading: false,
  isLoadingMore: true,   // ← Loading next page
  isRefreshing: false,
  error: null,
  lastFetched: "2026-01-19T10:30:00.000Z",
  filters: {}
}

// After load more success
{
  data: [/* 20 items (merged) */],
  page: 2,               // ← Updated
  limit: 10,
  total: 45,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,  // ← Done
  isRefreshing: false,
  error: null,
  lastFetched: "2026-01-19T10:32:00.000Z",
  filters: {}
}

// During refresh
{
  data: [/* 20 items (still showing old data) */],
  page: 2,
  limit: 10,
  total: 45,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: true,    // ← Refreshing
  error: null,
  lastFetched: "2026-01-19T10:32:00.000Z",
  filters: {}
}

// After refresh success
{
  data: [/* 10 items (reset to page 1) */],
  page: 1,               // ← Reset
  limit: 10,
  total: 47,             // ← May have changed
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,   // ← Done
  error: null,
  lastFetched: "2026-01-19T10:35:00.000Z",
  filters: {}
}

// Error state
{
  data: [/* previous data preserved */],
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: "Failed to load data", // ← Error message
  lastFetched: "2026-01-19T10:32:00.000Z",
  filters: {}
}
```

---

## 🏗️ Architecture: 3-Layer Separation

### Layer 1: Data Source (Storage/API)

**Location**: `src/utils/functionStorage.js` or `src/services/functionService.js`

**Responsibility**: Pure data fetching with pagination contract

```javascript
/**
 * Data source interface (works with AsyncStorage or API)
 * 
 * @param {Object} params
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @param {Object} params.filters - Filter criteria
 * @returns {Promise<PaginatedResponse>}
 */
async function fetchFunctions({ page = 1, limit = 10, filters = {} }) {
  // Returns standardized pagination response
  return {
    page: 1,
    limit: 10,
    total: 45,
    hasMore: true,
    data: [/* Function objects */]
  };
}

/**
 * Response contract (matches DATA_MODEL.md)
 */
type PaginatedResponse = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  data: Array<T>;
}
```

**Key Design**: Same interface whether data comes from AsyncStorage or API

---

### Layer 2: Pagination Hook (Business Logic)

**Location**: `src/hooks/usePagination.js`

**Responsibility**: Manage pagination state, loading states, data merging

```javascript
/**
 * Generic pagination hook for FlatList
 * 
 * @param {Function} fetchFunction - Data fetching function
 * @param {Object} options - Configuration
 * @returns {Object} Pagination state and actions
 */
function usePagination(fetchFunction, options = {}) {
  const {
    initialLimit = 10,
    filters = {},
    autoLoad = true
  } = options;

  const [state, setState] = useState({
    data: [],
    page: 1,
    limit: initialLimit,
    total: 0,
    hasMore: false,
    isLoading: autoLoad,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    lastFetched: null,
    filters
  });

  // Load initial data
  const loadInitial = async () => { /* ... */ };

  // Load next page
  const loadMore = async () => { /* ... */ };

  // Refresh from page 1
  const refresh = async () => { /* ... */ };

  // Update filters and reload
  const setFilters = async (newFilters) => { /* ... */ };

  return {
    // State
    ...state,
    
    // Actions
    loadMore,
    refresh,
    setFilters,
    
    // FlatList helpers
    onEndReached: loadMore,
    onRefresh: refresh,
    ListFooterComponent: /* render loading indicator */,
    ListEmptyComponent: /* render empty state */
  };
}
```

**Usage in Screen**:
```javascript
const { 
  data, 
  isLoading, 
  isLoadingMore,
  hasMore,
  onEndReached, 
  onRefresh,
  ListFooterComponent
} = usePagination(fetchFunctions, { initialLimit: 10 });

<FlatList
  data={data}
  onEndReached={onEndReached}
  onEndReachedThreshold={0.5}
  refreshing={isRefreshing}
  onRefresh={onRefresh}
  ListFooterComponent={ListFooterComponent}
/>
```

---

### Layer 3: UI Components (Presentation)

**Location**: `src/screens/Functions/index.js`

**Responsibility**: Render list, handle user interaction

```javascript
export default function FunctionsScreen({ navigation }) {
  // Hook handles all pagination logic
  const pagination = usePagination(fetchFunctions, {
    initialLimit: 10,
    filters: { status: 'upcoming' }
  });

  const renderItem = ({ item }) => (
    <FunctionCard function={item} onPress={() => {/* ... */}} />
  );

  if (pagination.isLoading) {
    return <AppLoader />;
  }

  return (
    <FlatList
      data={pagination.data}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      onEndReached={pagination.onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={pagination.isRefreshing}
          onRefresh={pagination.onRefresh}
        />
      }
      ListFooterComponent={pagination.ListFooterComponent}
      ListEmptyComponent={pagination.ListEmptyComponent}
    />
  );
}
```

---

## 🔄 Data Flow: AsyncStorage Implementation

### Step-by-Step Flow (Current)

```javascript
// 1. Screen renders
<FunctionsScreen />

// 2. Hook initializes
usePagination(fetchFunctions, { initialLimit: 10 })
  → setState({ isLoading: true })
  → calls fetchFunctions({ page: 1, limit: 10 })

// 3. Data source (AsyncStorage)
fetchFunctions({ page: 1, limit: 10 })
  → AsyncStorage.getItem('@FunctionTracker:functions')
  → Parse JSON array
  → Slice data for pagination: array.slice(0, 10)
  → Calculate metadata: total = array.length, hasMore = 10 < total
  → Return { page: 1, limit: 10, total: 45, hasMore: true, data: [...] }

// 4. Hook updates state
setState({ 
  data: response.data,
  page: 1,
  total: 45,
  hasMore: true,
  isLoading: false,
  lastFetched: new Date().toISOString()
})

// 5. FlatList renders
<FlatList data={[/* 10 items */]} />

// 6. User scrolls to bottom
onEndReached() triggered
  → Check if hasMore && !isLoadingMore
  → setState({ isLoadingMore: true })
  → calls fetchFunctions({ page: 2, limit: 10 })

// 7. Data source returns page 2
  → array.slice(10, 20)
  → Return { page: 2, limit: 10, total: 45, hasMore: true, data: [...] }

// 8. Hook merges data
setState({
  data: [...state.data, ...response.data], // Merge!
  page: 2,
  isLoadingMore: false
})

// 9. FlatList re-renders with 20 items
<FlatList data={[/* 20 items */]} />
```

---

## 🌐 Data Flow: API Implementation (Future)

### Step-by-Step Flow (Backend)

```javascript
// 1-2. Same as AsyncStorage

// 3. Data source (API)
fetchFunctions({ page: 1, limit: 10 })
  → const response = await fetch('/api/functions?page=1&limit=10')
  → const json = await response.json()
  → Return json // Already in correct format!

// 4-9. Identical to AsyncStorage flow
```

**Key Insight**: Hook doesn't care about data source. Just needs pagination contract.

---

## 📝 Detailed Hook Implementation Plan

### State Management

```javascript
function usePagination(fetchFunction, options = {}) {
  const { initialLimit = 10, filters = {}, autoLoad = true } = options;

  // Core state
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Loading flags
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);
  
  // Metadata
  const [lastFetched, setLastFetched] = useState(null);
  const [activeFilters, setActiveFilters] = useState(filters);

  // ... action functions
}
```

### Action: Load Initial Data

```javascript
const loadInitial = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await fetchFunction({
      page: 1,
      limit: initialLimit,
      filters: activeFilters
    });

    setData(response.data);
    setPage(response.page);
    setTotal(response.total);
    setHasMore(response.hasMore);
    setLastFetched(new Date().toISOString());
  } catch (err) {
    setError(err.message || 'Failed to load data');
  } finally {
    setIsLoading(false);
  }
}, [fetchFunction, initialLimit, activeFilters]);
```

### Action: Load More (Infinite Scroll)

```javascript
const loadMore = useCallback(async () => {
  // Guard: prevent duplicate calls
  if (!hasMore || isLoadingMore || isLoading || isRefreshing) {
    return;
  }

  try {
    setIsLoadingMore(true);
    setError(null);

    const nextPage = page + 1;

    const response = await fetchFunction({
      page: nextPage,
      limit: initialLimit,
      filters: activeFilters
    });

    // Merge with existing data
    setData(prevData => [...prevData, ...response.data]);
    setPage(response.page);
    setTotal(response.total);
    setHasMore(response.hasMore);
    setLastFetched(new Date().toISOString());
  } catch (err) {
    setError(err.message || 'Failed to load more');
  } finally {
    setIsLoadingMore(false);
  }
}, [hasMore, isLoadingMore, isLoading, isRefreshing, page, fetchFunction, initialLimit, activeFilters]);
```

### Action: Refresh (Pull-to-Refresh)

```javascript
const refresh = useCallback(async () => {
  try {
    setIsRefreshing(true);
    setError(null);

    const response = await fetchFunction({
      page: 1,
      limit: initialLimit,
      filters: activeFilters
    });

    // Replace data (reset to page 1)
    setData(response.data);
    setPage(response.page);
    setTotal(response.total);
    setHasMore(response.hasMore);
    setLastFetched(new Date().toISOString());
  } catch (err) {
    setError(err.message || 'Failed to refresh');
  } finally {
    setIsRefreshing(false);
  }
}, [fetchFunction, initialLimit, activeFilters]);
```

### Action: Update Filters

```javascript
const setFilters = useCallback(async (newFilters) => {
  setActiveFilters(newFilters);
  
  // Reset to page 1 with new filters
  try {
    setIsLoading(true);
    setError(null);
    setData([]); // Clear old data

    const response = await fetchFunction({
      page: 1,
      limit: initialLimit,
      filters: newFilters
    });

    setData(response.data);
    setPage(response.page);
    setTotal(response.total);
    setHasMore(response.hasMore);
    setLastFetched(new Date().toISOString());
  } catch (err) {
    setError(err.message || 'Failed to apply filters');
  } finally {
    setIsLoading(false);
  }
}, [fetchFunction, initialLimit]);
```

### Auto-load on Mount

```javascript
useEffect(() => {
  if (autoLoad) {
    loadInitial();
  }
}, []); // Run once on mount
```

---

## 🎨 FlatList Integration Helpers

### Footer Component (Loading Indicator)

```javascript
const ListFooterComponent = useMemo(() => {
  if (isLoadingMore) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#1976D2" />
      </View>
    );
  }
  
  if (!hasMore && data.length > 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>No more items</Text>
      </View>
    );
  }
  
  return null;
}, [isLoadingMore, hasMore, data.length]);
```

### Empty State Component

```javascript
const ListEmptyComponent = useMemo(() => {
  if (isLoading) {
    return null; // Show full-screen loader instead
  }

  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <Text style={{ fontSize: 48 }}>📭</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>
        No items found
      </Text>
    </View>
  );
}, [isLoading]);
```

### Error State

```javascript
const ErrorComponent = useMemo(() => {
  if (!error) return null;

  return (
    <View style={{ padding: 20, backgroundColor: '#ffebee' }}>
      <Text style={{ color: '#c62828' }}>{error}</Text>
      <TouchableOpacity onPress={refresh}>
        <Text style={{ color: '#1976D2', marginTop: 8 }}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  );
}, [error, refresh]);
```

---

## 🔧 FlatList Configuration

### Optimal Settings for Pagination

```javascript
<FlatList
  // Data
  data={pagination.data}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  
  // Infinite scroll
  onEndReached={pagination.onEndReached}
  onEndReachedThreshold={0.5}  // Trigger when 50% from bottom
  
  // Pull-to-refresh
  refreshControl={
    <RefreshControl
      refreshing={pagination.isRefreshing}
      onRefresh={pagination.onRefresh}
      colors={['#1976D2']}  // Android
      tintColor="#1976D2"   // iOS
    />
  }
  
  // States
  ListFooterComponent={pagination.ListFooterComponent}
  ListEmptyComponent={pagination.ListEmptyComponent}
  ListHeaderComponent={pagination.ErrorComponent}
  
  // Performance
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  
  // Spacing
  contentContainerStyle={{ paddingBottom: 20 }}
/>
```

---

## 📊 Performance Considerations

### Memory Management

```javascript
// Problem: Infinite scroll accumulates data
// After 10 pages: 100 items in memory

// Solution 1: Limit total items (windowing)
const MAX_ITEMS = 50;

const loadMore = async () => {
  const response = await fetchFunction({ page: nextPage });
  
  setData(prevData => {
    const merged = [...prevData, ...response.data];
    
    // Keep only last 50 items
    if (merged.length > MAX_ITEMS) {
      return merged.slice(-MAX_ITEMS);
    }
    
    return merged;
  });
};

// Solution 2: Use react-native-fast-list or @shopify/flash-list
// (Future enhancement)
```

### Debouncing End Reached

```javascript
// Problem: onEndReached fires multiple times
// Solution: Use ref to track in-flight requests

const isLoadingRef = useRef(false);

const loadMore = useCallback(async () => {
  if (isLoadingRef.current || !hasMore) {
    return;
  }

  isLoadingRef.current = true;
  setIsLoadingMore(true);

  try {
    // ... fetch logic
  } finally {
    isLoadingRef.current = false;
    setIsLoadingMore(false);
  }
}, [hasMore]);
```

---

## 🧪 Testing Strategy

### Unit Tests (Hook)

```javascript
describe('usePagination', () => {
  it('should load initial data on mount', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      page: 1,
      limit: 10,
      total: 45,
      hasMore: true,
      data: [/* 10 items */]
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      usePagination(mockFetch)
    );

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);
  });

  it('should load more when hasMore is true', async () => {
    // ... test loadMore
  });

  it('should not load more when hasMore is false', async () => {
    // ... test guard
  });

  it('should refresh and reset to page 1', async () => {
    // ... test refresh
  });
});
```

### Integration Tests (Screen)

```javascript
describe('FunctionsScreen', () => {
  it('should render list with pagination', async () => {
    const { getByTestId, getAllByTestId } = render(<FunctionsScreen />);

    // Wait for initial load
    await waitFor(() => {
      expect(getAllByTestId('function-item')).toHaveLength(10);
    });

    // Scroll to bottom
    fireEvent.scroll(getByTestId('function-list'), {
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 600 },
        layoutMeasurement: { height: 100 }
      }
    });

    // Wait for more items
    await waitFor(() => {
      expect(getAllByTestId('function-item')).toHaveLength(20);
    });
  });
});
```

---

## 🔄 Migration Path: AsyncStorage → API

### Phase 1: AsyncStorage (Current)

```javascript
// utils/functionStorage.js
export async function fetchFunctions({ page, limit, filters }) {
  const stored = await AsyncStorage.getItem(FUNCTIONS_KEY);
  const allFunctions = stored ? JSON.parse(stored) : [];
  
  // Client-side pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = allFunctions.slice(startIndex, endIndex);
  
  return {
    page,
    limit,
    total: allFunctions.length,
    hasMore: endIndex < allFunctions.length,
    data: paginated
  };
}
```

### Phase 2: API (Future)

```javascript
// services/functionService.js
export async function fetchFunctions({ page, limit, filters }) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });

  const response = await fetch(`/api/functions?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch functions');
  }

  return response.json(); // Already in correct format!
}
```

### Phase 3: Feature Flag

```javascript
// config/features.js
export const USE_API = false; // Toggle when backend ready

// screens/Functions/index.js
import { USE_API } from '@config/features';
import { fetchFunctions as fetchFromAPI } from '@services/functionService';
import { fetchFunctions as fetchFromStorage } from '@utils/functionStorage';

const fetchFunctions = USE_API ? fetchFromAPI : fetchFromStorage;

const pagination = usePagination(fetchFunctions);
```

---

## 📋 Implementation Checklist

### Phase 1: Core Hook
- [ ] Create `hooks/usePagination.js`
- [ ] Implement state management
- [ ] Implement loadInitial, loadMore, refresh actions
- [ ] Add error handling
- [ ] Add loading states

### Phase 2: AsyncStorage Integration
- [ ] Update `utils/functionStorage.js` with pagination support
- [ ] Implement client-side pagination logic
- [ ] Add filtering support
- [ ] Add sorting support

### Phase 3: FlatList Helpers
- [ ] Create ListFooterComponent (loading indicator)
- [ ] Create ListEmptyComponent (empty state)
- [ ] Create ErrorComponent (error display)
- [ ] Add RefreshControl integration

### Phase 4: Screen Integration
- [ ] Update FunctionsScreen to use usePagination
- [ ] Add infinite scroll
- [ ] Add pull-to-refresh
- [ ] Test loading states

### Phase 5: Optimization
- [ ] Add debouncing for onEndReached
- [ ] Add memory management (item limit)
- [ ] Add caching strategy
- [ ] Performance testing

### Phase 6: API Preparation
- [ ] Create `services/functionService.js` stub
- [ ] Add feature flag system
- [ ] Document API endpoint contracts
- [ ] Plan offline sync strategy

---

## 🎯 Success Metrics

### Functional Requirements
✅ Initial load shows first page
✅ Scrolling to bottom loads next page
✅ Pull-to-refresh resets to page 1
✅ Loading indicators appear at correct times
✅ Empty state shown when no data
✅ Error state shown on failure with retry

### Performance Requirements
✅ No duplicate API calls
✅ Smooth scrolling (60fps)
✅ Memory usage stays reasonable (< 100MB)
✅ Page load time < 500ms (AsyncStorage) / < 2s (API)

### Code Quality
✅ Reusable across all list screens
✅ Easy to switch between AsyncStorage and API
✅ Well-tested (unit + integration)
✅ Clear separation of concerns

---

**This pagination strategy is designed to be:**
- ✅ **Reusable**: One hook for all paginated lists
- ✅ **Backend-ready**: Seamless transition from AsyncStorage to API
- ✅ **FlatList-optimized**: Built for React Native performance
- ✅ **Maintainable**: Clear separation of data, logic, and UI
- ✅ **Testable**: Pure functions with well-defined contracts
