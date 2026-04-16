# Tournament Registration Frontend - Implementation Plan

## Overview

This document outlines the frontend implementation for tournament registration in CUFC-MERN. The focus is on **streamlined online registration** - all other tournament information (rules, descriptions, rosters, pools, brackets) lives on MeyerSquared.

### Design Principles

1. **Registration-focused** - Minimal UI, just what's needed to register and pay
2. **M2 is the source of truth** - Link to M2 for all tournament details beyond registration
3. **Simple pricing** - Base fee + event fees (no discounts)
4. **Base fee exemption** - Logged-in users who already paid for a tournament don't pay again
5. **Contact CTA** - Always provide a way for fencers to ask questions

---

## CUFC-MERN Frontend Architecture

### File Structure
```
client/src/features/tournaments/
├── api/
│   └── tournamentApi.ts           # API calls to backend
├── hooks/
│   ├── useTournaments.ts          # Fetch tournament list
│   ├── useTournament.ts           # Fetch single tournament
│   ├── useClubs.ts                # Fetch clubs for dropdown
│   └── useUserRegistrations.ts    # Fetch user's registrations
├── types/
│   └── tournament.types.ts        # TypeScript interfaces
├── utils/
│   └── priceCalculation.ts        # Simple price calc (base + events)
├── components/
│   ├── TournamentCard.tsx         # Card for list view
│   ├── TournamentHeader.tsx       # Name + dates + link to M2
│   ├── ContactCTA.tsx             # "Questions? Contact us" banner
│   ├── EventSelectionForm.tsx     # Event checkboxes with capacity
│   ├── PersonalInfoForm.tsx       # Name, email, phone, club, URG checkbox
│   ├── GuardianInfoForm.tsx       # Guardian fields for minors
│   ├── PriceSummary.tsx           # Price breakdown
│   ├── DataConsentCheckbox.tsx    # GDPR consent
│   └── RegistrationForm.tsx       # Main form container
├── pages/
│   ├── TournamentListPage.tsx     # /tournaments
│   ├── TournamentDetailPage.tsx   # /tournaments/:m2TournamentId
│   └── RegistrationSuccessPage.tsx # /payment/success
└── index.ts                       # Barrel export
```

---

## API Integration

### Backend Endpoints (Already Implemented)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/tournaments` | GET | No | List all tournaments from M2 |
| `/api/tournaments/clubs` | GET | No | List all clubs from M2 |
| `/api/tournaments/:m2TournamentId` | GET | No | Tournament details with events |
| `/api/tournaments/:m2TournamentId/register` | POST | No | Submit registration |
| `/api/tournaments/:m2TournamentId/registrants` | GET | No | List registrants |
| `/api/tournaments/user/registrations` | GET | Yes | User's registrations |
| `/api/tournaments/user/profile-data` | GET | Yes | Profile data for auto-fill |

### API Response Types

```typescript
// From backend DTOs
interface TournamentDetailDto {
  m2TournamentId: number;
  name: string;
  startDate: string;
  endDate: string;
  registrationCutOff: string;
  basePriceInCents: number;
  events: EventDto[];
  // Link to M2 for full details (rules, description, rosters, etc.)
  m2Url: string;  // https://www.meyersquared.com/tournamentdetail/{m2TournamentId}
}

interface EventDto {
  m2EventId: number;
  eventName: string;
  priceInCents: number;
  date: string;
  startTime: string;
  participantsCount: number;
  // TODO: M2 needs to provide these fields
  participantsCap?: number;        // PENDING: Not yet provided by M2 API
  isAtCapacity?: boolean;          // PENDING: Derived from cap vs count
}

interface ClubDto {
  m2ClubId: number;
  name: string;
}
```

### ⚠️ Pending M2 API Enhancement

**Event Capacity:** M2 currently does not provide `participantsCap` (event registration cap) in the API response. This has been requested from M2. Once available:
- Display "X / Y registered" for each event
- Disable event checkbox when `participantsCount >= participantsCap`
- Show "Event Full" tooltip on disabled events

---

## Component Specifications

### 1. TournamentListPage

**Route:** `/tournaments`

**Features:**
- Fetch tournaments via `useTournaments` hook
- Display loading skeleton while fetching
- Separate "Upcoming" and "Past" sections
- Each tournament as a clickable card
- Link to `/tournaments/:m2TournamentId`

**Data Flow:**
```
TournamentListPage
  └── useTournaments() → GET /api/tournaments
      └── TournamentCard[] (map over results)
```

### 2. TournamentDetailPage (Registration Page)

**Route:** `/tournaments/:m2TournamentId`

