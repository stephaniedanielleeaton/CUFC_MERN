# Enrollment BDD Test Plan

## Feature 1: Dashboard Enrollment (Authenticated)

- [ ] **1.1** Unauthenticated user navigates to `/dashboard` → redirected to Auth0 login → returned to `/dashboard` after sign-in
- [ ] **1.2** Authenticated user with no profile → sees "Welcome to CUFC!" profile creation form, no enrollment options visible
- [ ] **1.3** Authenticated user with incomplete profile clicks "Enroll" → profile form shown, cannot skip to class selection
- [ ] **1.4** Authenticated user with complete profile clicks "Enroll" → class offerings shown → selecting a class redirects to Square checkout
- [ ] **1.5** Incomplete profile user submits profile form mid-flow → auto-advances to class selection without clicking again
- [ ] **1.6** `POST /api/members/me` called when profile already exists for `auth0Id` → returns `409 Conflict` with existing profile, no duplicate created
- [ ] **1.7** `POST /api/checkout/intro` called with `profileComplete: false` → returns `400` with `code: PROFILE_INCOMPLETE`
- [ ] **1.8** Authenticated user with existing enrollment lands on `/dashboard` → sees enrollment confirmation card, no "Enroll" button

---

## Feature 2: Join Now / CTA Enrollment (Pending Flow)

- [ ] **2.1** Authenticated user clicks "Join Now" → navigated directly to `/dashboard`
- [ ] **2.2** Unauthenticated user selects a class and clicks "Enroll Now" → chooses "Sign In" → `classId` + timestamp saved to `sessionStorage`, redirected to Auth0 with return path `/enroll/pending`
- [ ] **2.3** Valid `pendingIntroEnrollment` in `sessionStorage` + authenticated user with complete profile lands on `/enroll/pending` → checkout initiated immediately, `sessionStorage` cleared after redirect
- [ ] **2.4** Valid `pendingIntroEnrollment` + authenticated user with incomplete profile lands on `/enroll/pending` → profile form shown → after submission checkout proceeds automatically
- [ ] **2.5** `pendingIntroEnrollment` timestamp older than 30 minutes → entry removed from `sessionStorage`, user redirected to `/dashboard`

---

## Feature 3: Guest Checkout

- [ ] **3.1** Unauthenticated user selects class → chooses "Continue as Guest" → fills profile form → `POST /api/members/guest` creates profile → `POST /api/checkout/intro-guest` returns Square checkout URL → redirected to Square
- [ ] **3.2** Guest submits form with email that matches an existing unlinked profile → server returns existing profile as-is, submitted data is NOT applied
- [ ] **3.3** `POST /api/checkout/intro-guest` called with `profileComplete: false` → returns `400` with `code: PROFILE_INCOMPLETE`

---

## Feature 4: Guest-to-Authenticated Profile Linking

- [ ] **4.1** Guest profile exists with matching email, no `auth0Id` → user signs in → `GET /api/members/me` links `auth0Id` to existing profile, Square customer ID created if missing
- [ ] **4.2** Guest profile exists with matching email → authenticated user submits profile form → `POST /api/members/me` links `auth0Id` and applies submitted form data as an update

---

## Unit Tests (Vitest)

- [ ] **U.1** `getPendingEnrollment()` returns `null` when `sessionStorage` key is missing
- [ ] **U.2** `getPendingEnrollment()` returns `null` when timestamp is older than 30 minutes and removes the key
- [ ] **U.3** `getPendingEnrollment()` returns `null` when `sessionStorage` value is malformed JSON
- [ ] **U.4** `clearPendingEnrollment()` removes `pendingIntroEnrollment` from `sessionStorage`
- [ ] **U.5** `CheckoutError` correctly carries the `code` field
- [x] **U.6** `isTokenExpiredError()` returns `true` for `login_required`, `consent_required`, and `Missing Refresh Token` messages
- [ ] **U.7** `POST /api/checkout/intro` — `400` on missing `catalogObjectId` or `memberProfileId`
- [ ] **U.8** `POST /api/checkout/intro` — `404` when profile ID does not exist
- [ ] **U.9** `POST /api/checkout/intro` — `400` with `PROFILE_INCOMPLETE` when profile exists but is incomplete
- [ ] **U.10** `POST /api/checkout/intro-guest` — same validation as U.7–U.9

---

## Implementation Order

- [ ] U.1–U.6 Unit tests (no mocks, fast wins)
- [ ] U.7–U.10 Server route tests via Supertest
- [ ] 1.6 `POST /api/members/me` 409 dedup test
- [ ] 4.1–4.2 Profile linking server tests
- [ ] 1.1–1.8 E2E: Authenticated dashboard flow
- [ ] 2.1–2.5 E2E: Pending enrollment flow
- [ ] 3.1–3.3 E2E: Guest checkout flow
