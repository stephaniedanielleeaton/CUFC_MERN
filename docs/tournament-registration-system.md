# Tournament Registration System - Migration Documentation

## Overview

This document outlines the legacy tournament registration system (CUFC-web/CUFC-Node) in Part 1, and the actual, currently-implemented architecture in CUFC-MERN in Part 2 onward. The new system uses MeyerSquared (M2) as the source of truth for tournament/event data while maintaining local registrant records for **data integrity and audit purposes**.

### Key Design Decisions
- **M2 provides prices** (in cents) - no local price overrides
- **M2 provides registration cutoff** - uses `RegistrationCutOff` field
- **No discount rules** - out of scope
- **Interface-based M2 service** - live implementation + stub for testing/development
- **Local data retention** - store enough info to answer "what did they pay for?" and retry failed M2 syncs
- **18+ only** - no minors may register for or attend events; date of birth is verified on every registration (see "Age Verification" below)

---

## Part 1: Legacy System (CUFC-web + CUFC-Node)

### Architecture Summary

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CUFC-web      │────▶│   CUFC-Node     │────▶│   MongoDB       │
│   (React)       │     │   (Express)     │     │   (Tournaments) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Square  │ │   M2     │ │  Email   │
              │  API     │ │  API     │ │  Service │
              └──────────┘ └──────────┘ └──────────┘
