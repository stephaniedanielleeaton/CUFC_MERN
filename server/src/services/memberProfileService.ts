import { MemberProfileDTO, MemberUpdateData, GuestProfileInput, MemberUpdateDataMapper } from '@cufc/shared';
import { memberProfileDAO } from '../dao/memberProfileDAO';
import { squareCustomersService } from './square';

async function getOrCreateSquareCustomer(
  email: string,
  profileData?: { displayFirstName?: string; displayLastName?: string }
): Promise<string | undefined> {
  try {
    const customer = await squareCustomersService.getOrCreate({
      email,
      givenName: profileData?.displayFirstName,
      familyName: profileData?.displayLastName,
    });
    return customer?.id;
  } catch {
    return undefined;
  }
}

export async function getAllMemberProfiles(): Promise<MemberProfileDTO[]> {
  return memberProfileDAO.findAll();
}

export async function getAllMemberIds(): Promise<string[]> {
  return memberProfileDAO.findAllIds();
}

export async function getProfileForUser(auth0Id: string): Promise<MemberProfileDTO | null> {
  return memberProfileDAO.findByAuth0Id(auth0Id);
}

async function buildProfileUpdateData(
  data: GuestProfileInput,
  existingSquareCustomerId: string | undefined,
  email: string
): Promise<MemberUpdateData> {
  const updateData: MemberUpdateData = {
    displayFirstName: data.displayFirstName,
    displayLastName: data.displayLastName,
    pronouns: data.pronouns,
    personalInfo: data.personalInfo
      ? {
          ...data.personalInfo,
          dateOfBirth: data.personalInfo.dateOfBirth || null,
        }
      : undefined,
    ...(data.guardian ? { guardian: data.guardian } : {}),
    profileComplete: data.profileComplete ?? true,
  };
  if (!existingSquareCustomerId) {
    const squareCustomerId = await getOrCreateSquareCustomer(email, data);
    if (squareCustomerId) updateData.squareCustomerId = squareCustomerId;
  }
  return updateData;
}

async function linkAndUpdateExistingProfile(
  existingProfile: MemberProfileDTO,
  auth0Id: string,
  email: string,
  initialData: GuestProfileInput
): Promise<MemberProfileDTO> {
  console.log(`[createProfileForUser] Linking auth0Id ${auth0Id} to existing profile ${existingProfile._id}`);

  const updateData = await buildProfileUpdateData(initialData, existingProfile.squareCustomerId, email);
  const updated = await memberProfileDAO.linkAuth0IdAndUpdate(
    existingProfile._id,
    auth0Id,
    MemberUpdateDataMapper.toMongoSet(updateData)
  );
  if (!updated) throw new Error('Failed to link and update existing profile');
  return updated;
}

export async function createProfileForUser(
  auth0Id: string,
  initialData: GuestProfileInput
): Promise<MemberProfileDTO> {
  const email = initialData.personalInfo?.email?.toLowerCase().trim();
  if (!email) throw new Error('Email is required to create a member profile');

  const existingProfile = await memberProfileDAO.findByEmailUnlinked(email);
  console.log(`[createProfileForUser] Looking for existing profile with email: ${email}, found: ${existingProfile ? existingProfile._id : 'none'}`);

  if (existingProfile) {
    return linkAndUpdateExistingProfile(existingProfile, auth0Id, email, initialData);
  }

  const squareCustomerId = await getOrCreateSquareCustomer(email, initialData);
  return memberProfileDAO.create({
    auth0Id,
    displayFirstName: initialData.displayFirstName,
    displayLastName: initialData.displayLastName,
    pronouns: initialData.pronouns,
    personalInfo: initialData.personalInfo
      ? {
          ...initialData.personalInfo,
          dateOfBirth: initialData.personalInfo.dateOfBirth
            ? new Date(initialData.personalInfo.dateOfBirth)
            : undefined,
        }
      : undefined,
    guardian: initialData.guardian,
    profileComplete: initialData.profileComplete,
    ...(squareCustomerId ? { squareCustomerId } : {}),
  });
}

export async function getMemberProfileById(id: string): Promise<MemberProfileDTO | null> {
  return memberProfileDAO.findById(id);
}

export async function updateMemberProfileById(
  id: string,
  data: MemberUpdateData
): Promise<MemberProfileDTO | null> {
  return memberProfileDAO.updateById(id, MemberUpdateDataMapper.toMongoSet(data));
}

