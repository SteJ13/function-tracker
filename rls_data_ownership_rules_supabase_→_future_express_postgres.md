# Data Ownership, RLS & Offline Rules

This document captures **final, verified rules** for data ownership, security, and offline behavior.
It must be followed when:
- Extending Supabase schema
- Building backend (Express + PostgreSQL)
- Implementing sync engine
- Writing migrations or API validations

---

## 1. Core Data Ownership Model

### 1.1 User-scoped tables

**Definition**: Data belongs to exactly one authenticated user.

Tables:
- `functions`
- (future) `events`
- (future) `tasks`

**Mandatory columns**:
```sql
user_id uuid NOT NULL
```

**Rules**:
- A user can only see their own records
- A user can only create records with their own `user_id`
- A user can only update/delete their own records
- `user_id` must NEVER be editable after insert

---

### 1.2 Global/shared tables

**Definition**: Data shared across all users.

Tables:
- `locations`
- `categories`
- (future) lookup / master tables

**Rules**:
- No `user_id` column
- All authenticated users can read
- Authenticated users may insert (if allowed)
- Update/Delete only if explicitly required (currently disabled)

---

## 2. Row Level Security (RLS) — Final Rules

### 2.1 Locations (GLOBAL)

#### Enable RLS
```sql
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
```

#### SELECT — all authenticated users
```sql
CREATE POLICY "locations_select_all_authenticated"
ON public.locations
FOR SELECT
TO authenticated
USING (true);
```

#### INSERT — all authenticated users
```sql
CREATE POLICY "locations_insert_authenticated"
ON public.locations
FOR INSERT
TO authenticated
WITH CHECK (true);
```

❌ No UPDATE / DELETE policies

---

### 2.2 Functions (USER-SCOPED)

#### Enable RLS
```sql
ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
```

#### SELECT — only own data
```sql
CREATE POLICY "functions_select_own"
ON public.functions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### INSERT — only own data
```sql
CREATE POLICY "functions_insert_own"
ON public.functions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

#### UPDATE — only own data
```sql
CREATE POLICY "functions_update_own"
ON public.functions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### DELETE — only own data
```sql
CREATE POLICY "functions_delete_own"
ON public.functions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

## 3. Frontend Rules (Offline-first)

### 3.1 Auth responsibility

- Auth state is owned by **AuthContext**
- API layer must NEVER fetch auth state
- `user_id` is injected **before** API or queue execution

---

### 3.2 Offline Executor Rules

- Offline decision logic is centralized
- Screens never check `isOnline`
- Screens never pass `user_id`
- Executor decides:
  - Online → API call
  - Offline → optimistic update + queue

---

### 3.3 Offline Queue Rules

Queue item shape:
```js
{
  id: uuid,
  action: 'create' | 'update' | 'delete',
  table: string,
  payload: object,
  timestamp: number
}
```

Rules:
- Queue is append-only
- No deduplication in v2
- No retries in v2
- Sync engine processes sequentially

---

## 4. Cache Rules (CRITICAL)

### 4.1 Cache overwrite rule

> Cache must ALWAYS reflect latest server truth.

✔ Overwrite cache on **every successful API response**
✔ Including empty arrays
❌ Never conditionally save cache based on data length

---

### 4.2 Offline fallback

- Offline reads load from cache
- Cache must never merge with server data
- Cache is a snapshot, not a delta

---

## 5. Future Express + PostgreSQL Mapping

### 5.1 Middleware responsibility

In Express:
- Auth middleware extracts `user_id`
- Inject `req.user.id`
- Controllers never trust client `user_id`

---

### 5.2 SQL enforcement

Even with Express:
- PostgreSQL RLS or WHERE clauses must enforce ownership
- Never rely only on backend logic

Example:
```sql
SELECT * FROM functions WHERE user_id = $1;
```

---

## 6. Invariants (DO NOT BREAK)

- ❌ No shared data without explicit intent
- ❌ No user-scoped table without `user_id`
- ❌ No API auth lookup inside data layer
- ❌ No cache save conditional on length

Breaking any of these causes:
- Data leaks
- Offline resurrection bugs
- Sync conflicts

---

## 7. Status

- ✅ Verified with 2-user test
- ✅ Offline + online safe
- ✅ Ready for sync engine
- ✅ Ready for backend migration

---

**This document is a contract.**
Follow it when extending the sys