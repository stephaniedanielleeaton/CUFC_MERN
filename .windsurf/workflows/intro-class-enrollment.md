---
description: Intro class enrollment flow documentation - how users enroll in intro classes
---

# Intro Class Enrollment Flow

This document describes the enrollment flows for intro classes at CUFC.

## Overview

There are two main enrollment paths:
1. **Authenticated users** - Sign in first, then enroll via dashboard
2. **Guest users** - Enroll without an account (guest checkout)

---

## Authenticated User Flow

### Entry Points
- Home page → Click "Enroll Now" on intro class → Guest modal → "Sign In" → Dashboard
- Direct navigation to `/dashboard`

### Dashboard Enrollment Steps

The dashboard uses an `enrollmentStep` state machine with three states:

```
'dashboard' → 'profile' (if incomplete) → 'class-selection' → checkout
```

#### Step 1: Dashboard View
- User sees full dashboard with enrollment card
- Click "Enroll in Intro Class" triggers `handleEnrollClick`

#### Step 2: Profile Check
- If `profile.profileComplete === true` → Skip to class selection
- If `profile.profileComplete === false` → Show profile form

#### Step 3: Profile Form (if needed)
- `ProfileForm` component with `onSaved` callback
- After save → `refreshProfile()` → move to class selection

#### Step 4: Class Selection
- `IntroClassOfferings` component with `onClassSelected` callback
- User selects a class date → triggers `handleClassSelected`

#### Step 5: Checkout
- `proceedToCheckout(classId, profileId)` creates Square checkout
- Redirects to Square payment page
- After payment → redirects back to `/dashboard`

### Key Files
- `client/src/pages/DashboardPage.tsx` - Main dashboard with enrollment flow
- `client/src/components/intro-classes/IntroClassOfferings.tsx` - Class selection
- `client/src/components/profile/UnifiedProfileForm.tsx` - Unified profile form (guest + authenticated)

---

## Guest User Flow (Unauthenticated)

### Entry Point
- Home page → Click "Enroll Now" on intro class → Guest modal appears

### Guest Checkout Modal Steps

The `GuestCheckoutModal` uses a `step` state with two states:

```
'choice' → 'profile' → checkout
```

#### Step 1: Choice
- User chooses: "Sign In" or "Continue as Guest"
- Sign In → Auth0 login → redirects to `/dashboard`
- Continue as Guest → Show profile form

#### Step 2: Guest Profile Form
- `UnifiedProfileForm` component with `mode="guest"`
- Creates guest profile via `POST /api/members/guest`
- No Auth0 account required

#### Step 3: Checkout
- After profile created → `onGuestProfileCreated` callback
- Parent component calls `proceedToCheckout` with guest profile ID
- Uses `POST /api/checkout/intro-guest` endpoint

### Key Files
- `client/src/components/checkout/GuestCheckoutModal.tsx` - Modal with choice/profile steps
- `client/src/components/profile/UnifiedProfileForm.tsx` - Unified profile form (mode='guest')
- `server/src/routes/checkout.ts` - `/api/checkout/intro-guest` endpoint
- `server/src/services/memberProfileService.ts` - `createGuestProfile` function

---

## API Endpoints

### Profile Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/members/me` | GET | Required | Get current user's profile |
| `/api/members/me` | POST | Required | Create profile for authenticated user |
| `/api/members/me/update` | POST | Required | Update existing profile |
| `/api/members/guest` | POST | None | Create guest profile (no auth) |

### Checkout Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/checkout/intro` | POST | Required | Create intro class checkout (authenticated) |
| `/api/checkout/intro-guest` | POST | None | Create intro class checkout (guest) |
| `/api/checkout/dropin` | POST | Required | Create drop-in checkout |
| `/api/checkout/subscription` | POST | Required | Create subscription checkout |

---

## Component Props

### IntroClassOfferings
```typescript
interface IntroClassOfferingsProps {
  onClassSelected?: (classId: string) => void  // Callback when class selected (dashboard flow)
}
```

