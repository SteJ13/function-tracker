# Function Tracker - Project Context

## Overview

Function Tracker is a React Native application designed primarily for Tamil Nadu social function tracking.

The purpose is to replace traditional notebooks used during weddings and family functions for recording contributions (cash/gold) and later returning them correctly when invited to another function.

---

# Tech Stack

Frontend:

* React Native (JavaScript)
* React Navigation

Backend:

* Supabase

Database:

* PostgreSQL (Supabase)

Authentication:

* Supabase Auth

Notifications:

* Notifee (local notifications)
* Firebase push notifications planned

---

# Core Business Flow

There are TWO different function types.

## 1. My Functions

Functions conducted by the user.

Examples:

* Wedding
* House warming
* Ear piercing
* Birthday
* Other family functions

People attend and contribute:

* Cash
* Gold

These contributions are recorded.

Purpose:
Track who gave what.

---

## 2. Invitations

Functions conducted by others.

User receives invitation.

When invited:

* Search previous contribution history.
* Check what that person gave previously.
* Return similar contribution.
* Mark return status.

Purpose:
Track what should be returned.

---

# Database Design

## functions

Stores both My Functions and Invitations.

Important columns:

* id
* title
* category_id
* function_date
* function_time
* location_id
* notes
* reminder_minutes
* function_type
* user_id

function_type values:

* MY_FUNCTION
* INVITATION

Important:
Functions are user-scoped.

RLS:
user_id = auth.uid()

---

## contributions

Stores contribution records.

Columns:

* id
* function_id
* location_id
* family_name
* person_name
* spouse_name
* contribution_type
* amount
* notes
* returned
* returned_at
* user_id

Contribution types:

* CASH
* GOLD

RLS:
user_id = auth.uid()

---

## locations

Shared lookup table.

Columns:

* id
* name
* tamil_name

Purpose:
Reusable location list.

Important:
Locations are GLOBAL.

Not user-specific.

---

## categories

Function categories.

Examples:

* Marriage
* House Warming
* Ear Piercing
* Birthday

Global table.

---

# Ledger Concept

Ledger tracks pending returns.

Meaning:

People gave something to me.

Later when I attend their function,
I should return similar contribution.

---

## Pending Returns

Shows:

returned = false

Only contributions received during:

MY_FUNCTION

Not invitation contributions.

---

## Return History

Shows:

returned = true

With return date.

---

# Smart Suggestion System

Used during Invitation flow.

User enters:

* Person Name
* Family Name
* Location

System searches historical contributions.

Suggestion card displays:

* Previous amount
* Previous gold weight
* Function information

When selected:

Prefill:

* Location
* Family Name
* Person Name
* Spouse Name
* Contribution Type
* Amount

Purpose:
Return correct contribution.

---

# Navigation Structure

Home Dashboard

Menus:

* My Functions
* Invitations
* Function Categories
* Calendar
* Pending Returns
* Locations
* Notifications
* Open Menus (utility tools)

---

# Project File Structure

Below is the directory structure of the React Native codebase under `src/`:

* `src/`
  * `App.js` - Main entry point of the React Native application.
  * `components/` - Shared UI components.
    * `Filters/` - Filter controls (`DateRangeFilter`, `FunctionFilters`, `StatusFilter`).
    * `FormInputs/` - Custom form input controls (`DatePicker`, `Input`, `RHFLocationInput`, `Select`, `StatusSelector`, `TimePicker`).
    * `Icons/` - Custom SVG/Icon components (`DeleteIcon`, `EditIcon`, `PlusIcon`, `SearchIcon`, etc.).
    * `PaginatedList/` - Reusable paginated list view with infinite scroll support.
    * `AppLoader.js`, `HeaderUserMenu.js`, `OfflineBanner.js`, `SyncStatusBanner.js` - Global/shared layout and status components.
  * `context/` & `contexts/` - React Context providers for global state management.
    * `AuthContext.js` - Authentication state (sign in, sign up, sign out).
    * `LanguageContext.js` - Localization and translations.
    * `NetworkContext.js` - Network connectivity state monitoring.
    * `SyncContext.js` - Database and offline sync state.
  * `hooks/` - Custom React hooks.
    * `useOfflineExecutor.js` - Hook for executing database operations with offline-first support.
  * `navigation/` - Navigation configuration and references.
    * `index.js` - Stack navigator setup and routing.
    * `navigationRef.js` - Global navigation reference.
  * `screens/` - Application screens grouped by feature/domain.
    * `Auth/` - Authentication screens (login, signup, forgot/reset password).
    * `Calendar/` - Calendar view of functions.
    * `Contributions/` - Contribution management (`AddScreen`, `EditScreen`, `LedgerScreen` for pending returns, `ReturnHistoryScreen`, `ListScreen`).
    * `FunctionCategories/` - Function category management.
    * `Functions/` - Function/Event management (`Form`, `FunctionDetailScreen`, `InvitationsScreen`, `MyFunctionsScreen`).
    * `Locations/` - Location management and search.
    * `Notifications/` - Notification settings and log.
    * `openMenus/` - Utility screens (`AreaCalculatorScreen`, `HiddenVideoScreen`, `OpenMenusScreen`).
    * `HomeScreen.js` - Main dashboard.
  * `services/` - Data layer and third-party API clients.
    * `db.js` - SQLite/local DB wrapper.
    * `firebaseService.js` - Firebase Cloud Messaging client.
    * `locationCache.js` - Cache for geographical locations.
    * `notifications.js` - Local notification scheduler via Notifee.
    * `offlineQueue.js` - Queue manager for queuing write operations when offline.
    * `supabaseClient.js` - Supabase client initialization.
    * `syncEngine.js` - Sync engine to synchronize offline queue with Supabase.
  * `utils/` - Shared utility functions and configuration.
    * `authStorage.js` - Secure storage helper for auth tokens.
    * `functionStorage.js` - Local cache storage for functions.
    * `i18n.js` - Localization translations (English & Tamil).
    * `statusHelper.js` - Dynamic function status helper (upcoming vs completed).

---

# Function Flow

My Functions:

Home
→ My Functions
→ Add Function
→ Add Contributions
→ Save

Multiple contributions allowed.

Buttons:

* Save & Add Next
* Save & Exit

---

Invitation Flow

Home
→ Invitations
→ Add Invitation
→ Add Contribution
→ Save & Exit

Only ONE contribution expected.

No Save & Add Next.

After save:
Navigate back to Invitations list.

Never navigate back to Add Function screen.

---

# Status Rules

Do NOT store status in database.

Status must be calculated dynamically.

Rules:

If functionDateTime > currentTime

Status:
Upcoming

Else

Status:
Completed

---

# Notifications

Current:
Notifee local notifications.

Issue:
Not reliable when app is killed.

Future plan:
Firebase Cloud Messaging (FCM)

Target behavior:
Notify user X minutes before function.

Common value:
1440 minutes (1 day before)

---

# Area Calculator Module

Utility screen.

Inputs:

* North (meters)
* South (meters)
* East (meters)
* West (meters)

Formula:

AverageLength = (North + South) / 2

AverageWidth = (East + West) / 2

SquareMeters =
AverageLength × AverageWidth

SquareFeet =
SquareMeters × 10.7639

Cents =
SquareFeet / 435.6

Outputs:

* Square Feet
* Cents

---

# Security Rules

Functions:
User-specific

Contributions:
User-specific

Locations:
Global

Categories:
Global

Never remove RLS from functions or contributions.

Policies:

SELECT:
user_id = auth.uid()

INSERT:
user_id = auth.uid()

UPDATE:
user_id = auth.uid()

DELETE:
user_id = auth.uid()

---

# Development Rules

1. Prefer modifying existing files.
2. Do NOT create .md files unless explicitly requested.
3. Do NOT create documentation automatically.
4. Use existing project structure.
5. Keep changes minimal.
6. Avoid unnecessary refactors.
7. Preserve existing UI patterns.
8. Reuse existing components whenever possible.

---

# Current Known Future Work

1. Reliable notifications using Firebase.
2. Export reports (optional).
3. Dashboard improvements.
4. Tamil UI labels (optional).
5. Notification history screen.
6. Backup/restore strategy.

End of Project Context.