**Layout (top to bottom):**
1. **TournamentHeader** - Name, dates, prominent link to M2 for full details
2. **ContactCTA** - "Questions about registration? Contact us"
3. **EventSelectionForm** - Event checkboxes with time, price, capacity
4. **PersonalInfoForm** - Name, email, phone, club, URG checkbox, minor checkbox
5. **GuardianInfoForm** - (conditional, if minor checked)
6. **PriceSummary** - Base fee + selected events = total
7. **DataConsentCheckbox** - GDPR consent
8. **Register Button**

**Data Flow:**
```
TournamentDetailPage
  ├── useTournament(m2TournamentId) → GET /api/tournaments/:id
  ├── useClubs() → GET /api/tournaments/clubs
  ├── useAuth() → check if logged in
  │   └── if logged in:
  │       ├── GET /api/tournaments/user/profile-data (auto-fill)
  │       └── GET /api/tournaments/user/registrations (base fee check)
  └── RegistrationForm
      ├── TournamentHeader (with M2 link)
      ├── ContactCTA
      ├── EventSelectionForm
      ├── PersonalInfoForm (includes URG checkbox)
      ├── GuardianInfoForm (conditional)
      ├── PriceSummary
      ├── DataConsentCheckbox
      └── Submit → POST /api/tournaments/:id/register
          └── Redirect to paymentUrl
```

### 3. RegistrationForm

**Props:**
```typescript
interface RegistrationFormProps {
  tournament: TournamentDetailDto;
  clubs: ClubDto[];
  initialData?: ProfileData;        // For auto-fill
  isBaseFeeExempt: boolean;         // User already paid for this tournament
  onSubmit: (data: RegistrationData) => Promise<void>;
  isLoading: boolean;
}
```

**State:**
```typescript
interface FormState {
  // Event selection
  selectedEvents: SelectedEvent[];
  
  // Personal info
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  clubAffiliation: ClubDto | null;
  
  // URG Alternative Qualification
  isRequestedAlternativeQualification: boolean;  // Use URG rating for higher division
  
  // Minor/Guardian
  isMinor: boolean;
  guardianFirstName: string;
  guardianLastName: string;
  
  // Consent
  dataSubmissionAgreement: boolean;
}
```

### 4. EventSelectionForm

**Features:**
- Group events by date
- Show event name, time, price
- Show capacity: "X / Y registered" (when M2 provides cap)
- Checkbox selection
- Disabled state for:
  - Registration past cutoff date
  - Event at capacity (when M2 provides cap) - show "Event Full" tooltip

**Props:**
```typescript
interface EventSelectionFormProps {
  events: EventDto[];
  selectedEvents: SelectedEvent[];
  onSelectionChange: (events: SelectedEvent[]) => void;
  registrationClosed: boolean;
}
```

**Event Card Display:**
```
┌─────────────────────────────────────────────────┐
│ [checkbox] Event Name                    10:00 AM │
│            $15.00          6 / 24 registered     │
└─────────────────────────────────────────────────┘
```

**When at capacity (future, once M2 provides cap):**
```
┌─────────────────────────────────────────────────┐
│ [disabled] Event Name                    10:00 AM │
│            $15.00    EVENT FULL (24 / 24)        │
└─────────────────────────────────────────────────┘
```

### 5. PersonalInfoForm

**Fields:**
- Preferred First Name *
- Preferred Last Name *
- Legal First Name *
- Legal Last Name *
- Email *
- Phone Number *
- Club Affiliation (autocomplete search)
- ☐ **Alternative Qualification (URG)** - "Use my URG rating as qualification for a higher division (High Confidence required. Open rating still used for seeding.)"
- ☐ **Minor** - "I am a guardian signing up on behalf of a minor (14+ years)"

**Props:**
```typescript
interface PersonalInfoFormProps {
  formData: PersonalInfoData;
  clubs: ClubDto[];
  onChange: (data: PersonalInfoData) => void;
  errors: FormErrors;
}
```

### 6. PriceSummary

**Features:**
- Show base fee (or "Waived" if exempt)
- Show each selected event with price
- Show total

**Simplified Calculation (no discounts):**
```typescript
function calculateTotal(
  basePriceInCents: number,
  selectedEvents: SelectedEvent[],
  isBaseFeeExempt: boolean
): number {
  const baseFee = isBaseFeeExempt ? 0 : basePriceInCents;
  const eventFees = selectedEvents.reduce((sum, e) => sum + e.priceInCents, 0);
  return baseFee + eventFees;
}
```

### 6. ContactCTA

