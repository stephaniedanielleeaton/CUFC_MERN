# Member Status Flow

This document describes the `memberStatus` field on `MemberProfile` and how members transition between states.

## Overview

The `memberStatus` field tracks a member's progression through the club onboarding process. It determines what features and actions are available to the member.

## States

| Status     | Description |
|------------|-------------|
| `New`      | Default status. Member has created a profile but has not enrolled in an intro class. |
| `Enrolled` | Member has paid for an intro class. Awaiting admin promotion after completing the class. |
| `Full`     | Member has full club privileges. Manually set by admin. |

## State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEMBER STATUS FLOW                         │
└─────────────────────────────────────────────────────────────────┘

  Profile Created (via signup or guest enrollment)
        │
        ▼
  ┌───────────┐
  │    New    │  ← Default status for all new profiles
  └─────┬─────┘
        │
        │  Automatic: Intro class payment completed
        │  (via Square webhook)
        │
        ▼
  ┌───────────┐
  │ Enrolled  │  ← Paid for intro class, awaiting completion
  └─────┬─────┘
        │
        │  Manual: Admin promotes member
        │
        ▼
  ┌───────────┐
  │   Full    │  ← Full member with all privileges
  └───────────┘
```

## Status: New

### When Applied
- Automatically set when a `MemberProfile` is created
- Default value in the Mongoose schema

### Restrictions
- **Cannot pay for drop-in classes**
- **Dashboard shows intro enrollment options**
- **Limited access** - Cannot access full member features

### UI Behavior
In `DashboardPage.tsx`:
- Shows `DashboardIntroCourseCard` or `DashboardIntroEnrollmentCard`
- "Pay for Drop In" button is disabled with message: "Complete an intro course or contact a coach to unlock"

## Status: Enrolled

### When Applied
- **Automatically** when intro class payment is completed via Square webhook
- Handled by `IntroClassEnrollmentService.handlePaymentCompleted()`

### Restrictions
- **Cannot pay for drop-in classes** - Must be promoted to Full first
- **Dashboard shows enrollment confirmation**

### UI Behavior
- Shows enrollment status on dashboard
- Awaiting admin to promote to Full after completing intro class

## Status: Full

### When Applied
- **Manually** by admin after member completes intro class
- **Manually** by admin for experienced fencers who don't need intro class

### Privileges
- **Can pay for drop-in classes**
- **Can purchase subscriptions**
- **Dashboard shows subscription management**
- **Full access to all member features**

### UI Behavior
In `DashboardPage.tsx`:
- Shows `DashboardSubscriptionCard` instead of intro enrollment
- "Pay for Drop In" button is enabled (if profile is complete)

## Transition Triggers

| From     | To       | Trigger                              | Type      |
|----------|----------|--------------------------------------|-----------|
| New      | Enrolled | Intro class payment completed        | Automatic |
| Enrolled | Full     | Admin promotes member                | Manual    |
| New      | Full     | Admin promotes member (skip intro)   | Manual    |

## Automation Details

### New → Enrolled (Automatic)

When a member pays for an intro class:
1. Square sends a `payment.updated` webhook to `/api/webhooks/square`
2. `IntroClassEnrollmentService.handlePaymentCompleted()` is called
3. Service checks if the order contains an intro class item
4. If yes, updates `memberStatus` to `Enrolled`

**Files involved:**
- `server/src/routes/webhooks.ts` - Webhook endpoint
- `server/src/services/introClassEnrollmentService.ts` - Enrollment logic

### Enrolled → Full (Manual)

Admin must manually promote the member after they complete their intro class:
- Via admin panel member management
- Using `memberProfileService.update(memberId, { memberStatus: 'Full' })`

## Code References

### Type Definition
```typescript
// packages/shared/src/types/MemberStatus.ts
export const MemberStatus = {
  New: 'New',
  Enrolled: 'Enrolled',
  Full: 'Full',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
```

### Schema Definition
```typescript
// server/src/models/MemberProfile.ts
memberStatus: { type: String, enum: ['New', 'Enrolled', 'Full'], default: 'New' }
```

### Usage in Dashboard
```typescript
// client/src/pages/DashboardPage.tsx
const isNewMember = profile.memberStatus === MemberStatus.New;
const dropInDisabled = !profile.profileComplete || isNewMember;
```

## Related Fields

| Field | Type | Description |
|-------|------|-------------|
| `profileComplete` | boolean | Whether member has filled out required profile info |
| `isWaiverOnFile` | boolean | Whether liability waiver is signed |
| `isArchived` | boolean | Whether member is archived (inactive) |

## Square Webhook Configuration

To enable automatic `New → Enrolled` transitions, configure a Square webhook:
- **URL**: `https://your-domain.com/api/webhooks/square`
- **Events**: `payment.updated`
- **Signature Key**: Set in `SQUARE_SIGNATURE_KEY` environment variable
