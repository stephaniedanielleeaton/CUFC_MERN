import type { MemberStatus } from './MemberStatus.js';

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type PersonalInfo = {
  legalFirstName?: string;
  legalLastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;
  address?: Address;
};

export type FamilyMember = {
  name?: string;
  relationship?: string;
  dateOfBirth?: string | null;
};

export type Guardian = {
  firstName?: string;
  lastName?: string;
};

export type GuestProfileInput = {
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
};

export type MemberProfileDTO = {
  _id: string;
  auth0Id?: string;
  displayFirstName?: string;
  displayLastName?: string;
  personalInfo?: PersonalInfo;
  guardian?: Guardian;
  familyMembers?: FamilyMember[];
  isWaiverOnFile?: boolean;
  isPaymentWaived?: boolean;
  isArchived?: boolean;
  notes?: string;
  lastAttendanceCheckIn?: string | null;
  profileComplete?: boolean;
  memberStatus?: MemberStatus;
  squareCustomerId?: string;
  createdAt?: string;
  updatedAt?: string;
  subscriptionStatus?: string;
  isSubscriptionActive?: boolean;
  hasPaidDropInToday?: boolean;
  role?: string;
};

export type MemberProfileFormInput = MemberProfileDTO & {
  profileId: string;
};
