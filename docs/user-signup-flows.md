# User Signup & Intro Class Enrollment Flows

This document provides technical documentation for all user signup and intro class enrollment flows.

---

## Table of Contents

1. [Overview](#overview)
2. [Flow 1: Dashboard Enrollment (Authenticated)](#flow-1-dashboard-enrollment-authenticated)
3. [Flow 2: Join Now / CTA Enrollment](#flow-2-join-now--cta-enrollment)
4. [Flow 3: Guest Checkout](#flow-3-guest-checkout)
5. [Square Customer ID Management](#square-customer-id-management)
6. [Profile Completion Logic](#profile-completion-logic)
7. [Key Files Reference](#key-files-reference)

---

## Overview

### Entry Points

| Entry Point | Target User | Flow |
|-------------|-------------|------|
| Sign In → Dashboard | New/returning user | Dashboard → Profile (if needed) → Class Selection → Checkout |
| "Join Now" CTA / Nav | Unauthenticated user | Home → Select Class → Sign In → Profile (if needed) → Checkout |
| "Enroll Now" (unauthenticated) | Guest user | Modal → Profile Form → Checkout |

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardPage` | `client/src/pages/DashboardPage.tsx` | Main dashboard with enrollment state machine |
| `IntroClassOfferings` | `client/src/components/intro-classes/IntroClassOfferings.tsx` | Class selection UI |
| `GuestCheckoutModal` | `client/src/components/checkout/GuestCheckoutModal.tsx` | Sign-in vs guest choice modal |
| `UnifiedProfileForm` | `client/src/components/profile/UnifiedProfileForm.tsx` | Profile form (guest/authenticated/edit modes) |

---

## Flow 1: Dashboard Enrollment (Authenticated)

### Flow

```
User signs in → Dashboard → Profile check → 
  If incomplete: Complete Profile → Class Selection → Checkout
  If complete: Class Selection → Checkout
→ Square Payment → Return to Dashboard
```

### Implementation

#### State Machine (`DashboardPage.tsx`)

```typescript
type EnrollmentStep = 'dashboard' | 'profile' | 'class-selection'
```

#### Step-by-Step

1. **User lands on `/dashboard`**
   - `DashboardPage` checks `isAuthenticated` (Auth0)
   - If not authenticated → `loginWithRedirect({ appState: { returnTo: '/dashboard' } })`

2. **Profile Loading**
   - `useMemberProfile()` hook fetches profile via `GET /api/members/me`
   - If no profile exists → Shows `UnifiedProfileForm` with `mode="authenticated"`

3. **Enrollment Button Click** (`handleEnrollClick`)
   ```typescript
   const handleEnrollClick = useCallback(() => {
     if (profile?.profileComplete) {
       setEnrollmentStep('class-selection')
     } else {
       setEnrollmentStep('profile')
     }
   }, [profile?.profileComplete])
   ```

4. **Profile Form Submission** (if needed)
   - `UnifiedProfileForm` submits to `POST /api/members/me/update`
   - Calls `onSaved` → `handleProfileSaved` → `setEnrollmentStep('class-selection')`

5. **Class Selection**
   - `IntroClassOfferings` with `onClassSelected` callback
   - User selects class → `handleClassSelected(classId)`

6. **Checkout**
   ```typescript
   const proceedToCheckout = useCallback(async (classId: string, profileId: string) => {
     const token = await getAccessTokenSilently()
     const data = await createIntroCheckout(token, {
       catalogObjectId: classId,
       memberProfileId: profileId,
       redirectUrl: `${globalThis.location.origin}/dashboard`
     })
     globalThis.location.href = data.checkoutUrl
   }, [getAccessTokenSilently])
   ```

7. **Post-Payment**
   - Square redirects to `/dashboard`
   - `useIntroEnrollment` hook fetches enrollment status
   - Dashboard shows `DashboardIntroEnrollmentCard` instead of enroll button

### API Calls

| Step | Endpoint | Method | Auth |
|------|----------|--------|------|
| Fetch profile | `/api/members/me` | GET | Required |
| Create profile | `/api/members/me` | POST | Required |
| Update profile | `/api/members/me/update` | POST | Required |
| Create checkout | `/api/checkout/intro` | POST | Required |
| Fetch enrollment | `/api/members/me/intro-enrollment` | GET | Required |

---

## Flow 2: Join Now / CTA Enrollment

### Flow

```
User clicks "Join Now" or CTA → Home page intro section → 
Select class → Click "Enroll Now" → Modal appears →
Choose "Sign In" → Auth0 login → 
  If profile incomplete: Complete Profile → Checkout (with pre-selected class)
  If profile complete: Checkout (with pre-selected class)
→ Square Payment → Return to Dashboard
```

### Implementation

#### Entry Point: `useJoinNavigation` Hook

```typescript
// client/src/hooks/useJoinNavigation.ts
const handleJoinClick = useCallback(() => {
  if (isAuthenticated) {
    navigate('/dashboard')  // Authenticated users go to dashboard
    return
  }
  // Unauthenticated: scroll to intro section on home page
  if (location.pathname === '/') {
    const element = document.getElementById(INTRO_SECTION_ID)
    element?.scrollIntoView({ behavior: 'smooth' })
  } else {
    navigate('/')
  }
}, [isAuthenticated, location.pathname, navigate])
```

#### Class Selection on Home Page

1. User selects a class in `IntroClassOfferings`
2. Clicks "Enroll Now" → triggers `handleGuestEnrollClick`
3. Class selection is persisted to sessionStorage
4. Opens `GuestCheckoutModal`

```typescript
const handleGuestEnrollClick = () => {
  if (!selectedVariationId) return
  
  // Persist selection before potential sign-in redirect
  sessionStorage.setItem('pendingIntroEnrollment', JSON.stringify({
    classId: selectedVariationId,
    timestamp: Date.now()
  }))
  
  setShowGuestModal(true)
}
```

#### GuestCheckoutModal Sign-In Path

```typescript
// client/src/components/checkout/GuestCheckoutModal.tsx
const handleSignIn = () => {
  loginWithRedirect({ appState: { returnTo: '/enroll/pending' } })
}
```

#### Pending Enrollment Page (`/enroll/pending`)

After Auth0 login, user is redirected to `PendingEnrollmentPage` which:
1. Reads `pendingIntroEnrollment` from sessionStorage
2. Validates enrollment hasn't expired (30 min TTL)
3. Checks if profile is complete
4. If complete → proceeds directly to checkout
5. If incomplete → shows profile form, then checkout
6. Clears sessionStorage after successful checkout redirect

---

## Flow 3: Guest Checkout

### Flow

```
User clicks "Enroll Now" (unauthenticated) → Modal appears →
Choose "Continue as Guest" → Profile Form → 
Submit → Create guest profile → Checkout
→ Square Payment → Return to Home
```

### Implementation

#### GuestCheckoutModal State Machine

```typescript
type Step = 'choice' | 'profile'
```

#### Step-by-Step

1. **Modal Opens** (`step='choice'`)
   - User sees "Sign In" and "Continue as Guest" buttons

2. **Guest Checkout Selected**
   ```typescript
   const handleGuestCheckout = () => {
     setStep('profile')
   }
   ```

3. **Profile Form**
   - `UnifiedProfileForm` with `mode="guest"`
   - Submits to `POST /api/members/guest` (no auth required)

4. **Profile Created**
   ```typescript
   const handleProfileCreated = (profile: MemberProfileDTO) => {
     onGuestProfileCreated(profile)  // Callback to parent
     onClose()
   }
   ```

5. **Checkout** (in `IntroClassOfferings`)
   ```typescript
   const handleGuestProfileCreated = (createdProfile: MemberProfileDTO) => {
     setShowGuestModal(false)
     proceedToCheckout(createdProfile._id)  // Uses guest checkout endpoint
   }
   ```

6. **Guest Checkout API**
   ```typescript
   // Uses /api/checkout/intro-guest (no auth)
   data = await createGuestIntroCheckout({
     catalogObjectId: selectedVariationId,
     memberProfileId,
     redirectUrl: `${globalThis.location.origin}/`,  // Returns to home
   })
   ```

### Server-Side Guest Profile Creation

```typescript
// server/src/services/memberProfileService.ts
export async function createGuestProfile(data: GuestProfileInput): Promise<MemberProfileDTO> {
  const email = data.personalInfo?.email?.toLowerCase().trim()

  // Check for existing profile with same email (no auth0Id)
  if (email) {
    const existingProfile = await memberProfileDAO.findByEmailUnlinked(email)
    if (existingProfile) {
      // Update existing profile
      const updated = await memberProfileDAO.updateById(existingProfile._id, {
        // ... update fields
        profileComplete: data.profileComplete ?? true,
      })
      if (updated) return updated
    }
  }

  // Create Square customer
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, data)

  // Create new guest profile (no auth0Id)
  return memberProfileDAO.create({
    // ... profile fields
    profileComplete: data.profileComplete ?? true,
    ...(squareCustomerId ? { squareCustomerId } : {}),
  })
}
```

---

## Square Customer ID Management

### How It Works

Square customer IDs are created/linked in the following scenarios:

#### Scenario 1: New Authenticated User (No Prior Profile)

```typescript
// server/src/services/memberProfileService.ts
export async function createProfileForUser(auth0Id: string, initialData?: {...}): Promise<MemberProfileDTO> {
  const email = initialData?.personalInfo?.email?.toLowerCase().trim()

  // 1. Check for existing unlinked profile with same email
  if (email) {
    const existingProfile = await memberProfileDAO.findByEmailUnlinked(email)
    if (existingProfile) {
      // Link auth0Id to existing profile (keeps existing squareCustomerId)
      return memberProfileDAO.linkAuth0Id(existingProfile._id, auth0Id)
    }
  }

  // 2. No existing profile - create Square customer
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, initialData)

  // 3. Create new profile with Square customer ID
  return memberProfileDAO.create({
    auth0Id,
    ...initialData,
    ...(squareCustomerId ? { squareCustomerId } : {})
  })
}
```

#### Scenario 2: Guest User (No Auth0 Account)

```typescript
// Called from POST /api/members/guest
export async function createGuestProfile(data: GuestProfileInput): Promise<MemberProfileDTO> {
  // Creates Square customer via getOrCreate
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, data)
  
  return memberProfileDAO.create({
    // No auth0Id for guests
    ...data,
    ...(squareCustomerId ? { squareCustomerId } : {})
  })
}
```

#### Scenario 3: Guest Later Signs Up

When a guest user later creates an Auth0 account:

```typescript
// GET /api/members/me - tries to link by email
router.get('/me', checkJwt, async (req, res) => {
  let profile = await memberService.getProfileByAuth0Id(auth0Id)
  
  if (!profile) {
    const email = getAuth0Email(req)
    if (email) {
      profile = await memberService.findAndLinkByEmail(auth0Id, email)
    }
  }
  
  res.json({ profile })
})
```

```typescript
// server/src/services/memberProfileService.ts
export async function findAndLinkByEmail(auth0Id: string, email: string): Promise<MemberProfileDTO | null> {
  const existingProfile = await memberProfileDAO.findByEmailUnlinked(normalizedEmail)
  if (!existingProfile) return null
  
  // Links auth0Id to existing profile (preserves squareCustomerId)
  return memberProfileDAO.linkAuth0Id(existingProfile._id, auth0Id)
}
```

### Square Customer Creation Logic

```typescript
async function createSquareCustomerIfEmailProvided(
  email: string | undefined,
  profileData?: { displayFirstName?: string; displayLastName?: string }
): Promise<string | undefined> {
  if (!email) return undefined

  try {
    // getOrCreate: finds existing by email OR creates new
    const customer = await squareCustomersService.getOrCreate({
      email,
      givenName: profileData?.displayFirstName,
      familyName: profileData?.displayLastName,
    })
    return customer?.id
  } catch {
    return undefined  // Fails silently - profile still created
  }
}
```

### Square Customer Linking Summary

| Scenario | Profile Created | Square Customer |
|----------|-----------------|-----------------|
| New authenticated user | Yes (with auth0Id) | Created via `getOrCreate` |
| Guest checkout | Yes (no auth0Id) | Created via `getOrCreate` |
| Guest later signs up | Linked (adds auth0Id) | Already exists, preserved |
| Existing Square customer | Profile linked | Found by email, ID reused |

---

## Profile Completion Logic

### Implementation

#### Client-Side: `UnifiedProfileForm`

```typescript
// client/src/components/profile/UnifiedProfileForm.tsx
function buildPayload(formData: ProfileFormData) {
  return {
    displayFirstName: formData.displayFirstName.trim(),
    displayLastName: formData.displayLastName.trim(),
    personalInfo: { ... },
    ...(formData.isMinor ? { guardian: { ... } } : {}),
    profileComplete: true,  // Always set to true on submit
  }
}
```

#### Server-Side: Profile Creation

```typescript
// server/src/routes/members.ts
router.post('/me', checkJwt, async (req, res) => {
  const body: {
    displayFirstName?: string;
    displayLastName?: string;
    personalInfo?: { email?: string };
    guardian?: { firstName?: string; lastName?: string };
    profileComplete?: boolean;
  } = req.body;

  const profile = await memberService.createProfile(auth0Id, {
    displayFirstName: body.displayFirstName,
    displayLastName: body.displayLastName,
    personalInfo: body.personalInfo,
    guardian: body.guardian,
    profileComplete: body.profileComplete,
  });
})
```

#### Server-Side: Profile Update

```typescript
// server/src/routes/members.ts
router.post('/me/update', checkJwt, async (req, res) => {
  const updated = await memberService.updateProfile(profile._id.toString(), req.body.data)
})
```

### Schema Default

```typescript
// server/src/models/MemberProfile.ts
profileComplete: { type: Boolean, default: false },
```

---

## Key Files Reference

### Client

| File | Purpose |
|------|---------|
| `client/src/pages/DashboardPage.tsx` | Dashboard with enrollment state machine |
| `client/src/pages/PendingEnrollmentPage.tsx` | Handles pending enrollment after sign-in |
| `client/src/components/intro-classes/IntroClassOfferings.tsx` | Class selection component |
| `client/src/components/checkout/GuestCheckoutModal.tsx` | Sign-in vs guest modal |
| `client/src/components/profile/UnifiedProfileForm.tsx` | Profile form (all modes) |
| `client/src/hooks/useJoinNavigation.ts` | "Join" button navigation logic |
| `client/src/context/ProfileContext.tsx` | Profile state management |
| `client/src/services/checkoutService.ts` | Checkout API calls |
| `client/src/main.tsx` | Auth0 provider with redirect callback |

### Server

| File | Purpose |
|------|---------|
| `server/src/routes/members.ts` | Member profile endpoints |
| `server/src/routes/checkout.ts` | Checkout endpoints |
| `server/src/services/memberProfileService.ts` | Profile business logic |
| `server/src/services/memberProfileDAO.ts` | Profile database operations |
| `server/src/services/square/SquareCustomersService.ts` | Square customer management |
| `server/src/models/MemberProfile.ts` | Profile schema and mapper |

### Shared

| File | Purpose |
|------|---------|
| `packages/shared/src/types/member.ts` | `MemberProfileDTO`, `GuestProfileInput` types |
| `packages/shared/src/types/checkout.ts` | `IntroClassCheckoutRequest`, `CheckoutResponse` types |


