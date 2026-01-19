# FunctionTracker - React Native Project Analysis

## 📋 Executive Summary
A React Native Android app with Firebase Cloud Messaging, multi-language support (English/Tamil), voice-to-text input, and context-based authentication. Currently features Function Categories CRUD as a foundation for larger Feature development.

---

## 1️⃣ Folder Structure & Patterns

### Root Level
```
src/
├── App.js                 # Entry point, navigation setup
├── components/            # Reusable UI components
├── context/              # Global state (Auth, Language)
├── hooks/                # Custom React hooks (currently empty)
├── navigation/           # Navigation configuration (currently empty)
├── screens/              # Screen components
├── services/             # External service integrations (Firebase)
└── utils/               # Utility functions (i18n, storage)
```

### Key Pattern: Feature-Folder Structure
```
screens/
├── HomeScreen.js         # Dashboard with navigation grid
├── LoginScreen.js        
├── FunctionCategories/   # FEATURE FOLDER TEMPLATE
│   ├── index.js         # List screen with CRUD operations
│   └── Form.js          # Form for add/edit
└── Notifications/
    ├── NotificationsScreen.js
    └── NotificationDetailScreen.js
```

**Pattern**: Each feature has:
- `index.js` → List/view screen
- `Form.js` → Add/edit form
- State management via route params (no Redux/Zustand)

---

## 2️⃣ Reusable Components & Hooks

### Components Structure
```
components/
├── FormInputs/
│   └── Input.js          # 🎯 REUSABLE: Voice + Password + Validation
├── Icons/
│   ├── MicIcon.js        # SVG Icons
│   ├── EyeIcon.js
│   └── EyeOffIcon.js
├── AppLoader.js          # Loading screen during auth check
└── HeaderUserMenu.js     # Header user menu
```

### Key Reusable Component: `Input.js`
**Location**: [src/components/FormInputs/Input.js](src/components/FormInputs/Input.js)

**Features**:
- Wraps `react-hook-form` Controller
- Voice-to-text input (with MicIcon toggle)
- Password visibility toggle (with EyeIcon)
- Built-in error display
- Custom validation rules support
- Optional multi-line support

**Usage Pattern**:
```javascript
<Input
  name="fieldName"
  label="Label Text"
  control={control}           // from useForm()
  required={true}
  rules={{ required: 'Error msg' }}
  password={false}            // shows eye icon
  voice={true}                // shows mic icon (default)
  handleChange={callback}     // optional onChange handler
/>
```

### Hooks
**Current State**: [src/hooks/index.js](src/hooks/index.js) is empty

**Opportunity**: Could create custom hooks like:
- `useAsyncStorage(key)` - wrapper for AsyncStorage
- `useFunctionCRUD()` - generic CRUD hook for reuse

---

## 3️⃣ Navigation Structure