### UnifiedProfileForm
```typescript
type FormMode = 'guest' | 'authenticated' | 'edit'

interface UnifiedProfileFormProps {
  mode: FormMode                                    // Controls API endpoint and auth behavior
  existingProfile?: MemberProfileDTO | null         // For edit mode - pre-fills form
  onProfileCreated?: (profile: MemberProfileDTO) => void  // Guest mode callback
  onSaved?: () => void                              // Authenticated/edit mode callback
  submitLabel?: string                              // Custom submit button text
}
```

### GuestCheckoutModal
```typescript
interface GuestCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onGuestProfileCreated: (profile: MemberProfileDTO) => void
  returnTo?: string  // Where to redirect after sign-in (default: '/dashboard')
}
```

---

## Auth0 Integration

### Redirect Handling
- `main.tsx` wraps `Auth0Provider` inside `BrowserRouter`
- `Auth0ProviderWithNavigate` component handles `onRedirectCallback`
- Uses `appState.returnTo` to navigate after login

### Protected Routes
- `DashboardPage` checks `isAuthenticated` after `authLoading` completes
- If not authenticated → triggers `loginWithRedirect` with `returnTo: '/dashboard'`

---

## Mobile Considerations

### GuestCheckoutModal
- Uses "bottom sheet" pattern on mobile (`items-end`, `rounded-t-xl`)
- Full width on mobile, max-width on desktop
- `max-h-[95vh]` with `overflow-y-auto` for scrolling

### ProfileForm
- Responsive grid: single column on mobile, two columns on desktop
- Form scrolls within page container

---

## Backend Technical Details

### Member Profile Creation

#### Authenticated User Profile Creation
**Endpoint:** `POST /api/members/me`

**Flow:**
1. User authenticates via Auth0
2. Frontend calls `/api/members/me` with JWT token
3. `memberProfileService.createProfileForUser(auth0Id, initialData)`:
   - Checks for existing unlinked profile with same email
   - If found: links `auth0Id` to existing profile (guest → authenticated upgrade)
   - If not found: creates new profile with `memberStatus: 'New'`
   - Creates Square customer if email provided

**Key Files:**
- `server/src/routes/members.ts` - Route handler
- `server/src/services/memberProfileService.ts` - `createProfileForUser()`
- `server/src/dao/memberProfileDAO.ts` - Database operations

#### Guest Profile Creation
**Endpoint:** `POST /api/members/guest`

**Flow:**
1. User fills out guest form (no auth required)
2. Frontend calls `/api/members/guest` with profile data
3. `memberProfileService.createGuestProfile(data)`:
   - Checks for existing profile with same email
   - If found: updates existing profile with new data
   - If not found: creates new profile with `memberStatus: 'New'`
   - Creates Square customer if email provided
   - No `auth0Id` is set (can be linked later if user creates account)

**Key Files:**
- `server/src/routes/members.ts` - Route handler
- `server/src/services/memberProfileService.ts` - `createGuestProfile()`

### Member Status Flow

```
New → Enrolled → Full
```

| Status | Description | Trigger |
|--------|-------------|---------|
| `New` | Default status on profile creation | Profile created |
| `Enrolled` | Paid for intro class | Square webhook (automatic) |
| `Full` | Full member | Admin manual action only |

**Auto-Unarchive:** When a member pays for an intro class, if they were previously archived (`isArchived: true`), the webhook handler automatically sets `isArchived: false`. This ensures paying members always appear in the admin panel.

**Idempotency:** The `memberStatus` field serves as the idempotency check. Notes and email alerts are only added/sent when status changes from `New` to `Enrolled`. Duplicate webhook calls for the same order are effectively ignored since the status is no longer `New`.

**Profile Timestamps:** All member profiles have `createdAt` and `updatedAt` timestamps automatically managed by Mongoose (`{ timestamps: true }`).

**Important:** `Full` status can ONLY be set by admin via `PATCH /api/admin/members/:id`

---

### Square Checkout Creation

#### Authenticated Checkout
**Endpoint:** `POST /api/checkout/intro`