**Purpose:** Always visible banner encouraging fencers to reach out with questions.

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  Questions about registration, payments, or waitlists?      │
│  Contact us at [email] or visit our Contact page            │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface ContactCTAProps {
  variant?: 'banner' | 'inline';  // banner = full width, inline = compact
}
```

### 7. TournamentHeader

**Purpose:** Minimal header with tournament name, dates, and prominent link to M2.

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Tournament Name                           │
│                   May 16 - 17, 2026                          │
│                                                              │
│  [View full details, rules, rosters on MeyerSquared →]      │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface TournamentHeaderProps {
  name: string;
  startDate: string;
  endDate: string;
  m2TournamentId: number;
}
```

---

## User Flows

### Flow 1: Guest Registration

```
1. User visits /tournaments
2. Clicks on a tournament card
3. Sees minimal registration page:
   - Tournament name + dates
   - Link to M2 for full details
   - Contact CTA for questions
   - Event selection
   - Personal info form (with URG checkbox)
   - Price summary
4. Selects events
5. Fills out personal information
6. If minor: fills guardian information (verify age over 16)
7. Accepts data submission consent
8. Clicks "Register"
9. Backend creates registrant record (isPaid: false)
10. Backend creates Square payment link
11. User redirected to Square checkout
12. User pays
13. Square webhook → backend finalizes registration
14. User redirected to M2 tournament page
```

### Flow 2: Logged-in User Registration

```
1. User logs in
2. Visits /tournaments
3. Clicks on a tournament card
4. Form auto-fills from profile data
5. If user already has paid registration for this tournament:
   - Base fee shows as "Waived - already registered"
   - Only event fees charged
6. User completes form and pays
7. Registration linked to user account
```

### Flow 3: User Views Registration History

```
1. User logs in
2. Visits /profile or /my-registrations
3. Sees list of past registrations
4. Each shows: tournament name, events, payment status, date
```

---

## Implementation Phases

### Phase 1: Core Components
- [ ] Create `client/src/features/tournaments/` directory structure
- [ ] Define TypeScript types in `tournament.types.ts`
- [ ] Create API functions in `tournamentApi.ts`
- [ ] Create custom hooks: `useTournaments`, `useTournament`, `useClubs`

### Phase 2: Tournament List
- [ ] Create `TournamentCard` component
- [ ] Create `TournamentListPage` with upcoming/past sections
- [ ] Add route `/tournaments`
- [ ] Style with existing design system (Navy hero, white cards)

### Phase 3: Tournament Detail & Registration
- [ ] Create `TournamentHeader` component
- [ ] Create `TournamentDetails` component (location, resources)
- [ ] Create `EventSelectionForm` component
- [ ] Create `PersonalInfoForm` component
- [ ] Create `GuardianInfoForm` component
- [ ] Create `PriceSummary` component
- [ ] Create `DataConsentCheckbox` component
- [ ] Create `RegistrationForm` container
- [ ] Create `TournamentDetailPage`
- [ ] Add route `/tournaments/:m2TournamentId`

### Phase 4: User Features
- [ ] Create `useUserRegistrations` hook
- [ ] Add profile data auto-fill
- [ ] Add base fee exemption logic
- [ ] Create registration history view

### Phase 5: Payment Flow
- [ ] ~~Create `RegistrationSuccessPage`~~ **Not needed** - redirect to M2 tournament page
- [ ] Configure Square payment link to redirect to M2 tournament page after payment
- [ ] M2 URL format: `https://www.meyersquared.com/tournamentdetail/{m2TournamentId}`

### Phase 6: Polish
- [ ] Add loading states and skeletons
- [ ] Add error handling and error boundaries
- [ ] Add form validation with error messages
- [ ] Test responsive design
- [ ] Add accessibility attributes

---

## Key Differences from cufc-web

| Feature | cufc-web | CUFC-MERN |
|---------|----------|-----------|
| Data source | Local MongoDB | M2 API via backend |
| Tournament details | Displayed locally | Link to M2 |
| Discount rules | Complex (QUANTITY, COMBINATION, PACKAGE, MEMBER) | **None** |
| CUFC member checkbox | Yes (for discounts) | **Removed** |
| Base fee exemption | None | Yes (logged-in users) |
| User accounts | None | Optional (Auth0) |
| Form auto-fill | None | From MemberProfile |
| Registration history | None | Yes |
| Event capacity | Tracked locally | **Pending M2 API** |
| URG Alternative Qualification | Yes | Yes (preserved) |

---

## Styling Guidelines

Follow existing CUFC-MERN design patterns:

1. **Hero sections:** Navy blue background, white text
2. **Content containers:** White with rounded corners, subtle shadow
3. **Cards:** Hover effects with translate and shadow
4. **Forms:** 
   - Labels above inputs
   - Red border for errors
   - Error messages in red-50 background
