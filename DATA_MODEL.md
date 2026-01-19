# Function/Event Data Model Specification

## 📋 Entity: Function (Event)

### Single Function Object Shape

```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",           // UUID v4 string
  title: "Wedding Reception",                           // string, required
  categoryId: "1",                                       // string, FK to FunctionCategory
  date: "2026-02-15",                                    // ISO date string (YYYY-MM-DD)
  time: "18:30",                                         // 24h format (HH:mm)
  location: "Grand Hall, Chennai",                       // string, optional
  notes: "Dinner at 8 PM. Traditional dress code.",      // string, supports voice-to-text
  status: "upcoming",                                    // enum: "upcoming" | "completed" | "cancelled"
  createdAt: "2026-01-19T10:30:00.000Z",                // ISO 8601 timestamp
  updatedAt: "2026-01-19T10:30:00.000Z"                 // ISO 8601 timestamp
}
```

---

## 📦 Paginated Response Structure

### API Contract (Future Backend)

```javascript
{
  page: 1,              // Current page number (1-indexed)
  limit: 10,            // Items per page
  total: 45,            // Total number of items in database
  hasMore: true,        // Whether there are more pages (page * limit < total)
  data: [               // Array of Function objects
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Wedding Reception",
      categoryId: "1",
      date: "2026-02-15",
      time: "18:30",
      location: "Grand Hall, Chennai",
      notes: "Dinner at 8 PM",
      status: "upcoming",
      createdAt: "2026-01-19T10:30:00.000Z",
      updatedAt: "2026-01-19T10:30:00.000Z"
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      title: "Birthday Party",
      categoryId: "2",
      date: "2026-03-10",
      time: "17:00",
      location: null,
      notes: "",
      status: "upcoming",
      createdAt: "2026-01-19T11:15:00.000Z",
      updatedAt: "2026-01-19T11:15:00.000Z"
    }
    // ... 8 more items (total 10 per page)
  ]
}
```

### Empty State

```javascript
{
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  data: []
}
```

### Last Page Example

```javascript
{
  page: 5,        // Last page
  limit: 10,
  total: 45,      // 45 / 10 = 4.5 pages, so page 5 has 5 items
  hasMore: false, // No more pages
  data: [
    // ... 5 items
  ]
}
```

---

## 🗄️ AsyncStorage Key Structure

### Primary Keys

```javascript
// All functions (array)
FUNCTIONS_KEY = "@FunctionTracker:functions"

// Pagination metadata (per filter/sort combination)
FUNCTIONS_META_KEY = "@FunctionTracker:functions:meta"

// Last sync timestamp (for future API sync)
FUNCTIONS_LAST_SYNC = "@FunctionTracker:functions:lastSync"
```

### Filter/Sort Specific Keys (Optional - for caching)

```javascript
// Status-specific cache
FUNCTIONS_UPCOMING_KEY = "@FunctionTracker:functions:upcoming"
FUNCTIONS_COMPLETED_KEY = "@FunctionTracker:functions:completed"

// Category-specific cache
FUNCTIONS_BY_CATEGORY_PREFIX = "@FunctionTracker:functions:category:"
// Example: "@FunctionTracker:functions:category:1"
```

### Storage Format

```javascript
// Full storage object
{
  page: 1,
  limit: 10,
  total: 45,
  hasMore: true,
  data: [ /* Function objects */ ],
  lastFetched: "2026-01-19T10:30:00.000Z"  // Client-side cache timestamp
}
```

---

## 🔄 Client-Side Pagination Logic

### Initial Load

```javascript
// Load first page
const response = await getFunctions({ page: 1, limit: 10 });

// Store in AsyncStorage
await AsyncStorage.setItem(
  FUNCTIONS_KEY,
  JSON.stringify(response)
);
```

### Load More (Infinite Scroll)

```javascript
// Check if more pages exist
if (currentResponse.hasMore) {
  const nextPage = currentResponse.page + 1;
  
  const nextResponse = await getFunctions({ 
    page: nextPage, 
    limit: 10 
  });
  
  // Merge with existing data
  const merged = {
    ...nextResponse,
    data: [...currentResponse.data, ...nextResponse.data]
  };
  
  await AsyncStorage.setItem(FUNCTIONS_KEY, JSON.stringify(merged));
}
```