### Navigation Stack
**Location**: [src/App.js](src/App.js#L33-L80)

```javascript
Stack.Navigator
├── [Authenticated Routes]
│   ├── Home (default)
│   ├── Notifications + NotificationDetail
│   ├── FunctionCategories (list)
│   └── FunctionCategoryForm (add/edit)
└── [Unauthenticated]
    └── Login
```

### Navigation Patterns
1. **List → Form**: `navigation.navigate('FunctionCategoryForm', { category: item })`
2. **Form → List**: `navigation.navigate('FunctionCategories', { category: data, isEdit: bool })`
3. **Passing data via route params**: `route?.params?.category`
4. **Navigation ref available**: [src/navigation/navigationRef.js](src/navigation/navigationRef.js) for imperative navigation

**Key Observation**: No modal/side stack for nested flows - all screens are in main stack.

---

## 4️⃣ Forms & Validation

### Form Library: `react-hook-form`

### Current Form Implementation
**Location**: [src/screens/FunctionCategories/Form.js](src/screens/FunctionCategories/Form.js)

**Pattern**:
```javascript
const { control, handleSubmit, formState: { isSubmitting } } = useForm({
  defaultValues: {
    name: editingCategory?.name || '',
    tamilName: editingCategory?.tamilName || '',
    description: editingCategory?.description || '',
  },
});

// Wrapped Input components with validation
<Input name="name" control={control} rules={{ required: 'Required' }} />

// Submit handler with fake delay
const onSubmit = async data => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Pass data via navigation
  navigation.navigate('FunctionCategories', { category: categoryData, isEdit: !!editingCategory });
};
```

### Validation Rules Supported
- `required: 'message'` - custom message
- Built-in error display in Input component
- No complex validations yet (min/max, patterns, etc.)

### Data Persistence
- **Current**: Route params only (volatile - lost on app restart)
- **Available**: AsyncStorage (used for auth only)
- **Opportunity**: Create AsyncStorage persistence layer for CRUD data

---

## 5️⃣ State Management & Storage

### Authentication (Context)
**Location**: [src/context/AuthContext.js](src/context/AuthContext.js)

**Pattern**:
```javascript
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Hydrate from AsyncStorage on app start
  useEffect(() => {
    const storedUser = await getUser();
    setUser(storedUser);
  }, []);
}
```

- **Mock login**: `admin` / `admin` (2000ms delay)
- **Persistence**: AsyncStorage (key: `AUTH_USER`)

### Language (Context)
**Location**: [src/context/LanguageContext.js](src/context/LanguageContext.js)

**Pattern**:
```javascript
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // 'en' | 'ta'
  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ta' : 'en'));
  };
}

export function useLanguage() {
  return useContext(LanguageContext); // { language, toggleLanguage, translations }
}
```

- **i18n Location**: [src/utils/i18n.js](src/utils/i18n.js)
- **Flat object structure**: `translations['en']`, `translations['ta']`

### Data CRUD (In-Memory for Now)
**Location**: [src/screens/FunctionCategories/index.js](src/screens/FunctionCategories/index.js)

**Current Implementation**:
- useState for categories array
- setCategories for CRUD operations
- Alert for confirmations (delete)
- Toast notifications for feedback

**Data Flow**:
1. User fills form → submits
2. Form navigates back with `{ category, isEdit }`
3. List screen receives params via `route.params`
4. useEffect merges new/updated category into state

---

## 6️⃣ Styling Patterns

### Global Styling
- **Colors**: Material Blue (#1976D2), gray (#9E9E9E), red (#E53935)
- **Background**: Light gray (#F6F8FA)
- **Spacing**: 16px padding, 12px gaps

### Component Styling
- **StyleSheet.create()**: All components use StyleSheet
- **Elevation**: Used for cards (elevation: 2-4)
- **Responsive**: Card width calculation for grid layout

**Example**:
```javascript
const { width } = Dimensions.get('window');
const CARD_SIZE = (width - PADDING * 2 - GAP * 2) / 3;
```

---

## 7️⃣ Firebase Integration

### Services Available
**Location**: [src/services/firebaseService.js](src/services/firebaseService.js)

```javascript
✅ requestUserPermission()          // Ask notification permission
✅ getFcmToken()                    // Get device token
✅ onMessageListener()              // Foreground notifications
✅ onNotificationOpenedAppListener() // Background tap
✅ getInitialNotificationListener() // Quit state tap
```

### Integration Points
- **App.js**: Initializes FCM on app start
- **Toast notifications**: Integrated for UX feedback

---

## 8️⃣ Icons & UI Assets

### Icon System
**SVG Icons via react-native-svg** (not vector icon font)

**Available**:
- `MicIcon` - voice input
- `EyeIcon` - show password
- `EyeOffIcon` - hide password

**HomeScreen emojis**: 📂, 📋, 🔔, ➕

---

## 9️⃣ Translation System

### How i18n Works
**Location**: [src/utils/i18n.js](src/utils/i18n.js)

```javascript
export const translations = {
  en: { functionCategories: 'Function Categories', ... },
  ta: { functionCategories: 'நிகழ்ச்சி வகைகள்', ... },
};

// In component
const { translations } = useLanguage();
<Text>{translations.functionCategories}</Text>
```

**Current Keys**:
- `functionCategories`, `viewFunctions`, `notifications`, `more`
- `name`, `tamilName`, `description`
- `save`, `cancel`, `deleteCategory`

---

## 🔟 Best Practices Summary

| Area | Pattern | File(s) |
|------|---------|---------|
| **Feature Structure** | Feature folder with List + Form | FunctionCategories/ |
| **Forms** | react-hook-form + Input component | FormInputs/Input.js |
| **Validation** | Rules in useForm() + error display | Form.js |
| **State Management** | Context API for global (Auth, Language) | context/ |
| **Data CRUD** | useState + route params (can scale to AsyncStorage) | screens/ |
| **Notifications** | Toast for feedback, Alert for confirmation | All screens |
| **Storage** | AsyncStorage wrapper functions | utils/authStorage.js |
| **Navigation** | Stack navigator, route params passing | App.js, navigationRef.js |
| **Styling** | StyleSheet.create(), responsive via Dimensions | All components |
| **i18n** | Flat translation objects by language | utils/i18n.js |
| **Icons** | SVG via react-native-svg | components/Icons/ |

---

## 🎯 RECOMMENDED STRUCTURE FOR FUNCTION/EVENT CRUD

### Option A: Mirror FunctionCategories Pattern (⭐ Recommended)
```
screens/
├── FunctionCategories/      ✅ Already exists
│   ├── index.js
│   └── Form.js
├── Functions/               🆕 New feature
│   ├── index.js            (List all functions)
│   └── Form.js             (Add/edit function)
└── Events/                  🆕 New feature
    ├── index.js            (List all events)
    └── Form.js             (Add/edit event)
```

### Option B: Unified Events View (Alternative)
```
screens/
├── Events/                  🆕 New feature
│   ├── index.js            (List + filter by type)
│   ├── Form.js             (Create function/event)
│   └── Detail.js           (View details, linked functions)
└── FunctionCategories/      ✅ Unchanged
```

---

## 📐 STEP-BY-STEP IMPLEMENTATION GUIDE

### Phase 1: Data Model & Storage
1. **Create storage utility**: `utils/functionStorage.js`
   - `saveFunctions(functions)` → AsyncStorage
   - `getFunctions()` → AsyncStorage
   - `saveEvents(events)` → AsyncStorage
   - `getEvents()` → AsyncStorage

2. **Create custom hook**: `hooks/useFunctionCRUD.js`
   - Generic CRUD hook with AsyncStorage persistence
   - Hydrate on mount, auto-save on change

3. **Add i18n keys** in [src/utils/i18n.js](src/utils/i18n.js)
   - `functionName`, `eventName`, `date`, `time`, `location`, etc.

### Phase 2: Navigation Setup
1. **Add routes** in [src/App.js](src/App.js)
   ```javascript
   <Stack.Screen name="Functions" component={FunctionsScreen} />
   <Stack.Screen name="FunctionForm" component={FunctionForm} />
   ```

2. **Add home buttons** in [src/screens/HomeScreen.js](src/screens/HomeScreen.js)
   ```javascript
   { id: 'functions', label: 'Functions', onPress: () => navigate('Functions') }
   { id: 'events', label: 'Events', onPress: () => navigate('Events') }
   ```

### Phase 3: UI Components
1. **Extend Input.js** for new field types
   - Date picker
   - Time picker
   - Dropdown/select
   - Checkbox for multi-selection

2. **Create new form screens** (follow FunctionCategoryForm pattern)
3. **Create list screens** (follow FunctionCategoriesScreen pattern with filtering/sorting)

### Phase 4: Integration
1. Link Functions to Categories (dropdown selector)
2. Link Events to Functions (multi-select or referenced)
3. Add search/filter functionality

---

## ⚠️ THINGS TO AVOID

❌ Don't modify existing setup/config files
❌ Don't change authentication implementation
❌ Don't move components around
❌ Don't change navigation ref implementation
❌ Don't add complex state library (Zustand, Redux) - use Context + AsyncStorage hooks
❌ Don't hardcode translations - always use i18n
❌ Don't use different styling patterns - follow StyleSheet.create()

---

## ✅ SAFE IMPLEMENTATION ZONES

✅ Create new feature folders under `screens/`
✅ Extend `utils/` with storage helpers
✅ Create custom hooks in `hooks/`
✅ Extend translations in `utils/i18n.js`
✅ Add more Input field types to `FormInputs/Input.js`
✅ Add more icons to `components/Icons/`
✅ Create new context if needed (but prefer AsyncStorage + hooks)
✅ Add new screens to navigation stack in `App.js`

---

## 🔍 Files to Reference While Building

### Must Read Before Coding
- [src/screens/FunctionCategories/index.js](src/screens/FunctionCategories/index.js) - List pattern
- [src/screens/FunctionCategories/Form.js](src/screens/FunctionCategories/Form.js) - Form pattern
- [src/components/FormInputs/Input.js](src/components/FormInputs/Input.js) - Input component
- [src/utils/authStorage.js](src/utils/authStorage.js) - Storage pattern
- [src/utils/i18n.js](src/utils/i18n.js) - i18n pattern
- [src/context/LanguageContext.js](src/context/LanguageContext.js) - Context pattern

### Modify These Files
- [src/App.js](src/App.js) - Add new routes
- [src/screens/HomeScreen.js](src/screens/HomeScreen.js) - Add navigation items
- [src/utils/i18n.js](src/utils/i18n.js) - Add new translations

---

## 🚀 READY TO START!

The project is well-structured for scaling. Follow the FunctionCategories pattern as your template, create storage utilities using AsyncStorage, and leverage the existing Input component + useForm pattern for all new features.

**Next Steps**: 
1. Create storage utilities for Functions and Events
2. Create custom CRUD hooks
3. Add new screens following FunctionCategories pattern
4. Integrate with navigation
5. Add UI enhancements (date/time pickers, filtering, search)