**Flow:**
1. Frontend sends `{ catalogObjectId, memberProfileId, redirectUrl }`
2. Server fetches the member profile by `memberProfileId`
3. Server validates `profile.profileComplete === true`
4. If profile is incomplete, server returns `400` with `code: 'PROFILE_INCOMPLETE'`
5. Server calls `squareCheckoutService.createPaymentLink()`:
   - Creates Square order with `memberProfileId` in line item metadata
   - Includes `squareCustomerId` if profile has one
   - Returns checkout URL
6. User redirected to Square payment page

#### Guest Checkout
**Endpoint:** `POST /api/checkout/intro-guest`

**Flow:**
1. Same profile-completeness validation as authenticated intro checkout, but no JWT required
2. Uses guest profile's `memberProfileId`

#### Drop-In Checkout
**Endpoint:** `POST /api/checkout/dropin`

**Flow:**
1. Frontend sends `{ memberProfileId, redirectUrl }`
2. Server fetches the member profile by `memberProfileId`
3. Server validates `profile.profileComplete === true`
4. If profile is incomplete, server returns `400` with `code: 'PROFILE_INCOMPLETE'`
5. Server creates Square checkout for `DROP_IN_CATALOG_OBJECT_ID`

#### Subscription Checkout
**Endpoint:** `POST /api/checkout/subscription`

**Flow:**
1. Authenticated frontend calls endpoint with JWT
2. Server resolves the current user profile from Auth0 ID
3. Server validates `profile.profileComplete === true`
4. If profile is incomplete, server returns `400` with `code: 'PROFILE_INCOMPLETE'`
5. Server returns the configured Square subscription checkout URL

**Key Files:**
- `server/src/routes/checkout.ts` - Route handlers
- `server/src/services/square/SquareCheckoutService.ts` - `createPaymentLink()`
- `client/src/services/checkoutService.ts` - Throws `CheckoutError` with structured `code`

---

### Square Webhook Processing

**Endpoint:** `POST /api/square/webhook`

**Webhook Event:** `payment.updated` with `status: 'COMPLETED'`

**Flow:**
```
1. Webhook received
2. Verify HMAC signature
3. Extract payment_id and order_id from event
4. Fetch full payment from Square API (to get customer_id)
5. Call introClassEnrollmentService.handlePaymentCompleted(orderId, customerId)
```

**Key Files:**
- `server/src/features/tournament/routes/squareWebhookRoutes.ts` - Webhook handler
- `server/src/services/square/SquarePaymentsService.ts` - `getById()` to fetch payment
- `server/src/services/introClassEnrollmentService.ts` - Enrollment processing

---

### Intro Class Enrollment Service

**File:** `server/src/services/introClassEnrollmentService.ts`

#### `handlePaymentCompleted(orderId, squareCustomerId)`

**Flow:**
1. **Get order metadata:**
   - Fetch order from Square API
   - Check if line item is an intro class (matches `INTRO_CLASS_CATALOG_OBJECT_ID` variations)
   - Extract `memberProfileId` from line item metadata
   - Extract `variationName` for class date info

2. **Update member profile:**
   - Find profile by `memberProfileId`
   - If `memberStatus === 'New'`: update to `'Enrolled'`
   - Append enrollment note to profile notes
   - If profile missing `squareCustomerId`: set it from payment

3. **Send enrollment alert (if status changed):**
   - Only sends if member was `New` → `Enrolled`
   - Email to `EMAIL_ACCOUNT` with member info and class details
   - Prevents duplicate alerts (idempotent)

**Idempotency:**
- If webhook fires multiple times, only first call updates status
- Subsequent calls see `memberStatus !== 'New'` and skip alert

#### Data Flow Diagram

```
Square Checkout
      │
      ▼
┌─────────────────┐
│ Order created   │
│ with metadata:  │
│ - memberProfileId│
│ - catalogObjectId│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payment         │
│ completed       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook fires   │
│ payment.updated │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch payment   │
│ (get customerId)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get order       │
│ metadata        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update profile: │
│ - status→Enrolled│
│ - squareCustomerId│
│ - notes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send alert      │
│ (if New→Enrolled)│
└─────────────────┘
```