### Refresh (Pull-to-Refresh)

```javascript
// Reset to page 1
const response = await getFunctions({ page: 1, limit: 10 });

// Replace entire cache
await AsyncStorage.setItem(FUNCTIONS_KEY, JSON.stringify(response));
```

---

## 🔗 Relationship to FunctionCategory

### Category Reference

```javascript
// Function object references category by ID
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  categoryId: "1",  // ← Foreign key to FunctionCategory.id
  // ...
}

// FunctionCategory object (existing)
{
  id: "1",
  name: "Marriage",
  tamilName: "திருமணம்",
  description: "Marriage related functions"
}
```

### Join Pattern (Client-Side)

```javascript
// When displaying a Function, join with category
const function = { id: "...", categoryId: "1", ... };
const categories = await getCategories(); // From existing storage

const category = categories.find(c => c.id === function.categoryId);

// Display: "Wedding Reception - Marriage (திருமணம்)"
```

---

## 🌐 Future Backend API Mapping

### Endpoints (Planned)

```javascript
// List with pagination
GET /api/functions?page=1&limit=10&status=upcoming&categoryId=1&sort=date:asc

Response: {
  page: 1,
  limit: 10,
  total: 45,
  hasMore: true,
  data: [ /* Function[] */ ]
}

// Get single function
GET /api/functions/:id

Response: {
  id: "...",
  title: "...",
  // ... single Function object
}

// Create
POST /api/functions
Body: { title, categoryId, date, time, location, notes, status }

Response: {
  id: "550e8400-...",  // Server-generated UUID
  createdAt: "2026-01-19T10:30:00.000Z",
  updatedAt: "2026-01-19T10:30:00.000Z",
  ...rest
}

// Update
PUT /api/functions/:id
Body: { title, categoryId, date, time, location, notes, status }

Response: {
  id: "550e8400-...",
  updatedAt: "2026-01-19T11:00:00.000Z",  // New timestamp
  ...rest
}

// Delete
DELETE /api/functions/:id

Response: { success: true }
```

### Query Parameters

```javascript
// Filtering
?status=upcoming
?categoryId=1
?date_gte=2026-02-01&date_lte=2026-02-28  // Date range

// Sorting
?sort=date:asc
?sort=createdAt:desc
?sort=title:asc

// Pagination
?page=1
?limit=10

// Search
?search=wedding  // Full-text search in title + notes
```

---

## 🛠️ Local Mock Implementation (Current)

### Generate UUID

```javascript
// utils/uuid.js (to be created)
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

### Mock Pagination

```javascript
// utils/functionStorage.js (to be created)

export async function getFunctions({ page = 1, limit = 10, status = null }) {
  // 1. Load all from AsyncStorage
  const allFunctions = await AsyncStorage.getItem(FUNCTIONS_KEY);
  const functions = allFunctions ? JSON.parse(allFunctions) : [];
  
  // 2. Filter by status (if provided)
  const filtered = status 
    ? functions.filter(f => f.status === status)
    : functions;
  
  // 3. Sort by date (default: upcoming first)
  const sorted = filtered.sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // 4. Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = sorted.slice(startIndex, endIndex);
  
  // 5. Calculate metadata
  const total = sorted.length;
  const hasMore = endIndex < total;
  
  return {
    page,
    limit,
    total,
    hasMore,
    data: paginated
  };
}
```

---

## 📊 Field Validation Rules

### Client-Side Validation

```javascript
{
  title: {
    required: "Function title is required",
    minLength: { value: 3, message: "Title must be at least 3 characters" },
    maxLength: { value: 100, message: "Title must not exceed 100 characters" }
  },
  categoryId: {
    required: "Please select a category"
  },
  date: {
    required: "Date is required",
    validate: value => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today || "Date cannot be in the past";
    }
  },
  time: {
    required: "Time is required",
    pattern: {
      value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      message: "Invalid time format (use HH:mm)"
    }
  },
  location: {
    // Optional, no validation
  },
  notes: {
    maxLength: { value: 500, message: "Notes must not exceed 500 characters" }
  },
  status: {
    required: "Status is required",
    validate: value => 
      ["upcoming", "completed", "cancelled"].includes(value) || 
      "Invalid status"
  }
}
```

---

## 🔍 Example Data Scenarios

### Scenario 1: New User (Empty State)

```javascript
{
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  data: []
}
```

### Scenario 2: Single Page (Under Limit)

```javascript
{
  page: 1,
  limit: 10,
  total: 5,      // Only 5 functions
  hasMore: false, // No next page
  data: [ /* 5 Function objects */ ]
}
```

### Scenario 3: Multiple Pages

```javascript
// Page 1
{
  page: 1,
  limit: 10,
  total: 25,
  hasMore: true,  // 25 > 10, more pages exist
  data: [ /* 10 Function objects */ ]
}

