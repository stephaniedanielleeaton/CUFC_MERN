# Tournament Registration System - Migration Documentation

## Overview

This document outlines the existing tournament registration system in CUFC-web/CUFC-Node and the planned architecture for CUFC-MERN. The new system will use MeyerSquared (M2) as the source of truth for tournament/event data while maintaining local registrant records for **data integrity and audit purposes**.

### Key Design Decisions
- **M2 provides prices** (in cents) - no local price overrides needed
- **M2 provides registration cutoff** - use `RegistrationCutOff` field
- **No discount rules** - removed from scope
- **Interface-based M2 service** - live implementation + stub for testing/development
- **Local data retention** - store enough info to answer "what did they pay for?" and retry failed M2 syncs

---

## Part 1: Existing System (CUFC-web + CUFC-Node)

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

### Current Data Model (MongoDB - Nested Arrays)

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
  events: [{  // NESTED ARRAY - This is what we want to avoid in MERN
    name: String,
    meyerSquaredEventId: Number,
    description: String,
    startTime: Date,
    registrationCap: Number,
    price: Number,
    registrants: [{  // DEEPLY NESTED - Problematic for queries
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

### Current Registration Flow

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
- Creates registrant data object
- Adds registrant to each selected event (nested in tournament document)
- Sends registration confirmation email
- Returns `paymentId` to frontend

#### Step 3: Create Square Payment Link
```
POST /api/square/createPaymentLink
```
- **Service**: `squareService.js`
- Creates Square Checkout payment link with:
  - Line item: `{tournamentName} Registration - {eventNames}`
  - Amount: Final calculated price
  - Metadata: `{ payment_id, tournament_id }`
  - Redirect URL: `/payment/success?tournamentId=...&paymentId=...`
- User redirected to Square checkout

#### Step 4: Square Webhook Receives Payment Confirmation
```
POST /api/square/webhook
```
- **Service**: `squareWebhookService.js`
- Verifies webhook signature using `WebhooksHelper.isValidWebhookEventSignature`
- Handles `payment.updated` or `checkout.completed` events
- Extracts `payment_id` and `tournament_id` from order metadata
- Uses Redis lock to prevent duplicate processing (Square sends multiple webhooks)

#### Step 5: Finalize Registration
- **Service**: `tournamentRegistrationFinalizationService.js`
- Updates `isPaid: true` for all registrants with matching `paymentId`
- For each paid registrant, posts to M2:
  ```
  POST /api/v1/event/{eventId}/addPersonFromThirdParty
  {
    Email: string,
    DisplayName: string,
    FirstName: string,
    LastName: string,
    ClubId: number
  }
  ```

### Current Issues/Limitations

1. **Nested Array Structure**: Registrants nested inside events inside tournaments makes queries complex
2. **No User Accounts**: Registrants must re-enter info for each tournament
3. **No Registration History**: Users can't see their past registrations
4. **Duplicate Base Fee**: Users pay base fee even when adding events to existing registration
5. **Manual Tournament Creation**: Admin must manually create tournaments and link M2 IDs
6. **No Catalog Items**: Can't add merchandise (t-shirts, etc.) to registration

---

## Part 2: CUFC-MERN New Architecture

### Design Principles

1. **M2 as Source of Truth**: Pull tournament/event data from M2 public API
2. **Flat Data Model**: Separate collections for tournaments and registrants
3. **User Accounts**: Optional login for form auto-fill and registration history
4. **Square Orders API**: Support custom charges AND catalog items
5. **Base Fee Logic**: Logged-in users don't pay base fee twice for same tournament

### M2 Public API Integration

#### Get Club Tournaments
```
GET https://www.meyersquared.com/api/v1/tournament/public/club/10
```
Returns list of tournaments assigned to CUFC (ClubId: 10)

#### Get Tournament Details
```
GET https://www.meyersquared.com/api/v1/tournament/public/{tournamentId}
```
Returns full tournament data including events:
```json
{
  "TournamentId": 150,
  "Name": "Looking Sharpe 2026",
  "StartDate": "2026-05-16",
  "EndDate": "2026-05-16",
  "RegistrationCutOff": "2026-05-15",
  "Description": "<p>HTML description...</p>",
  "BasePrice": null,
  "HostedOnM2": true,
  "M2Registration": false,
  "TotalParticipants": 19,
  "Events": [
    {
      "EventId": 200,
      "EventName": "Marginalized Genders Single Rapier",
      "Status": "planning",
      "EventPrice": null,
      "Date": "2026-05-16",
      "StartTime": "12:00:00",
      "EventCutoff": "24",
      "ParticipantsCount": 6,
      "Weapon": { "Name": "MG Single Rapier" }
    }
  ],
  "Club": {
    "Name": "Columbus United Fencing Club",
    "ClubId": 10,
    "Images": [...]
  },
  "Address": {
    "Name": "Columbus United Fencing Club",
    "City": "Reynoldsburg",
    "State": "OH",
    "Address1": "6475 E Main St Suite #111",
    "Zip": 43068,
    "Coordinates": "39.953315,-82.9068263"
  },
  "Images": [...],
  "PrimaryContact": {...},
  "SocialMedia": [...],
  "TotalEvents": 3,
  "Status": "unknown"
}
```

### New Data Models (MongoDB)

#### Tournament Collection (Minimal - Reference Only)
```typescript
// server/src/models/Tournament.ts
interface Tournament {
  _id: ObjectId;
  m2TournamentId: number;        // MeyerSquared tournament ID
  name: string;                   // Stored for audit/display when M2 unavailable
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Registrant Collection (Flat - Many-to-One with Tournament)

This is the **critical audit record**. It stores everything needed to:
1. Answer "what did this person pay for?"
2. Manually add to M2 if the automatic post failed (you have all the data)

```typescript
// server/src/models/Registrant.ts
interface Registrant {
  _id: ObjectId;
  
  // Tournament Reference
  tournamentId: ObjectId;         // Reference to local Tournament
  m2TournamentId: number;         // Direct M2 reference for queries
  tournamentName: string;         // Snapshot at time of registration (audit)
  
  // Event Selections - Store full details for audit/retry
  selectedEvents: {
    m2EventId: number;
    eventName: string;            // Snapshot at time of registration
    priceInCents: number;         // Price paid (from M2 at registration time)
  }[];
  
  // Personal Information
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  
  // Club Affiliation
  clubAffiliation?: {
    m2ClubId: number;
    name: string;
  };
  
  // Guardian (for minors)
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
  
  // Payment
  paymentId: string;              // Our internal payment reference
  squareOrderId?: string;         // Square order ID for reference
  isPaid: boolean;
  paidAt?: Date;
  amountPaidInCents?: number;     // Total amount paid
  
  // M2 Post Status (simple - no retry tracking)
  m2Posted: boolean;              // True if successfully posted to M2
  m2PostedAt?: Date;
  
  // User Account (optional)
  userId?: ObjectId;              // Reference to User if logged in
  
  // Flags
  isRequestedAlternativeQualification: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### M2 Service Interface Pattern (Dependency Injection)

TypeScript supports interface-based dependency injection similar to Spring Boot. Define an interface, then create live and stub implementations.

```typescript
// server/src/services/meyerSquared/IM2Service.ts
export interface M2Tournament {
  TournamentId: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  RegistrationCutOff: string;
  Description: string;
  BasePrice: number | null;        // In cents when implemented
  TotalParticipants: number;
  Events: M2Event[];
  Club: { Name: string; ClubId: number };
  Address: {
    Name: string;
    City: string;
    State: string;
    Address1: string;
    Zip: number;
  };
  Images: { ImageId: number; URL: string; AltText: string | null }[];
  PrimaryContact: { PersonId: number; DisplayName: string };
}

export interface M2Event {
  EventId: number;
  EventName: string;
  Status: string;
  EventPrice: number | null;       // In cents when implemented
  Date: string;
  StartTime: string;
  EventCutoff: string;
  ParticipantsCount: number;
  Weapon: { Name: string };
}

export interface M2Club {
  ClubId: number;
  Name: string;
}

export interface M2AddPersonRequest {
  Email: string;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  ClubId?: number;
}

export interface IM2Service {
  /**
   * Get all tournaments for CUFC (ClubId: 10)
   */
  getClubTournaments(): Promise<M2Tournament[]>;
  
  /**
   * Get tournament details by M2 tournament ID
   */
  getTournament(tournamentId: number): Promise<M2Tournament | null>;
  
  /**
   * Get all clubs (for club affiliation dropdown)
   */
  getAllClubs(): Promise<M2Club[]>;
  
  /**
   * Add a person to an M2 event (requires auth)
   */
  addPersonToEvent(eventId: number, person: M2AddPersonRequest): Promise<void>;
}
```

#### Live Implementation
```typescript
// server/src/services/meyerSquared/M2ServiceLive.ts
import { IM2Service, M2Tournament, M2Club, M2AddPersonRequest } from './IM2Service';
import axios from 'axios';

export class M2ServiceLive implements IM2Service {
  private baseUrl = 'https://www.meyersquared.com/api/v1';
  private authUrl = 'https://meyer-squared.us.auth0.com/oauth/token';
  private clubId = 10;  // CUFC
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && (this.tokenExpiry - Date.now() > 300000)) {
      return this.token;
    }
    
    const response = await axios.post(this.authUrl, {
      client_id: process.env.M2_CLIENT_ID,
      client_secret: process.env.M2_CLIENT_SECRET,
      audience: 'https://meyersquared.com',
      grant_type: 'client_credentials'
    });
    
    this.token = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return this.token;
  }

  async getClubTournaments(): Promise<M2Tournament[]> {
    const response = await axios.get(
      `${this.baseUrl}/tournament/public/club/${this.clubId}`
    );
    return response.data;
  }

  async getTournament(tournamentId: number): Promise<M2Tournament | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tournament/public/${tournamentId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getAllClubs(): Promise<M2Club[]> {
    const token = await this.getToken();
    const response = await axios.get(`${this.baseUrl}/club/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.map((club: any) => ({
      ClubId: club.ClubId,
      Name: club.Name
    }));
  }

  async addPersonToEvent(eventId: number, person: M2AddPersonRequest): Promise<void> {
    const token = await this.getToken();
    await axios.post(
      `${this.baseUrl}/event/${eventId}/addPersonFromThirdParty`,
      person,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}
```

#### Stub Implementation (for testing/development)
```typescript
// server/src/services/meyerSquared/M2ServiceStub.ts
import { IM2Service, M2Tournament, M2Club, M2AddPersonRequest, M2Event } from './IM2Service';

export class M2ServiceStub implements IM2Service {
  
  private stubTournaments: M2Tournament[] = [
    {
      TournamentId: 150,
      Name: 'Looking Sharpe 2026',
      StartDate: '2026-05-16',
      EndDate: '2026-05-16',
      RegistrationCutOff: '2026-05-15',
      Description: '<p>Test tournament description</p>',
      BasePrice: 2500,  // $25.00 in cents
      TotalParticipants: 19,
      Events: [
        {
          EventId: 200,
          EventName: 'Marginalized Genders Single Rapier',
          Status: 'planning',
          EventPrice: 1500,  // $15.00 in cents
          Date: '2026-05-16',
          StartTime: '12:00:00',
          EventCutoff: '24',
          ParticipantsCount: 6,
          Weapon: { Name: 'MG Single Rapier' }
        },
        {
          EventId: 201,
          EventName: 'Marginalized Genders Sword and Buckler',
          Status: 'planning',
          EventPrice: 1500,
          Date: '2026-05-16',
          StartTime: '12:00:00',
          EventCutoff: '24',
          ParticipantsCount: 4,
          Weapon: { Name: 'MG Sword & Buckler' }
        },
        {
          EventId: 202,
          EventName: 'Marginalized Genders Longsword',
          Status: 'planning',
          EventPrice: 2000,  // $20.00 in cents
          Date: '2026-05-16',
          StartTime: '14:00:00',
          EventCutoff: '24',
          ParticipantsCount: 9,
          Weapon: { Name: 'MG Longsword' }
        }
      ],
      Club: { Name: 'Columbus United Fencing Club', ClubId: 10 },
      Address: {
        Name: 'Columbus United Fencing Club',
        City: 'Reynoldsburg',
        State: 'OH',
        Address1: '6475 E Main St Suite #111',
        Zip: 43068
      },
      Images: [{ ImageId: 286, URL: 'https://example.com/image.png', AltText: null }],
      PrimaryContact: { PersonId: 323, DisplayName: 'Nathan Wallace' }
    }
  ];

  private stubClubs: M2Club[] = [
    { ClubId: 10, Name: 'Columbus United Fencing Club' },
    { ClubId: 1, Name: 'Test Club A' },
    { ClubId: 2, Name: 'Test Club B' }
  ];

  // Track added persons for testing
  public addedPersons: { eventId: number; person: M2AddPersonRequest }[] = [];

  async getClubTournaments(): Promise<M2Tournament[]> {
    return this.stubTournaments;
  }

  async getTournament(tournamentId: number): Promise<M2Tournament | null> {
    return this.stubTournaments.find(t => t.TournamentId === tournamentId) || null;
  }

  async getAllClubs(): Promise<M2Club[]> {
    return this.stubClubs;
  }

  async addPersonToEvent(eventId: number, person: M2AddPersonRequest): Promise<void> {
    // Store for test assertions
    this.addedPersons.push({ eventId, person });
    console.log(`[M2 STUB] Added person to event ${eventId}:`, person);
  }

  // Test helpers
  addTournament(tournament: M2Tournament): void {
    this.stubTournaments.push(tournament);
  }

  clearAddedPersons(): void {
    this.addedPersons = [];
  }
}
```

#### Dependency Injection Setup
```typescript
// server/src/services/meyerSquared/index.ts
import { IM2Service } from './IM2Service';
import { M2ServiceLive } from './M2ServiceLive';
import { M2ServiceStub } from './M2ServiceStub';

export function createM2Service(): IM2Service {
  if (process.env.NODE_ENV === 'test' || process.env.USE_M2_STUB === 'true') {
    console.log('Using M2 stub service');
    return new M2ServiceStub();
  }
  console.log('Using M2 live service');
  return new M2ServiceLive();
}

// Singleton instance
let m2Service: IM2Service | null = null;

export function getM2Service(): IM2Service {
  if (!m2Service) {
    m2Service = createM2Service();
  }
  return m2Service;
}

// For testing - allows injecting a mock
export function setM2Service(service: IM2Service): void {
  m2Service = service;
}

export * from './IM2Service';
```

#### Usage in Services/Controllers
```typescript
// server/src/services/registrationService.ts
import { getM2Service } from './meyerSquared';

export class RegistrationService {
  async getTournamentDetails(m2TournamentId: number) {
    const m2Service = getM2Service();
    return m2Service.getTournament(m2TournamentId);
  }
}
```

---

#### User Collection (For Logged-in Users)
```typescript
// server/src/models/User.ts (extend existing)
interface UserTournamentProfile {
  // Saved registration info for auto-fill
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  phoneNumber: string;
  clubAffiliation?: {
    m2ClubId: number;
    name: string;
  };
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
}

// Add to existing User model
interface User {
  // ... existing fields
  tournamentProfile?: UserTournamentProfile;
}
```

### New Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CUFC-MERN Registration Flow                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Event   │───▶│  Form    │───▶│  Create  │───▶│  Square  │───▶│  Webhook │
│  Landing │    │  Submit  │    │  Order   │    │ Checkout │    │ Received │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
  Fetch M2      Save Registrant   Square Orders   User Pays     Update Paid
  Tournament    (isPaid: false)   API w/ items    via Square    + Sync to M2
  Data
```

#### Step 1: Event Landing Page
- Fetch tournaments from M2: `GET /api/v1/tournament/public/club/10`
- Display tournament cards with basic info
- Click tournament → fetch details: `GET /api/v1/tournament/public/{id}`

#### Step 2: Registration Form
- If logged in: Auto-populate form from `user.tournamentProfile`
- Check if user already has paid registration for this tournament
  - If yes: Don't charge base fee again, only event fees
- Display events from M2 data (with prices in cents from M2)
- Calculate total price (base fee + selected event fees)

#### Step 3: Submit Registration
```
POST /api/tournaments/:m2TournamentId/register
```
- Create/find local Tournament record (just m2TournamentId + name)
- Create Registrant record with `isPaid: false`
- Generate `paymentId`
- If logged in: Link `userId` and update `user.tournamentProfile`

#### Step 4: Create Square Order
```
POST /api/square/orders
```
Using Square Orders API (not just payment links):
```typescript
const order = await squareClient.ordersApi.createOrder({
  order: {
    locationId: SQUARE_LOCATION_ID,
    referenceId: paymentId,
    lineItems: [
      // Base fee (if applicable - skip if user already paid for this tournament)
      ...(shouldChargeBaseFee ? [{
        name: `${tournamentName} Registration Fee`,
        quantity: '1',
        basePriceMoney: { amount: baseFeeInCents, currency: 'USD' }
      }] : []),
      // Event fees (prices already in cents from M2)
      ...selectedEvents.map(event => ({
        name: event.eventName,
        quantity: '1',
        basePriceMoney: { amount: event.priceInCents, currency: 'USD' }
      })),
      // Future: Catalog items (merch)
      // {
      //   catalogObjectId: 'TSHIRT_CATALOG_ID',
      //   quantity: '1'
      // }
    ],
    metadata: {
      payment_id: paymentId,
      m2_tournament_id: m2TournamentId.toString(),
      registrant_id: registrantId.toString()
    }
  }
});

// Create payment link for the order
const paymentLink = await squareClient.checkoutApi.createPaymentLink({
  order: { orderId: order.result.order.id },
  checkoutOptions: {
    redirectUrl: `${FRONTEND_URL}/payment/success?paymentId=${paymentId}`
  }
});
```

#### Step 5: Square Webhook Processing
```
POST /api/square/webhook
```
- Verify signature
- Extract metadata from order
- Update Registrant: `isPaid: true`, `paidAt`, `squareOrderId`, `amountPaidInCents`
- Post to M2 for each selected event

#### Step 6: M2 Post (Fire and Forget)
For each selected event:
```
POST /api/v1/event/{m2EventId}/addPersonFromThirdParty
{
  Email: registrant.email,
  DisplayName: `${preferredFirstName} ${preferredLastName}`,
  FirstName: legalFirstName,
  LastName: legalLastName,
  ClubId: clubAffiliation?.m2ClubId
}
```
- On success: Set `m2Posted: true`, `m2PostedAt: now`
- On failure: **Send email alert** with registrant details, set `m2Posted: false`
- No retry logic - admin handles manually if needed using stored data

### User Dashboard Features

#### Registration History
```typescript
// GET /api/users/me/registrations
const registrations = await Registrant.find({ userId: user._id })
  .populate('tournamentId')
  .sort({ createdAt: -1 });
```

#### Check Existing Registration (for base fee logic)
```typescript
// Check if user already paid for this tournament
const existingPaidRegistration = await Registrant.findOne({
  userId: user._id,
  m2TournamentId: tournamentId,
  isPaid: true
});

const shouldChargeBaseFee = !existingPaidRegistration;
```

### API Endpoints Summary

#### Public
- `GET /api/tournaments` - List tournaments from M2
- `GET /api/tournaments/:m2Id` - Get tournament details from M2
- `POST /api/tournaments/:m2Id/register` - Submit registration
- `POST /api/square/webhook` - Square webhook handler

#### Authenticated
- `GET /api/users/me/registrations` - User's registration history
- `GET /api/users/me/tournament-profile` - Get saved profile
- `PUT /api/users/me/tournament-profile` - Update saved profile
- `GET /api/tournaments/:m2Id/my-registration` - Check existing registration

#### Admin
- `GET /api/admin/tournaments` - List local tournament records
- `PUT /api/admin/tournaments/:id` - Update local overrides (prices, discounts)
- `GET /api/admin/registrants` - List all registrants
- `GET /api/admin/registrants/:tournamentId` - Registrants for tournament
- `POST /api/admin/registrants/:id/resync-m2` - Retry M2 sync

---

## Part 3: Implementation Considerations

### Resolved Design Decisions

1. **Prices**: M2 will provide `BasePrice` and `EventPrice` in cents - use directly
2. **Registration Cutoff**: Use M2's `RegistrationCutOff` field
3. **Discount Rules**: Removed from scope - not currently used
4. **Data Retention**: Store snapshots in Registrant record for:
   - Audit: "What did they pay for?"
   - Manual recovery: All data needed to manually add to M2 if post failed
5. **M2 Post Failure**: Send email alert, no automatic retry

### Migration Steps

1. **Phase 1: Data Models**
   - Create Tournament model (minimal - just m2TournamentId + name)
   - Create Registrant model (flat, with snapshot data for audit)
   - Extend User model with tournamentProfile

2. **Phase 2: M2 Integration**
   - Create `IM2Service` interface
   - Implement `M2ServiceLive` (calls real M2 API)
   - Implement `M2ServiceStub` (for testing/development)
   - Create dependency injection factory
   - Implement tournament list/detail endpoints

3. **Phase 3: Registration Flow**
   - Registration form component
   - Price calculation (simple: base fee + event fees from M2)
   - Registration submission endpoint
   - Store snapshot data in Registrant record

4. **Phase 4: Square Integration**
   - Migrate to Orders API (supports multiple line items)
   - Create order with base fee + event fees
   - Payment link generation
   - Webhook handler with signature verification

5. **Phase 5: M2 Post**
   - Post-payment: add person to each selected M2 event
   - On failure: send email alert (no retry logic needed)
   - Store `m2Posted: true/false` for reference

6. **Phase 6: User Features**
   - Profile auto-fill from saved tournamentProfile
   - Registration history view
   - Base fee exemption for returning registrants

7. **Phase 7: Admin Features**
   - Registrant list (with m2Posted status visible)
   - Export registrant data

### Environment Variables Needed

```env
# MeyerSquared
M2_PUBLIC_API_URL=https://www.meyersquared.com/api/v1
M2_CLIENT_ID=xxx
M2_CLIENT_SECRET=xxx
M2_CLUB_ID=10
USE_M2_STUB=false  # Set to 'true' for development/testing

# Square
SQUARE_ACCESS_TOKEN=xxx
SQUARE_LOCATION_ID=xxx
SQUARE_SIGNATURE_KEY=xxx
SQUARE_ENVIRONMENT=production

# App
FRONTEND_URL=https://www.columbusunitedfencing.com
```

---

## Appendix: File References

### Existing System (CUFC-web + CUFC-Node)

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

### New System (CUFC-MERN) - Planned

| Component | Planned Path |
|-----------|--------------|
| Tournament Model | `server/src/models/Tournament.ts` |
| Registrant Model | `server/src/models/Registrant.ts` |
| User Extension | `server/src/models/User.ts` |
| M2 Interface | `server/src/services/meyerSquared/IM2Service.ts` |
| M2 Live Service | `server/src/services/meyerSquared/M2ServiceLive.ts` |
| M2 Stub Service | `server/src/services/meyerSquared/M2ServiceStub.ts` |
| M2 Factory | `server/src/services/meyerSquared/index.ts` |
| Square Service | `server/src/services/squareService.ts` |
| Registration Service | `server/src/services/registrationService.ts` |
| Tournament Routes | `server/src/routes/tournamentRoutes.ts` |
| Square Routes | `server/src/routes/squareRoutes.ts` |
| Registration Components | `client/src/features/tournaments/` |