---

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SQUARE_ACCESS_TOKEN` | Square API access token |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` |
| `SQUARE_SIGNATURE_KEY` | Webhook signature verification key |
| `SQUARE_RETAIL_LOCATION_ID` | Square location ID for orders |
| `EMAIL_ACCOUNT` | Email address for enrollment alerts |

### Constants

| Constant | File | Description |
|----------|------|-------------|
| `INTRO_CLASS_CATALOG_OBJECT_ID` | `server/src/config/constants.ts` | Square catalog ID for intro class item |

---

### Error Handling

#### Webhook Failures
- Returns 200 OK even on processing errors (prevents Square retries)
- Errors logged to console
- Profile updates are atomic (MongoDB `findByIdAndUpdate`)

#### Missing Data
- If `memberProfileId` not in order metadata → logs and returns success
- If profile not found → logs warning and returns error
- If Square API fails → logs error and returns null

---

## Critical Safeguards

### Profile Completeness Validation

**Server-side enforcement:** All app checkout endpoints validate that `profile.profileComplete === true` before returning or creating a checkout link. This prevents checkout without a complete profile, regardless of frontend state.

Protected endpoints:
- `/api/checkout/intro`
- `/api/checkout/intro-guest`
- `/api/checkout/dropin`
- `/api/checkout/subscription`

```typescript
if (!profile.profileComplete) {
  return res.status(400).json({ 
    error: 'Profile must be complete before checkout. Please complete your profile first.',
    code: 'PROFILE_INCOMPLETE'
  });
}
```

**Frontend handling:** `client/src/services/checkoutService.ts` parses API error responses and throws `CheckoutError`. Callers check `err.code === 'PROFILE_INCOMPLETE'`; they do not inspect human-readable error strings.

**Dashboard flow:** `DashboardPage.proceedToCheckout()` handles `PROFILE_INCOMPLETE` by:
1. Alerting the user that their profile must be completed
2. Calling `refreshProfile()` to sync `ProfileContext` with the server
3. Setting `enrollmentStep` to `'profile'` so the profile form is displayed

**Intro offerings standalone flow:** `IntroClassOfferings` blocks enroll attempts when `profile.profileComplete` is false and displays the "Complete your profile" prompt. It also handles `PROFILE_INCOMPLETE` for non-dashboard checkout paths by refreshing profile context.

### Admin Profile Management

- **Admin-only updates:** Member updates are restricted to `club-admin` via `PATCH /api/admin/members/:id`
- **Editable notes:** Admins can update member `notes` from the admin member details form
- **Archived visibility:** The admin member list must preserve archived profiles through Square-status enrichment so Archived/All filters work correctly
- **Deletion:** Profile deletion is restricted to `club-admin` via `DELETE /api/admin/members/:id`

### Logging Points

All critical operations are logged with `[Module]` prefixes for easy filtering:

| Log Prefix | Location | Events |
|------------|----------|--------|
| `[Members] GET /me` | Profile retrieval | Auth0 lookup, email linking attempts |
| `[Members] POST /me` | Profile creation | New profile creation with details |
| `[Members] POST /guest` | Guest profile | Guest profile creation |
| `[Checkout]` | Checkout endpoints | Checkout requests, validation failures, success |

### Potential Failure Points

1. **User navigates away before completing profile form**
   - Mitigation: Server-side validation blocks checkout without complete profile
   
2. **Frontend state becomes stale (token expiration)**
   - Mitigation: `ProfileContext` sets profile to null on error, triggering re-fetch
   
3. **Guest profile creation fails silently**
   - Mitigation: API returns error response, frontend displays error message
   
4. **Webhook doesn't fire or fails**
   - Mitigation: Webhook logs all processing, returns 200 to prevent retries
   - Manual recovery: Admin can update member status via admin panel

### Debugging Missing Profiles

If a user paid but has no profile:

1. Check logs for `[Checkout]` entries with their email
2. Check logs for `[Members] POST` entries with their email
3. Check Square dashboard for the order → find `memberProfileId` in metadata
4. If `memberProfileId` exists, check MongoDB for that profile
5. If profile exists but not linked to auth0Id, user may have signed up with different email
