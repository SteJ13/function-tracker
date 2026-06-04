# Function Tracker - Data Model v2

## Project Purpose

Function Tracker is a React Native + Supabase application used to manage social functions, invitations, contributions, and return tracking.

Primary use case:

Tamil Nadu family functions such as:

* Marriage
* First Holy Communion
* House Warming
* Birthday
* Ear Piercing
* Other family functions

The application replaces traditional notebooks used to track cash and gold contributions received from relatives and friends.

---

# Core Concepts

The application manages two kinds of events:

## MY_FUNCTION

Functions conducted by the user.

Examples:

* My Wedding
* My House Warming
* My Daughter's First Holy Communion

People attend and contribute:

* Cash
* Gold

These contributions are recorded.

---

## INVITATION

Functions conducted by others.

Examples:

* Relative's Wedding
* Friend's House Warming

The user receives an invitation and wants to know:

* What did this person previously give me?
* What should I return?

---

# Database Schema

## Table: functions

Stores both MY_FUNCTION and INVITATION records.

### Columns

| Column           | Type        |
| ---------------- | ----------- |
| id               | uuid        |
| title            | text        |
| category_id      | uuid        |
| function_date    | date        |
| function_time    | time        |
| notes            | text        |
| status           | text        |
| created_at       | timestamptz |
| updated_at       | timestamptz |
| location_id      | uuid        |
| user_id          | uuid        |
| updated_by       | uuid        |
| reminder_minutes | integer     |
| function_type    | text        |

### Function Types

MY_FUNCTION

INVITATION

### Relationships

functions.category_id → categories.id

functions.location_id → locations.id

---

## Table: contributions

Stores contribution records.

### Columns

| Column            | Type        |
| ----------------- | ----------- |
| id                | uuid        |
| function_id       | uuid        |
| place_id          | uuid        |
| family_name       | text        |
| person_name       | text        |
| spouse_name       | text        |
| contribution_type | text        |
| amount            | numeric     |
| notes             | text        |
| direction         | text        |
| returned          | boolean     |
| user_id           | uuid        |
| created_at        | timestamptz |
| returned_at       | timestamptz |
| updated_by        | uuid        |

### Contribution Types

CASH

GOLD

### Direction Values

RECEIVED

RETURNED

### Relationships

contributions.function_id → functions.id

contributions.place_id → locations.id

---

## Table: categories

Function categories.

### Columns

| Column      | Type        |
| ----------- | ----------- |
| id          | uuid        |
| name        | text        |
| tamilName   | text        |
| description | text        |
| created_at  | timestamptz |
| updated_at  | timestamptz |
| user_id     | uuid        |
| updated_by  | uuid        |

Examples:

* Marriage
* First Holy Communion
* House Warming
* Birthday

---

## Table: locations

Reusable location master table.

### Columns

| Column     | Type        |
| ---------- | ----------- |
| id         | uuid        |
| name       | text        |
| tamil_name | text        |
| created_at | timestamptz |

Examples:

English:

* Kurai Pettai
* Srimushnam

Tamil:

* குறைபெட்டை
* ஸ்ரீமுஷ்ணம்

Used for search and display.

---

# Return Tracking

## Pending Returns

Shows contributions where:

returned = false

and contribution originated from MY_FUNCTION history.

Purpose:

Person gave something to me.

I have not yet returned it.

---

## Return History

Shows contributions where:

returned = true

and returned_at is populated.

Purpose:

Historical audit of returned contributions.

---

# Smart Suggestion Engine

Used during Invitation flow.

Search based on:

* Person Name
* Family Name
* Location

System finds historical contributions and suggests:

* Amount
* Contribution Type
* Location
* Person Name
* Family Name
* Spouse Name

Selecting suggestion should pre-fill all available fields.

---

# Notification Model

Current implementation:

Local notifications

Reminder source:

functions.reminder_minutes

Default:

1440 minutes (1 day)

Future upgrade:

Firebase Cloud Messaging (FCM)

---

# Status Rules

Status should be calculated dynamically.

Do not rely solely on stored status value.

Rules:

If function datetime > current datetime

Status = Upcoming

Else

Status = Completed

Cancelled should be user-selected.

---

# Navigation Structure

Home

Menus:

* My Functions
* Invitations
* Categories
* Calendar
* Pending Returns
* Locations
* Notifications
* Open Menus

---

# Function Flow

## My Functions

Home
→ My Functions
→ Add Function
→ Add Contributions

Supports:

Save & Add Next

Save & Exit

Multiple contributions.

---

## Invitations

Home
→ Invitations
→ Add Invitation
→ Add Contribution

Supports:

Save & Exit only

Single contribution expected.

After save:

Return to Invitations list.

---

# Security (RLS)

## Functions

Policies:

functions_select_own

functions_insert_own

functions_update_own

functions_delete_own

User can only access their own records.

---

## Contributions

Policies:

Select own contributions

Insert own contributions

Update own contributions

Delete own contributions

User scoped.

---

## Locations

Authenticated users can:

* Read
* Insert
* Delete

Shared lookup table.

---

## Categories

Currently user-managed.

Policies:

Users can manage own categories.

---

# Future Enhancements

1. Firebase Push Notifications
2. Notification History
3. Export Reports (PDF/Excel)
4. Dashboard Analytics
5. Full Tamil Localization
6. Backup & Restore
7. Family-Based Search Improvements

End of Document
