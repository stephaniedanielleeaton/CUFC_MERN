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
- `GuestProfileForm` component (simplified form)
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

---

## Component Props

### IntroClassOfferings
```typescript
interface IntroClassOfferingsProps {
  onClassSelected?: (classId: string) => void  // Callback when class selected (dashboard flow)
  allowIncompleteProfile?: boolean              // Allow enroll button for incomplete profiles
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