export async function deleteMemberProfileById(id: string): Promise<boolean> {
  return memberProfileDAO.deleteById(id);
}

export async function getSquareCustomerIdForMember(memberId: string): Promise<string | null> {
  return memberProfileDAO.findSquareCustomerIdById(memberId);
}

export async function getMembersWithSquareCustomerId(): Promise<{ memberId: string; squareCustomerId: string }[]> {
  return memberProfileDAO.findAllWithSquareCustomerId();
}

export async function getAllMemberEmails(): Promise<string[]> {
  return memberProfileDAO.findAllEmails();
}

export async function createGuestProfile(data: GuestProfileInput): Promise<{ profile: MemberProfileDTO; isExisting: boolean }> {
  const email = data.personalInfo?.email?.toLowerCase().trim();

  // If an unlinked profile already exists for this email, return it without
  // applying the submitted data. Updating an unlinked profile from an
  // unauthenticated request would allow any caller who knows the email address
  // to overwrite another person's profile data.
  if (email) {
    const existingProfile = await memberProfileDAO.findByEmailUnlinked(email);
    if (existingProfile) {
      if (existingProfile.squareCustomerId) return { profile: existingProfile, isExisting: true };
      const squareCustomerId = await getOrCreateSquareCustomer(email, existingProfile);
      if (squareCustomerId) {
        const updated = await memberProfileDAO.updateById(existingProfile._id, { squareCustomerId }) ?? existingProfile;
        return { profile: updated, isExisting: true };
      }
      return { profile: existingProfile, isExisting: true };
    }
  }

  const squareCustomerId = email ? await getOrCreateSquareCustomer(email, data) : undefined;

  // Create new guest profile (no auth0Id)
  const profile = await memberProfileDAO.create({
    displayFirstName: data.displayFirstName,
    displayLastName: data.displayLastName,
    pronouns: data.pronouns,
    personalInfo: data.personalInfo
      ? {
          legalFirstName: data.personalInfo.legalFirstName,
          legalLastName: data.personalInfo.legalLastName,
          email: data.personalInfo.email,
          phone: data.personalInfo.phone,
          dateOfBirth: data.personalInfo.dateOfBirth
            ? new Date(data.personalInfo.dateOfBirth)
            : undefined,
          address: data.personalInfo.address,
        }
      : undefined,
    guardian: data.guardian,
    profileComplete: data.profileComplete ?? true,
    ...(squareCustomerId ? { squareCustomerId } : {}),
  });
  return { profile, isExisting: false };
}

export async function findAndLinkByEmail(auth0Id: string, email: string): Promise<MemberProfileDTO | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Find a profile with matching email that has no auth0Id linked
  const existingProfile = await memberProfileDAO.findByEmailUnlinked(normalizedEmail);

  if (!existingProfile) {
    console.log(`[findAndLinkByEmail] No unlinked profile found for email: ${normalizedEmail}`);
    return null;
  }

  // Link the auth0Id to the existing profile
  console.log(`[findAndLinkByEmail] Linking auth0Id ${auth0Id} to existing profile ${existingProfile._id} with email ${normalizedEmail}`);

  const linked = await memberProfileDAO.linkAuth0Id(existingProfile._id, auth0Id);

  if (linked && !existingProfile.squareCustomerId) {
    const squareCustomerId = await getOrCreateSquareCustomer(normalizedEmail, {
      displayFirstName: existingProfile.displayFirstName,
      displayLastName: existingProfile.displayLastName,
    });
    if (squareCustomerId) {
      console.log(`[findAndLinkByEmail] Created Square customer ${squareCustomerId} for linked profile ${existingProfile._id}`);
      return await memberProfileDAO.updateById(existingProfile._id, { squareCustomerId }) ?? linked;
    }
  }

  return linked;
}

export const memberProfileService = {
  getAll: getAllMemberProfiles,
  getAllIds: getAllMemberIds,
  getById: getMemberProfileById,
  getByAuth0Id: getProfileForUser,
  create: createProfileForUser,
  createGuest: createGuestProfile,
  update: updateMemberProfileById,
  delete: deleteMemberProfileById,
  getSquareCustomerId: getSquareCustomerIdForMember,
  getMembersWithSquareCustomerId,
  getAllEmails: getAllMemberEmails,
  findAndLinkByEmail,
};