```

### Legacy Data Model (MongoDB - Nested Arrays)

```javascript
// Tournament Schema (cufc-node/models/mongodb/Tournament.js)
{
  name: String,
  meyerSquaredTournamentId: String,  // Links to M2
  description: String,
  startDate: Date,
  endDate: Date,
  registrationCloseDate: Date,
  basePrice: Number,
  location: String,
  bannerImage: String,
  mutuallyExclusiveEventGroups: [[String]],  // Event IDs that can't be selected together
  events: [{  // NESTED ARRAY
    name: String,
    meyerSquaredEventId: Number,
    description: String,
    startTime: Date,
    registrationCap: Number,
    price: Number,
    registrants: [{  // DEEPLY NESTED - problematic for queries
      preferredFirstName: String,
      preferredLastName: String,
      legalFirstName: String,
      legalLastName: String,
      email: String,
      phoneNumber: String,
      clubAffiliation: {
        meyerSquaredClubId: Number,
        name: String
      },
      guardianFirstName: String,
      guardianLastName: String,
      paymentId: String,
      isPaid: Boolean,
      isRequestedAlternativeQualification: Boolean
    }]
  }]
}
```

### Legacy Registration Flow

#### Step 1: User Fills Out Registration Form
- **Frontend**: `TournamentRegistrationView.tsx` + `TournamentRegistration.tsx`
- User selects events, enters personal info, club affiliation
- Price calculated client-side via `calculatePrice.ts`
- Discount rules evaluated (QUANTITY, COMBINATION, PACKAGE, MEMBER)

#### Step 2: Submit Registration (Pre-Payment)
```
POST /api/tournaments/:tournamentId/register
```
- **Service**: `tournamentInitialRegistrationService.js`
- Generates unique `paymentId`: `{tournamentId.slice(-4)}-{timestamp}-{random}`
- Creates registrant data object, nested in tournament document
- Sends registration confirmation email
- Returns `paymentId` to frontend

#### Step 3: Create Square Payment Link
```
POST /api/square/createPaymentLink
```
- **Service**: `squareService.js`
- Creates Square Checkout payment link with line item, amount, metadata, redirect URL
- User redirected to Square checkout

#### Step 4: Square Webhook Receives Payment Confirmation
```
POST /api/square/webhook
```
- **Service**: `squareWebhookService.js`
- Verifies webhook signature using `WebhooksHelper.isValidWebhookEventSignature`
- Handles `payment.updated` or `checkout.completed` events
- Extracts `payment_id` and `tournament_id` from order metadata

#### Step 5: Finalize Registration
- **Service**: `tournamentRegistrationFinalizationService.js`
- Updates `isPaid: true` for all registrants with matching `paymentId`
- For each paid registrant, posts to M2 via `addPersonFromThirdParty`

### Legacy Issues (Motivation for Rewrite)

1. **Nested Array Structure**: Registrants nested inside events inside tournaments made queries complex
2. **No User Accounts**: Registrants had to re-enter info for each tournament
3. **No Registration History**: Users couldn't see their past registrations
4. **Duplicate Base Fee**: Users paid the base fee even when adding events to an existing registration
5. **Manual Tournament Creation**: Admin had to manually create tournaments and link M2 IDs
6. **No Catalog Items**: Couldn't add merchandise to registration

---

## Part 2: CUFC-MERN Implementation (Current)

> Everything below describes the actual code in `server/src/features/tournament/` and
> `client/src/features/tournaments/` as it exists today - not a future plan. If you change
> the implementation, please update this section. This document previously drifted badly
> (stale `.js` file names, a nonexistent Redis lock, guardian/minor fields that were since
> removed) - keep it honest.

### Design Principles

1. **M2 as source of truth, no local caching**: Tournament/event data is fetched live from the M2 public API on every request - there's no local tournament data store beyond `Tournament` (audit stub) and `TournamentVisibility` (admin toggle)
2. **Flat data model**: Separate `Tournament`, `TournamentVisibility`, and `Registrant` collections - no nested arrays
3. **No account required**: Anyone can register for a tournament as a guest. Signing in only pre-fills the form from the member's profile and enables registration history / base-fee exemption
4. **Square Checkout Payment Links**: Registration charges go through `client.checkout.paymentLinks.create()` with a single combined line item (not the itemized Orders API that was originally planned)
5. **Base fee logic**: A signed-in user who already has a paid registration for a tournament isn't charged the base fee again
6. **No minors**: Participants must be 18+. Date of birth is collected and validated on every registration submission, both client- and server-side, but is **not persisted** (see "Age Verification")
7. **Admin-controlled visibility**: Tournaments pulled from M2 are hidden from the public list by default; an admin must explicitly enable each one (`TournamentVisibility`)

### M2 Public API Integration

#### Get Club Tournaments
```
GET https://www.meyersquared.com/api/v1/tournament/public/club/10
```
Returns list of tournaments assigned to CUFC (ClubId: 10).

#### Get Tournament Details
```
GET https://www.meyersquared.com/api/v1/tournament/public/{tournamentId}
```
Returns full tournament data including events (trimmed example):
```json
{
  "TournamentId": 150,
  "Name": "Looking Sharpe 2026",
  "StartDate": "2026-05-16",
  "EndDate": "2026-05-16",
  "RegistrationCutOff": "2026-05-15",
  "Description": "<p>HTML description...</p>",
  "BasePrice": 2500,
  "TotalParticipants": 19,
  "Events": [
    {
      "EventId": 200,
      "EventName": "Marginalized Genders Single Rapier",
      "EventPrice": 1500,
      "Date": "2026-05-16",
      "StartTime": "12:00:00",
      "ParticipantsCount": 6,
      "Weapon": { "Name": "MG Single Rapier" }
    }
  ],
  "Club": { "Name": "Columbus United Fencing Club", "ClubId": 10 },
  "Address": {
    "Name": "Columbus United Fencing Club",
    "City": "Reynoldsburg",
    "State": "OH",
    "Address1": "6475 E Main St Suite #111",
    "Zip": 43068
  }
}
```
The server maps this to `TournamentDetailDto` / `EventDto` (see `server/src/features/tournament/dto/EventDto.ts`), converting prices to `priceInCents` and flattening the address.

### Data Models (MongoDB)

#### `Tournament` (`models/Tournament.ts`) - audit stub only
Created on-demand (via `TournamentDAO.findOrCreate`) the first time someone registers for a given M2 tournament. It exists so `Registrant` documents have a stable local `tournamentId` to reference, and so `m2TournamentId`/`name` survive even if M2 is temporarily unreachable.
```typescript
interface ITournament {
  _id: ObjectId;
  m2TournamentId: number;
  name: string;
  isActive?: boolean;   // legacy field - not currently used to gate anything; see TournamentVisibility below
  createdAt: Date;
  updatedAt: Date;
}
```

#### `TournamentVisibility` (`models/TournamentVisibility.ts`) - admin toggle
This is what actually controls whether a tournament pulled from M2 shows up on the public tournament list. Every M2 tournament is hidden until an admin flips it on via `PATCH /api/tournaments/admin/:m2TournamentId/toggle`.
```typescript
interface ITournamentVisibility {
  _id: ObjectId;
  m2TournamentId: number;
  name: string;
  isEnabled: boolean;
  enabledAt?: Date;
  enabledBy?: string;    // auth0Id of the admin who enabled it
  createdAt: Date;
  updatedAt: Date;
}
```

#### `Registrant` (`models/Registrant.ts`) - the audit record
Stores everything needed to answer "what did this person pay for?" and to manually add someone to M2 if the automatic post fails.
```typescript
interface IRegistrant {
  _id: ObjectId;
  tournamentId: ObjectId;         // local Tournament reference
  m2TournamentId: number;
  tournamentName: string;         // snapshot at registration time
  selectedEvents: {
    m2EventId: number;
    eventName: string;            // snapshot
    priceInCents: number;         // snapshot, from M2 at registration time
  }[];
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber?: string;
  clubAffiliation?: { m2ClubId: number; name: string };
  paymentId: string;               // internal payment reference, unique
  squareOrderId?: string;
  isPaid: boolean;
  paidAt?: Date;
  amountPaidInCents?: number;
  baseFeeChargedInCents?: number;  // 0 if exempt (already paid base fee for this tournament)
  m2Posted: boolean;
  m2PostedAt?: Date;
  userId?: ObjectId;               // MemberProfile reference, if signed in
  auth0Id?: string;
  isRequestedAlternativeQualification: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
**Note:** `isMinor` / `guardianFirstName` / `guardianLastName` fields have been removed - minors are no longer permitted to register at all (see "Age Verification"). `dateOfBirth` is **not** stored on this record; it's validated at submission time and discarded.

### Age Verification

Participants must be 18+. There is no account requirement for tournament registration, so this can't be gated purely on a logged-in member's profile - date of birth is collected directly on the registration form for everyone (guest or signed-in), pre-filled from the member profile when available.

- **Client** (`client/src/features/tournaments/components/RegistrationForm.tsx`): collects `dateOfBirth`, blocks submit via `isAtLeastMinimumAge()` from `@cufc/shared` if under 18
- **Server** (`RegistrationService.processRegistration()` → `validateMinimumAge()`): re-validates `request.dateOfBirth` and throws a `RegistrationError(400)` if missing, invalid, or under 18 - this is the actual enforcement point, since the client check can be bypassed by calling the API directly
- **Shared util** (`packages/shared/src/utils/age.ts`): `calculateAge()`, `isAtLeastMinimumAge()`, `MINIMUM_MEMBER_AGE = 18` - single source of truth, also used by `UnifiedProfileForm.tsx` for member-profile age validation
- Date of birth is **not persisted** to the `Registrant` record (deliberate choice to avoid storing extra PII with no current audit requirement for it)

### M2 Service Interface (Dependency Injection)

`server/src/features/tournament/services/meyerSquared/`:
- `IM2Service.ts` - interface: `getClubTournaments()`, `getTournament(m2TournamentId)`, `getAllClubs()`, `addPersonToEvent(eventId, person)`
- `M2ServiceLive.ts` - calls the real M2 public API
- `M2ServiceStub.ts` - in-memory stub for local dev/testing
- `index.ts` - factory (`getM2Service()`) that returns the stub when `NODE_ENV === 'test'` or `USE_M2_STUB=true`, otherwise the live service; singleton, with `setM2Service()` for test injection

`TournamentService` and `RegistrationService` depend only on `IM2Service`, not on a concrete implementation.

### Square Integration

`server/src/features/tournament/services/TournamentSquareService.ts` wraps the Square SDK (`square` npm package):

- `createOrderWithPaymentLink()` - calls `client.checkout.paymentLinks.create()` with **one combined line item** (`"{tournamentName} - {eventNames}"` for the total of base fee + all selected event prices) and metadata `{ payment_id, m2_tournament_id, registrant_id }`. Redirects to the tournament's M2 page on completion.
- `getOrderMetadata(orderId)` - reads that metadata back off a Square order (used by the webhook handler)
- `getOrderTotal(orderId)` - reads the order's total paid amount (used to record `amountPaidInCents`)

This differs from the original plan, which called for the itemized Orders API (separate line items per event). The current implementation uses a single line item for simplicity; itemization could be added later without changing the public API shape.

### Registration Flow (as implemented)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Event   │───▶│  Age +   │───▶│  Create  │───▶│  Square  │───▶│  Webhook │
│  Landing │    │  Form    │    │Registrant│    │ Checkout │    │ Received │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. **Event landing** (`TournamentDetailPage.tsx`): fetches tournament + events live from M2 (`GET /api/tournaments/:m2TournamentId`), lets the user pick events (`EventSelection.tsx`), shows whether they're exempt from the base fee (`GET /api/tournaments/user/has-registration/:m2TournamentId`, signed-in only)
2. **Profile step** (signed-in only, if `profile.profileComplete` is false): `UnifiedProfileForm` in `mode="authenticated"`
3. **Registration form** (`RegistrationForm.tsx`): legal name, optional display name, email, phone, date of birth, club affiliation, data-submission consent. Pre-filled from the member profile if signed in and complete
4. **Submit** → `POST /api/tournaments/:m2TournamentId/register`:
   - `RegistrationService.processRegistration()`:
     - Re-fetches the tournament from M2, validates selected events aren't at capacity (`validateEventCapacity`)
     - Validates age 18+ (`validateMinimumAge`)
     - If signed in, resolves `userId` and whether they already have a paid registration for this tournament (`hasExistingPaidRegistration` - checked by `userId`, `auth0Id`, and `email`, in that order) to decide whether to charge the base fee
     - Creates (or reuses) the local `Tournament` stub, generates a `paymentId`, creates the `Registrant` record with `isPaid: false`
     - Calls `TournamentSquareService.createOrderWithPaymentLink()` and returns `{ registrantId, paymentId, paymentUrl }`
5. **Frontend redirects** the browser to `paymentUrl` (Square-hosted checkout)
6. **Square webhook** → `POST /api/square/webhook` (mounted once for the whole app, shared with intro-class checkout; see `squareWebhookRoutes.ts`):
   - Verifies the HMAC signature
   - Only acts on `payment.updated` events with `status: 'COMPLETED'`
   - Fetches the full payment (for `customerId`) via `SquarePaymentsService`
   - Tries `introClassEnrollmentService.handlePaymentCompleted()` first (shared webhook endpoint), then tries tournament handling: `TournamentSquareService.getOrderMetadata(orderId)` → `getOrderTotal(orderId)` → `RegistrationService.finalizePayment(paymentId, orderId, amountPaidInCents)`
   - `finalizePayment` atomically marks the registrant paid via `RegistrantDAO.markPaidIfNotAlready()` (`findOneAndUpdate` with `isPaid: { $ne: true }` as the guard) - **this, not a Redis lock, is the duplicate-webhook idempotency mechanism**. If the registrant was already paid, it's a no-op
   - On first successful payment: posts the registrant to M2 for each selected event (`postToM2`), adds their email to the tournament's `EmailList` (`tournament-{m2TournamentId}`), and sends a registration alert email to `EMAIL_ACCOUNT`
   - If the M2 post fails: `m2Posted` is set to `false` and a failure alert is logged (currently via `console.error`, not an actual email - see `sendM2FailureAlert`); there's no automatic retry, an admin must manually add the person to M2 using the stored `Registrant` data

### User Features

#### Profile auto-fill
If signed in, `RegistrationForm` pre-fills legal name, email, phone, and date of birth from the member's `MemberProfile` (`profile.personalInfo`). This is a direct read of the existing profile - there's no separate "tournament profile" sub-document on any user model.

#### Registration history
```
GET /api/tournaments/user/registrations   (requires auth)
```
→ `RegistrationService.getRegistrantsByUser(auth0Id)` → `RegistrantDAO.findByAuth0Id()` (only paid registrations).

#### Base fee exemption
```
GET /api/tournaments/user/has-registration/:m2TournamentId   (requires auth)
```
Returns `{ hasRegistration: boolean }`. `EventSelection` accepts a `skipBaseFee` prop; when true, the base fee line item is hidden from the price breakdown and excluded from the total.

### API Endpoints (actual)

All mounted under `/api/tournaments` except the webhook, which is mounted at `/api/square/webhook` (shared with intro-class checkout - see `server/src/index.ts`).

#### Public
- `GET /api/tournaments` - enabled tournaments from M2 (filtered by `TournamentVisibility`)
- `GET /api/tournaments/clubs` - clubs from M2
- `GET /api/tournaments/:m2TournamentId` - tournament details from M2
- `GET /api/tournaments/:m2TournamentId/registrants` - paid registrants for a tournament (no admin gate currently - see note below)
- `POST /api/tournaments/:m2TournamentId/register` - submit registration (`checkJwtOptional` - works with or without a token)
- `POST /api/square/webhook` - Square webhook handler (shared across tournament + intro-class payments)

#### Authenticated (`checkJwt`)
- `GET /api/tournaments/user/registrations` - current user's paid registrations
- `GET /api/tournaments/user/has-registration/:m2TournamentId` - base-fee exemption check
- `GET /api/tournaments/user/profile-data` - profile fields for form auto-fill (legal name, email, phone)

#### Admin (`checkJwt` + `requireRole('club-admin')`)
- `GET /api/tournaments/admin/all` - all M2 tournaments with their current `isEnabled` status
- `PATCH /api/tournaments/admin/:m2TournamentId/toggle` - enable/disable public visibility for a tournament

> **Note:** `GET /:m2TournamentId/registrants` has no role check in the current code - it's wide open. This was flagged as "admin only in future" in earlier planning and was never locked down. Worth fixing if registrant PII (name/email/phone) shouldn't be publicly fetchable by tournament ID.

### Environment Variables (actual)

```env
# MeyerSquared
USE_M2_STUB=true|false     # when true (or NODE_ENV=test), uses M2ServiceStub instead of calling the real M2 API

# Square (shared with the rest of the app, not tournament-specific)
SQUARE_ACCESS_TOKEN=xxx
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_RETAIL_LOCATION_ID=xxx
SQUARE_SIGNATURE_KEY=xxx

# Email alerts
EMAIL_ACCOUNT=xxx           # registration alerts are skipped (with a warning log) if unset
```
See `server/src/config/env.ts` for the full/authoritative list across the app.

---

## Part 3: File Structure & Dependencies

### File Structure (Vertical Slice)

```
server/src/features/tournament/          # Self-contained feature slice
├── models/
│   ├── Tournament.ts                    # audit stub
│   ├── TournamentVisibility.ts          # admin show/hide toggle
│   └── Registrant.ts                    # audit record + DTO mappers
├── dao/
│   ├── TournamentDAO.ts
│   └── RegistrantDAO.ts
├── services/
│   ├── meyerSquared/
│   │   ├── IM2Service.ts
│   │   ├── M2ServiceLive.ts
│   │   ├── M2ServiceStub.ts
│   │   ├── m2Types.ts
│   │   └── index.ts                     # factory + singleton
│   ├── TournamentService.ts
│   ├── RegistrationService.ts
│   └── TournamentSquareService.ts
├── routes/
│   ├── tournamentRoutes.ts
│   └── squareWebhookRoutes.ts
├── dto/
│   ├── TournamentDto.ts / EventDto.ts / ClubDto.ts / RegistrantDto.ts / RegistrationDto.ts
│   └── index.ts
└── index.ts                             # feature barrel export

client/src/features/tournaments/
├── api/tournamentApi.ts
├── components/EventSelection.tsx, RegistrationForm.tsx
├── hooks/useTournament.ts, useTournaments.ts, useRegistration.ts, useUserRegistrations.ts, useClubs.ts
├── pages/TournamentListPage.tsx, TournamentDetailPage.tsx
└── types/tournament.types.ts
```

**Integration points with existing (non-tournament) code:**
- `memberProfileService` - read-only, for form auto-fill and registrant/userId lookup
- `middleware/auth.ts` - `checkJwt`, `checkJwtOptional`, `getAuth0Id`, `getAuth0Email`, `requireRole`
- `models/EmailList` - written to, to build `tournament-{m2TournamentId}` mailing lists
- `services/emailService` - used to send registration alert emails
- `services/square/SquarePaymentsService` - used by the shared webhook handler to resolve `customerId`
- `services/introClassEnrollmentService` - the webhook handler tries this first, since the webhook route is shared between tournament and intro-class payments

### Dependency Graph

```
            tournamentRoutes / squareWebhookRoutes
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
TournamentService  RegistrationService  TournamentSquareService
        │                 │                 │
        ▼           ┌─────┴─────┐           ▼
   IM2Service        │           │      Square SDK
  (interface)         ▼           ▼
        │        TournamentDAO  RegistrantDAO
   ┌────┴────┐        │            │
   ▼         ▼        ▼            ▼
M2ServiceLive  M2ServiceStub   Tournament      Registrant
                                 Model            Model
```

### Registration Sequence (happy path)

```
User          Frontend         tournamentRoutes      RegistrationService     Square
 │               │                    │                       │                 │
 │  Fill form    │                    │                       │                 │
 │──────────────▶│  POST /:id/register│                       │                 │
 │               │───────────────────▶│  processRegistration()│                 │
 │               │                    │──────────────────────▶│                 │
 │               │                    │   validateEventCapacity + validateMinimumAge
 │               │                    │   create Registrant (isPaid=false)      │
 │               │                    │   createOrderWithPaymentLink() ─────────▶│
 │               │                    │◀─────────────────────── paymentUrl ──────│
 │               │◀───────────────────│  { registrantId, paymentId, paymentUrl }│
 │◀──────────────│  redirect to paymentUrl                     │                 │
 │                                                              │                 │
 │  Pays on Square ──────────────────────────────────────────────────────────────▶│
 │                                                              │   webhook       │
 │               │              squareWebhookRoutes ◀──────────────(payment.updated)
 │               │                    │  finalizePayment(paymentId, orderId, amount)
 │               │                    │   markPaidIfNotAlready() (atomic, idempotent)
 │               │                    │   postToM2() + addToTournamentEmailList() + alert email
 │               │                    │  200 OK (always, even on internal failure - avoids Square retries)
```

---

## Appendix: File References

### Legacy System (CUFC-web + CUFC-Node)

| Component | File Path |
|-----------|-----------|
| Tournament Model | `cufc-node/models/mongodb/Tournament.js` |
| Tournament DAO | `cufc-node/daos/mongodb/tournamentDao.js` |
| Tournament Routes | `cufc-node/routes/tournamentRoutes.js` |
| Initial Registration Service | `cufc-node/services/tournamentInitialRegistrationService.js` |
| Finalization Service | `cufc-node/services/tournamentRegistrationFinalizationService.js` |
| Square Service | `cufc-node/services/squareService.js` |
| Square Webhook Service | `cufc-node/services/squareWebhookService.js` |
| M2 Service | `cufc-node/services/meyerSquaredService.js` |
| Square Routes | `cufc-node/routes/squareAPIRoutes.js` |
| Registration View | `cufc-web/src/views/tournaments/TournamentRegistrationView.tsx` |
| Registration Form | `cufc-web/src/views/tournaments/TournamentRegistration.tsx` |
| Price Calculator | `cufc-web/src/views/tournaments/utils/calculatePrice.ts` |
| Types | `cufc-web/src/views/tournaments/types/types.ts` |

### Current System (CUFC-MERN)

| Component | Actual Path |
|-----------|-------------|
| Tournament Model | `server/src/features/tournament/models/Tournament.ts` |
| Tournament Visibility Model | `server/src/features/tournament/models/TournamentVisibility.ts` |
| Registrant Model | `server/src/features/tournament/models/Registrant.ts` |
| Tournament DAO | `server/src/features/tournament/dao/TournamentDAO.ts` |
| Registrant DAO | `server/src/features/tournament/dao/RegistrantDAO.ts` |
| M2 Service Interface | `server/src/features/tournament/services/meyerSquared/IM2Service.ts` |
| M2 Live Service | `server/src/features/tournament/services/meyerSquared/M2ServiceLive.ts` |
| M2 Stub Service | `server/src/features/tournament/services/meyerSquared/M2ServiceStub.ts` |
| M2 Factory | `server/src/features/tournament/services/meyerSquared/index.ts` |
| Tournament Service | `server/src/features/tournament/services/TournamentService.ts` |
| Registration Service | `server/src/features/tournament/services/RegistrationService.ts` |
| Square Service | `server/src/features/tournament/services/TournamentSquareService.ts` |
| Tournament Routes | `server/src/features/tournament/routes/tournamentRoutes.ts` |
| Square Webhook Routes | `server/src/features/tournament/routes/squareWebhookRoutes.ts` (mounted at `/api/square/webhook`) |
| Registration DTOs | `server/src/features/tournament/dto/` |
| Shared age-validation util | `packages/shared/src/utils/age.ts` |
| EventSelection | `client/src/features/tournaments/components/EventSelection.tsx` |
| RegistrationForm | `client/src/features/tournaments/components/RegistrationForm.tsx` |
| TournamentDetailPage | `client/src/features/tournaments/pages/TournamentDetailPage.tsx` |
| Tournament API client | `client/src/features/tournaments/api/tournamentApi.ts` |
| Registration Hook | `client/src/features/tournaments/hooks/useRegistration.ts` |
| Tournament Hook | `client/src/features/tournaments/hooks/useTournament.ts` |