// Page 2
{
  page: 2,
  limit: 10,
  total: 25,
  hasMore: true,  // Still more (25 > 20)
  data: [ /* 10 Function objects */ ]
}

// Page 3 (Last)
{
  page: 3,
  limit: 10,
  total: 25,
  hasMore: false, // 25 <= 30, no more
  data: [ /* 5 Function objects */ ]
}
```

### Scenario 4: Filtered by Status

```javascript
// Only upcoming events
{
  page: 1,
  limit: 10,
  total: 12,      // 12 upcoming out of 25 total
  hasMore: true,
  data: [ /* 10 upcoming Function objects */ ]
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Data Layer
- [ ] Create `utils/uuid.js` for UUID generation
- [ ] Create `utils/functionStorage.js` with CRUD + pagination functions
- [ ] Add AsyncStorage key constants

### Phase 2: Hook Layer
- [ ] Create `hooks/useFunctions.js` for data fetching with pagination
- [ ] Support filters (status, categoryId)
- [ ] Support infinite scroll state management

### Phase 3: Form Layer
- [ ] Extend `Input.js` for date picker
- [ ] Extend `Input.js` for time picker
- [ ] Create category dropdown component (reuse Input pattern)

### Phase 4: Screen Layer
- [ ] Create `screens/Functions/index.js` with FlatList + pagination
- [ ] Create `screens/Functions/Form.js` with validation
- [ ] Add filtering UI (status tabs, category filter)

### Phase 5: Backend Preparation
- [ ] Document API endpoint contracts
- [ ] Create API service layer (`services/functionService.js`)
- [ ] Feature flag to switch between AsyncStorage and API

---

## 📝 Notes

1. **UUID Generation**: Currently client-side. Backend will override on save.
2. **Timestamps**: Client uses `new Date().toISOString()`. Backend will be authoritative.
3. **Pagination**: Designed to match REST API standards (page/limit/total/hasMore).
4. **Sorting**: Default by date ascending. Backend will support multiple sort fields.
5. **Caching**: AsyncStorage acts as local cache. Future: sync with backend on app open.
6. **Offline Support**: Local writes saved immediately. Sync queue for backend when online.

---

## 🔐 Data Integrity

### Ensuring Valid References

```javascript
// Before saving a Function, validate categoryId exists
const categories = await getCategories();
const categoryExists = categories.some(c => c.id === function.categoryId);

if (!categoryExists) {
  throw new Error("Invalid category selected");
}
```

### Handling Deleted Categories

```javascript
// Option 1: Prevent deletion if Functions exist
const functions = await getFunctions({ page: 1, limit: 1000 });
const hasReferences = functions.data.some(f => f.categoryId === categoryId);

if (hasReferences) {
  Alert.alert("Cannot delete category with existing functions");
  return;
}

// Option 2: Cascade to "Uncategorized" (safer)
const updated = functions.data.map(f => 
  f.categoryId === categoryId 
    ? { ...f, categoryId: "uncategorized" }
    : f
);
```

---

**This model is designed to be:**
- ✅ Frontend-ready for immediate implementation
- ✅ Backend-compatible for future API integration
- ✅ Pagination-first for scalability
- ✅ Validation-ready with clear rules
- ✅ Relationship-aware (FK to FunctionCategory)
