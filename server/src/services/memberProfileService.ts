import { MemberProfileDTO, MemberUpdateData, GuestProfileInput, MemberUpdateDataMapper } from '@cufc/shared';
import { memberProfileDAO } from './memberProfileDAO';
import { squareCustomersService } from './square';

async function createSquareCustomerIfEmailProvided(
  email: string | undefined,
  profileData?: { displayFirstName?: string; displayLastName?: string }
): Promise<string | undefined> {
  if (!email) return undefined;

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

export async function createProfileForUser(
  auth0Id: string,
  initialData?: { displayFirstName?: string; displayLastName?: string; personalInfo?: { email?: string }; guardian?: { firstName?: string; lastName?: string } }
): Promise<MemberProfileDTO> {
  const email = initialData?.personalInfo?.email?.toLowerCase().trim();

  // Check if an existing profile with this email exists but has no auth0Id linked
  if (email) {
    const existingProfile = await memberProfileDAO.findByEmailUnlinked(email);

    console.log(`[createProfileForUser] Looking for existing profile with email: ${email}, found: ${existingProfile ? existingProfile._id : 'none'}`);

    if (existingProfile) {
      // Link the auth0Id to the existing profile
      console.log(`[createProfileForUser] Linking auth0Id ${auth0Id} to existing profile ${existingProfile._id}`);
      const linked = await memberProfileDAO.linkAuth0Id(existingProfile._id, auth0Id);
      if (!linked) throw new Error('Failed to link auth0Id to existing profile');
      return linked;
    }
  }

  // No existing profile found, create a new one
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, initialData);

  return memberProfileDAO.create({
    auth0Id,
    ...(initialData ?? {}),
    ...(squareCustomerId ? { squareCustomerId } : {})
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

export async function createGuestProfile(data: GuestProfileInput): Promise<MemberProfileDTO> {
  const email = data.personalInfo?.email?.toLowerCase().trim();

  // Check if an existing profile with this email exists
  if (email) {
    const existingProfile = await memberProfileDAO.findByEmailUnlinked(email);
    if (existingProfile) {
      // Update the existing profile with the new data
      const updated = await memberProfileDAO.updateById(existingProfile._id, {
        displayFirstName: data.displayFirstName,
        displayLastName: data.displayLastName,
        'personalInfo.legalFirstName': data.personalInfo?.legalFirstName,
        'personalInfo.legalLastName': data.personalInfo?.legalLastName,
        'personalInfo.phone': data.personalInfo?.phone,
        'personalInfo.dateOfBirth': data.personalInfo?.dateOfBirth,
        'personalInfo.address.street': data.personalInfo?.address?.street,
        'personalInfo.address.city': data.personalInfo?.address?.city,
        'personalInfo.address.state': data.personalInfo?.address?.state,
        'personalInfo.address.zip': data.personalInfo?.address?.zip,
        'personalInfo.address.country': data.personalInfo?.address?.country,
        ...(data.guardian ? { guardian: data.guardian } : {}),
        profileComplete: data.profileComplete ?? true,
      });
      if (updated) return updated;
    }
  }

  // Create Square customer if email provided
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, data);

  // Create new guest profile (no auth0Id)
  return memberProfileDAO.create({
    displayFirstName: data.displayFirstName,
    displayLastName: data.displayLastName,
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

  return memberProfileDAO.linkAuth0Id(existingProfile._id, auth0Id);
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
