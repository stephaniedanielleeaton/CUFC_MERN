/**
 * MemberStatus represents the membership lifecycle state of a member profile.
 *
 * ## State Flow
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      MEMBER STATUS FLOW                        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 *   Profile Created
 *         │
 *         ▼
 *   ┌───────────┐
 *   │    New    │  ← Default status for all new profiles
 *   └─────┬─────┘
 *         │
 *         │  Automatic: Intro class payment completed
 *         │
 *         ▼
 *   ┌───────────┐
 *   │ Enrolled  │  ← Paid for intro class, awaiting completion
 *   └─────┬─────┘
 *         │
 *         │  Manual: Admin promotes member
 *         │
 *         ▼
 *   ┌───────────┐
 *   │   Full    │  ← Full member with all privileges
 *   └───────────┘
 * ```
 *
 * ## Status Definitions
 *
 * - **New**: Member has created a profile but has not enrolled in an intro class.
 *   - Cannot pay for drop-in classes
 *   - See intro class enrollment options on dashboard
 *
 * - **Enrolled**: Member has paid for an intro class.
 *   - Automatically set when intro class payment is completed
 *   - Cannot pay for drop-in classes
 *   - Awaiting admin promotion to Full after completing intro class
 *
 * - **Full**: Member has full club privileges (manually set by admin).
 *   - Can pay for drop-in classes
 *   - Can purchase subscriptions
 *   - See subscription management on dashboard
 *
 * ## Transition Triggers
 *
 * | From     | To       | Trigger                              | Type      |
 * |----------|----------|--------------------------------------|-----------||
 * | New      | Enrolled | Intro class payment completed        | Automatic |
 * | Enrolled | Full     | Admin promotes member                | Manual    |
 * | New      | Full     | Admin promotes member (skip intro)   | Manual    |
 *
 * @see MemberProfile - The model that uses this status
 * @see DashboardPage - UI that renders differently based on status
 */
export const MemberStatus = {
  /** Member has not enrolled in an intro class */
  New: 'New',
  /** Member has paid for an intro class, awaiting completion */
  Enrolled: 'Enrolled',
  /** Member has full club privileges (manually set by admin) */
  Full: 'Full',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
