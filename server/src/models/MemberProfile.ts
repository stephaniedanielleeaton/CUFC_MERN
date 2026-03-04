import mongoose, { Schema, Document } from 'mongoose';
import { MemberStatus } from '@cufc/shared';

const AddressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
}, { _id: false });

const PersonalInfoSchema = new Schema({
  legalFirstName: String,
  legalLastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  address: AddressSchema,
}, { _id: false });

const FamilyMemberSchema = new Schema({
  name: String,
  relationship: String,
  dateOfBirth: Date,
}, { _id: false });

const GuardianSchema = new Schema({
  firstName: String,
  lastName: String,
}, { _id: false });

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface IPersonalInfo {
  legalFirstName?: string;
  legalLastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: IAddress;
}

export interface IGuardian {
  firstName?: string;
  lastName?: string;
}

export interface IFamilyMember {
  name?: string;
  relationship?: string;
  dateOfBirth?: Date;
}

export interface IMemberProfile extends Document {
  auth0Id?: string;
  displayFirstName?: string;
  displayLastName?: string;
  personalInfo?: IPersonalInfo;
  guardian?: IGuardian;
  familyMembers?: IFamilyMember[];
  isWaiverOnFile?: boolean;
  isPaymentWaived?: boolean;
  notes?: string;
  lastAttendanceCheckIn?: Date;
  profileComplete?: boolean;
  memberStatus?: MemberStatus;
  createdAt?: Date;
  updatedAt?: Date;
  squareCustomerId?: string;
}

const MemberProfileSchema = new Schema<IMemberProfile>({
  auth0Id: { type: String, index: true, unique: true, sparse: true },
  displayFirstName: String,
  displayLastName: String,
  personalInfo: PersonalInfoSchema,
  guardian: GuardianSchema,
  familyMembers: [FamilyMemberSchema],
  isWaiverOnFile: Boolean,
  isPaymentWaived: { type: Boolean, default: false },
  notes: String,
  lastAttendanceCheckIn: Date,
  memberStatus: { type: String, enum: ['New', 'Full'], default: 'New' },
  profileComplete: { type: Boolean, default: false },
  squareCustomerId: String,
}, { timestamps: true });

export const MemberProfile = mongoose.models.MemberProfile || mongoose.model<IMemberProfile>('MemberProfile', MemberProfileSchema);