5. **Buttons:**
   - Primary: `bg-DeepRed hover:bg-red-700`
   - Secondary: `bg-Navy hover:bg-blue-800`
6. **Colors:** Use Tailwind custom colors (Navy, DeepRed, MediumPink, etc.)

---

## Dashboard & MemberProfile Compatibility

### Existing Dashboard Structure (`/dashboard`)

The current dashboard (`DashboardPage.tsx`) has these sections:
1. **DashboardHeaderCard** - Profile image, name, "View Profile" button
2. **Class Enrollment** - Intro course enrollment or subscription card
3. **My Tools** - Drop In payment, My Payments, My Attendance
4. **Last Check-in** - Most recent attendance check-in

### MemberProfileDTO Fields (from `@cufc/shared`)

```typescript
type MemberProfileDTO = {
  _id: string;
  auth0Id?: string;
  displayFirstName?: string;
  displayLastName?: string;
  personalInfo?: {
    legalFirstName?: string;
    legalLastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: Address;
  };
  guardian?: Guardian;
  profileComplete?: boolean;
  memberStatus?: MemberStatus;
  // ... other fields
}
```

### ✅ Compatibility Analysis

**Good news:** The existing `MemberProfileDTO` already has all fields needed for tournament registration auto-fill:

| Tournament Form Field | MemberProfile Field | Status |
|----------------------|---------------------|--------|
| Preferred First Name | `displayFirstName` | ✅ Available |
| Preferred Last Name | `displayLastName` | ✅ Available |
| Legal First Name | `personalInfo.legalFirstName` | ✅ Available |
| Legal Last Name | `personalInfo.legalLastName` | ✅ Available |
| Email | `personalInfo.email` | ✅ Available |
| Phone | `personalInfo.phone` | ✅ Available |
| Guardian First Name | `guardian.firstName` | ✅ Available |
| Guardian Last Name | `guardian.lastName` | ✅ Available |

**No changes needed to MemberProfile** - we can use the existing `useMemberProfile()` hook and `ProfileContext` for auto-fill.

### Tournament Registration History Integration

**Option A: Add to existing Dashboard** (Recommended)
- Add a new "My Tournament Registrations" section to the dashboard
- Create `DashboardTournamentCard` component
- Fetch via new `useUserRegistrations` hook

**Option B: Separate page**
- Create `/dashboard/tournaments` route
- Add link in "My Tools" section

### Proposed Dashboard Addition

```
Dashboard Layout (updated):
├── DashboardHeaderCard
├── Class Enrollment (existing)
├── My Tournament Registrations (NEW)
│   └── DashboardTournamentCard[] - shows upcoming registrations
├── My Tools (existing)
└── Last Check-in (existing)
```

### Auto-fill Implementation

```typescript
// In TournamentDetailPage or RegistrationForm
const { profile } = useMemberProfile();

// Map profile to form initial values
const initialFormData = profile ? {
  preferredFirstName: profile.displayFirstName || '',
  preferredLastName: profile.displayLastName || '',
  legalFirstName: profile.personalInfo?.legalFirstName || '',
  legalLastName: profile.personalInfo?.legalLastName || '',
  email: profile.personalInfo?.email || '',
  phoneNumber: profile.personalInfo?.phone || '',
  isMinor: !!profile.guardian,
  guardianFirstName: profile.guardian?.firstName || '',
  guardianLastName: profile.guardian?.lastName || '',
} : EMPTY_FORM_DATA;
```

### ⚠️ Missing: Club Affiliation

The `MemberProfileDTO` does **not** have a `clubAffiliation` field. Options:
1. **Don't auto-fill club** - User selects each time (simplest)
2. **Add to MemberProfile** - Store preferred club in profile (requires schema change)
3. **Remember last used** - Store in localStorage (quick but not synced)

**Recommendation:** Option 1 for MVP - club selection is quick with autocomplete.

---

## Testing Checklist

- [ ] Tournament list loads and displays correctly
- [ ] Tournament detail page shows M2 link prominently
- [ ] Contact CTA is visible
- [ ] Event selection works (select/deselect)
- [ ] Event capacity disables full events (when M2 provides cap)
- [ ] URG alternative qualification checkbox works
- [ ] Form validation prevents invalid submissions
- [ ] Price calculation is correct (base + events, no discounts)
- [ ] Registration submission creates payment link
- [ ] Square redirect works
- [ ] User redirected to M2 tournament page after payment
- [ ] Logged-in user sees auto-filled data from MemberProfile
- [ ] Base fee exemption works for returning registrants
- [ ] Registration history displays on dashboard
- [ ] Mobile responsive design works
- [ ] Error states display correctly
