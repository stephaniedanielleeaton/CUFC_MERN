import type { PersonalInfo, Guardian } from './MemberProfile.js';

export type MemberUpdateData = {
  auth0Id?: string;
  displayFirstName?: string;
  displayLastName?: string;
  personalInfo?: PersonalInfo;
  guardian?: Guardian;
  profileComplete?: boolean;
  isWaiverOnFile?: boolean;
  isPaymentWaived?: boolean;
  isArchived?: boolean;
  memberStatus?: string;
  squareCustomerId?: string;
  notes?: string;
};

export class MemberUpdateDataMapper {
  private static setField<T>(obj: Record<string, T>, key: string, value: T | undefined): void {
    if (value !== undefined) obj[key] = value;
  }

  private static buildAddressFields(address: NonNullable<PersonalInfo>['address']): Record<string, unknown> {
    if (!address) return {};
    return {
      'personalInfo.address.street': address.street,
      'personalInfo.address.city': address.city,
      'personalInfo.address.state': address.state,
      'personalInfo.address.zip': address.zip,
      'personalInfo.address.country': address.country,
    };
  }

  private static buildGuardianFields(guardian: Guardian | undefined): Record<string, unknown> {
    if (!guardian) return {};
    return {
      guardian: {
        firstName: guardian.firstName ?? '',
        lastName: guardian.lastName ?? '',
      },
    };
  }

  static toMongoSet(data: MemberUpdateData): Record<string, unknown> {
    const set: Record<string, unknown> = {};
    const personalInfo = data.personalInfo;

    this.setField(set, 'displayFirstName', data.displayFirstName);
    this.setField(set, 'displayLastName', data.displayLastName);

    if (personalInfo) {
      this.setField(set, 'personalInfo.legalFirstName', personalInfo.legalFirstName);
      this.setField(set, 'personalInfo.legalLastName', personalInfo.legalLastName);
      this.setField(set, 'personalInfo.email', personalInfo.email);
      this.setField(set, 'personalInfo.phone', personalInfo.phone);
      if (personalInfo.dateOfBirth !== undefined) set['personalInfo.dateOfBirth'] = personalInfo.dateOfBirth || null;
      if (personalInfo.address) Object.assign(set, this.buildAddressFields(personalInfo.address));
    }

    if (data.guardian !== undefined) Object.assign(set, this.buildGuardianFields(data.guardian));

    this.setField(set, 'profileComplete', data.profileComplete);
    this.setField(set, 'isWaiverOnFile', data.isWaiverOnFile);
    this.setField(set, 'isPaymentWaived', data.isPaymentWaived);
    this.setField(set, 'isArchived', data.isArchived);
    this.setField(set, 'memberStatus', data.memberStatus);
    this.setField(set, 'squareCustomerId', data.squareCustomerId);
    this.setField(set, 'notes', data.notes);

    return set;
  }
}
