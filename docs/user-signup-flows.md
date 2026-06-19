# User Signup & Intro Class Enrollment Flows

This document describes the requirements and behaviour for all user signup and intro class enrollment flows.

---

## Table of Contents

1. [Overview](#overview)
2. [Flow 1: Dashboard Enrollment (Authenticated)](#flow-1-dashboard-enrollment-authenticated)
3. [Flow 2: Join Now / CTA Enrollment](#flow-2-join-now--cta-enrollment)
4. [Flow 3: Guest Checkout](#flow-3-guest-checkout)
5. [Profile Linking — Guest to Authenticated](#profile-linking--guest-to-authenticated)
6. [Square Customer ID Management](#square-customer-id-management)
7. [Profile Completion](#profile-completion)
8. [Key Files Reference](#key-files-reference)

---

## Overview

There are three ways a user can enroll in an intro class. All paths ultimately create a member profile (or reuse an existing one), create a Square checkout session, and process a payment via Square webhook.

| Entry Point | Who | Path |
|-------------|-----|------|
| Sign in → Dashboard | New or returning authenticated user | Profile check → class selection → checkout |
| "Join Now" / nav CTA | Unauthenticated user who wants to sign in | Class selection → sign in → pending enrollment → checkout |
| "Enroll Now" without signing in | Guest user | Inline profile form → guest checkout |

---

## Flow 1: Dashboard Enrollment (Authenticated)

### Requirements

- An unauthenticated user who reaches `/dashboard` must be redirected to Auth0 login. After login, Auth0 returns them to `/dashboard`.
- On load, the dashboard fetches the user's profile via `GET /api/members/me`. If no profile exists, the profile creation form is shown before any enrollment action is available.
- `POST /api/members/me` is idempotent with respect to `auth0Id`: if a profile already exists for the authenticated user, the server returns `409 Conflict` with the existing profile. This prevents duplicate profiles from double-submissions or retries.
- The "Enroll" button must be disabled or hidden until the user's profile is marked `profileComplete`.
- If `profileComplete` is false when the user clicks Enroll, the profile form is shown. After successful submission, enrollment continues without requiring the user to click again.
- After completing the profile form, the user selects an intro class from the available offerings.
- Checkout is initiated via `POST /api/checkout/intro` (authenticated). Square returns a hosted checkout URL; the user is redirected there immediately.
- After payment, Square redirects the user back to `/dashboard`. The dashboard re-fetches enrollment status and replaces the enrollment CTA with a confirmation card.

### API Endpoints Used

| Action | Endpoint | Auth |
|--------|----------|------|
| Fetch profile | `GET /api/members/me` | Required |
| Create profile | `POST /api/members/me` | Required |
| Update profile | `POST /api/members/me/update` | Required |
| Create checkout | `POST /api/checkout/intro` | Required |
| Fetch enrollment | `GET /api/members/me/intro-enrollment` | Required |

---

## Flow 2: Join Now / CTA Enrollment

### Requirements

- Clicking "Join Now" from any page must redirect authenticated users directly to `/dashboard`.
- For unauthenticated users, clicking "Join Now" scrolls to the intro class section on the home page (or navigates to `/` first if on another page).
- When an unauthenticated user selects a class and clicks "Enroll Now", the chosen class ID is saved to `sessionStorage` with a timestamp before any redirect occurs. This preserves the selection across the Auth0 login redirect.
- The modal presented at this point offers two options: **Sign In** or **Continue as Guest**. Choosing Sign In initiates Auth0 login with a return path of `/enroll/pending`.
- The pending enrollment page (`/enroll/pending`) reads the saved class selection from `sessionStorage`. If the selection is older than 30 minutes it is discarded and the user is sent to the home page.
- If the selection is valid and the user's profile is complete, checkout proceeds immediately with the saved class.
- If the profile is incomplete, the profile form is shown first. After submission, checkout proceeds automatically.
- `sessionStorage` is cleared after a successful checkout redirect.

---

## Flow 3: Guest Checkout

### Requirements

- A guest user who chooses "Continue as Guest" in the enrollment modal is shown the profile form without being required to sign in.
- The profile form collects display name, legal name, contact details, date of birth, address, and optionally guardian information for minors. Email is required.
- On submission, the profile is created via `POST /api/members/guest` (no authentication required). The server will:
  - Search for an existing unlinked profile (no `auth0Id`) with the same email address. If found, return it as-is without applying any submitted data. This prevents an unauthenticated caller from overwriting another person's profile by knowing their email address. A Square customer record is created for the existing profile if one is missing.
  - If no existing profile is found, create a new one and attempt to create or retrieve a Square customer record. Square customer creation is best-effort; failure does not prevent profile creation.
- After the profile is created or updated, checkout proceeds via `POST /api/checkout/intro-guest` (no authentication required).
- After payment, Square redirects the user to the home page (`/`).

---

## Profile Linking — Guest to Authenticated

### Requirements

When a user who previously enrolled as a guest later signs in or creates an Auth0 account, their guest profile must be automatically found and linked to their new identity. This must happen without any action from the user.

There are two entry points for linking:

**Transparent link (sign-in only, no form submission)**

- On `GET /api/members/me`, if no profile is found by `auth0Id`, the server searches for an unlinked profile matching the Auth0-provided email address.
- If a match is found, the `auth0Id` is written to that profile (linking it). The route guard on the server side ensures email is present before this lookup is attempted.
- If the linked profile has no `squareCustomerId`, one is created or retrieved from Square and written to the profile at this point.

**Link with form submission (`POST /api/members/me`)**

- If the user fills out the profile form after signing in and an unlinked profile with the same email already exists:
  - The `auth0Id` is linked to the existing profile.
  - The submitted form data (display name, personal info, pronouns, etc.) is applied as an update to the existing profile — it is not discarded.
  - If the profile has no `squareCustomerId`, one is created or retrieved and saved.
- Email is a required field for this endpoint. The service layer throws immediately if it is absent.

---

## Square Customer ID Management

### Requirements

Every member profile should have a `squareCustomerId` linking them to a Square customer record. Square customers are always created using a "get or create" strategy — if a customer with that email already exists in Square, it is reused and no duplicate is created.

Square customer creation is best-effort: if the Square API call fails, the profile is still saved. Any subsequent operation (including the payment webhook) can set the `squareCustomerId` later.

### When a Square customer is created or assigned

| Scenario | Trigger | Outcome |
|----------|---------|---------|
| New authenticated user, no prior profile | `POST /api/members/me` | Square customer created and ID saved to new profile |
| New guest user | `POST /api/members/guest` | Square customer created and ID saved to new profile |
| Guest submits form again with same email (dedup) | `POST /api/members/guest` | Existing profile returned as-is; Square customer created if ID was missing |
| Guest signs in — no form submission | `GET /api/members/me` → `findAndLinkByEmail` | `auth0Id` linked; Square customer created if ID was missing |
| Guest signs in — with form submission | `POST /api/members/me` → `linkAndUpdateExistingProfile` | `auth0Id` linked, profile updated; Square customer created if ID was missing |
| Square API failed at profile creation time | Square `payment.updated` webhook | `squareCustomerId` set from the `customerId` on the payment object |

### Admin-created profiles

Admins can create a profile via the admin panel (`POST /api/admin/members`) without providing an email address. In this case no Square customer lookup or creation is attempted. The profile remains without a `squareCustomerId` until the member enrolls or signs in.

---

## Profile Completion

### Requirements

- All profiles have a `profileComplete` boolean field, which defaults to `false`.
- A profile is marked `profileComplete: true` when the profile form is successfully submitted by the user (not when created by an admin).
- `profileComplete` gates access to the enrollment flow and to drop-in payments on the dashboard.
- The `pronouns` field is optional. If a user clears their pronouns, an empty string must be sent to the server — sending `undefined` would cause the existing value to be preserved. The form must not convert empty strings to `undefined` for this field.
- All profile fields submitted through `POST /api/members/me` and `POST /api/members/guest` are typed as `GuestProfileInput` end-to-end (route, service, and DAO layer) to ensure the full payload is handled consistently.

---

## Key Files Reference

### Client

| File | Purpose |
|------|---------|
| `client/src/pages/DashboardPage.tsx` | Dashboard with enrollment state machine |
| `client/src/pages/PendingEnrollmentPage.tsx` | Handles pending enrollment after sign-in |
| `client/src/components/intro-classes/IntroClassOfferings.tsx` | Class selection and guest enrollment entry point |
| `client/src/components/checkout/GuestCheckoutModal.tsx` | Sign-in vs guest choice modal |
| `client/src/components/profile/UnifiedProfileForm.tsx` | Profile form used in all modes (guest, authenticated, edit) |
| `client/src/hooks/useJoinNavigation.ts` | "Join Now" button navigation logic |
| `client/src/context/ProfileContext.tsx` | Profile state management |
| `client/src/services/checkoutService.ts` | Checkout API calls |

### Server

| File | Purpose |
|------|---------|
| `server/src/routes/members.ts` | Member profile endpoints (`/me`, `/me/update`, `/guest`) |
| `server/src/routes/checkout.ts` | Checkout endpoints (authenticated and guest) |
| `server/src/services/memberProfileService.ts` | Profile business logic — creation, linking, Square customer management |
| `server/src/dao/memberProfileDAO.ts` | Profile database operations |
| `server/src/services/square/SquareCustomersService.ts` | Square customer get-or-create logic |
| `server/src/services/introClassEnrollmentService.ts` | Enrollment status and webhook payment handling |

### Shared

| File | Purpose |
|------|---------|
| `packages/shared/src/types/MemberProfile.ts` | `MemberProfileDTO`, `GuestProfileInput`, `PersonalInfo` types |
| `packages/shared/src/types/MemberUpdateData.ts` | `MemberUpdateData` type and `MemberUpdateDataMapper` |
