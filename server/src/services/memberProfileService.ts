import { MemberProfile, IMemberProfile, mapMemberDocToDTO } from '../models/MemberProfile';
import { MemberUpdateData, MemberProfileDTO } from '@cufc/shared';
import { dbConnect } from '../config/database';
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

function buildMemberMongoUpdateSet(data: MemberUpdateData) {
  return {
    ...(data.displayFirstName !== undefined && { displayFirstName: data.displayFirstName }),
    ...(data.displayLastName !== undefined && { displayLastName: data.displayLastName }),
    ...(data.personalInfo?.legalFirstName !== undefined && { 'personalInfo.legalFirstName': data.personalInfo.legalFirstName }),
    ...(data.personalInfo?.legalLastName !== undefined && { 'personalInfo.legalLastName': data.personalInfo.legalLastName }),
    ...(data.personalInfo?.email !== undefined && { 'personalInfo.email': data.personalInfo.email }),
    ...(data.personalInfo?.phone !== undefined && { 'personalInfo.phone': data.personalInfo.phone }),
    ...(data.personalInfo?.dateOfBirth !== undefined && { 'personalInfo.dateOfBirth': data.personalInfo.dateOfBirth || null }),
    ...(data.personalInfo?.address !== undefined && {
      'personalInfo.address.street': data.personalInfo.address?.street,
      'personalInfo.address.city': data.personalInfo.address?.city,
      'personalInfo.address.state': data.personalInfo.address?.state,
      'personalInfo.address.zip': data.personalInfo.address?.zip,
      'personalInfo.address.country': data.personalInfo.address?.country,
    }),
    ...(data.guardian !== undefined && {
      guardian: {
        firstName: data.guardian?.firstName ?? '',
        lastName: data.guardian?.lastName ?? '',
      },
    }),
    ...(data.profileComplete !== undefined && { profileComplete: data.profileComplete }),
    ...(data.isWaiverOnFile !== undefined && { isWaiverOnFile: data.isWaiverOnFile }),
    ...(data.isPaymentWaived !== undefined && { isPaymentWaived: data.isPaymentWaived }),
    ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    ...(data.memberStatus !== undefined && { memberStatus: data.memberStatus }),
    ...(data.squareCustomerId !== undefined && { squareCustomerId: data.squareCustomerId }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
}

export async function getAllMemberProfiles(): Promise<MemberProfileDTO[]> {
  await dbConnect();
  const profiles = await MemberProfile.find({}).sort({ displayLastName: 1 });
  return profiles.map(mapMemberDocToDTO);
}

export async function getAllMemberIds(): Promise<string[]> {
  await dbConnect();
  const profiles = await MemberProfile.find({}, { _id: 1 }).lean();
  return profiles.map((p) => String(p._id));
}

export async function getProfileForUser(auth0Id: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const doc = await MemberProfile.findOne({ auth0Id });
  return doc ? mapMemberDocToDTO(doc) : null;
}

export async function createProfileForUser(
  auth0Id: string,
  initialData?: { displayFirstName?: string; displayLastName?: string; personalInfo?: { email?: string }; guardian?: { firstName?: string; lastName?: string } }
): Promise<MemberProfileDTO> {
  await dbConnect();
  
  const email = initialData?.personalInfo?.email?.toLowerCase().trim();
  
  // Check if an existing profile with this email exists but has no auth0Id linked
  if (email) {
    const existingProfile = await MemberProfile.findOne({
      'personalInfo.email': { $regex: new RegExp(`^${email}$`, 'i') },
      $or: [{ auth0Id: { $exists: false } }, { auth0Id: null }, { auth0Id: '' }]
    });
    
    console.log(`[createProfileForUser] Looking for existing profile with email: ${email}, found: ${existingProfile ? existingProfile._id : 'none'}`);
    
    if (existingProfile) {
      // Link the auth0Id to the existing profile
      console.log(`[createProfileForUser] Linking auth0Id ${auth0Id} to existing profile ${existingProfile._id}`);
      existingProfile.auth0Id = auth0Id;
      await existingProfile.save();
      return mapMemberDocToDTO(existingProfile);
    }
  }
  
  // No existing profile found, create a new one
  const squareCustomerId = await createSquareCustomerIfEmailProvided(email, initialData);
  
  const doc = await MemberProfile.create({ 
    auth0Id, 
    ...(initialData ?? {}),
    ...(squareCustomerId ? { squareCustomerId } : {})
  });
  return mapMemberDocToDTO(doc);
}

export async function getMemberProfileById(id: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const doc = await MemberProfile.findById(id);
  return doc ? mapMemberDocToDTO(doc) : null;
}

export async function updateMemberProfileById(
  id: string,
  data: MemberUpdateData
): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const updated = await MemberProfile.findByIdAndUpdate(
    id,
    { $set: buildMemberMongoUpdateSet(data) },
    { new: true }
  );
  return updated ? mapMemberDocToDTO(updated) : null;
}

export async function deleteMemberProfileById(id: string): Promise<boolean> {
  await dbConnect();
  const deleted = await MemberProfile.findByIdAndDelete(id);
  return !!deleted;
}

export async function getSquareCustomerIdForMember(memberId: string): Promise<string | null> {
  await dbConnect();
  const member = await MemberProfile.findById(memberId, { squareCustomerId: 1 }).lean() as { squareCustomerId?: string } | null;
  return member?.squareCustomerId ?? null;
}

export async function getMembersWithSquareCustomerId(): Promise<{ memberId: string; squareCustomerId: string }[]> {
  await dbConnect();
  type MemberWithSquare = { _id: unknown; squareCustomerId?: string };
  const members = await MemberProfile.find(
    { squareCustomerId: { $exists: true, $ne: null } },
    { _id: 1, squareCustomerId: 1 }
  ).lean() as MemberWithSquare[];
  
  return members
    .filter((m): m is MemberWithSquare & { squareCustomerId: string } => !!m.squareCustomerId)
    .map((m) => ({
      memberId: String(m._id),
      squareCustomerId: m.squareCustomerId,
    }));
}

export async function findAndLinkByEmail(auth0Id: string, email: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Find a profile with matching email that has no auth0Id linked
  const existingProfile = await MemberProfile.findOne({
    'personalInfo.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    $or: [{ auth0Id: { $exists: false } }, { auth0Id: null }, { auth0Id: '' }]
  });
  
  if (!existingProfile) {
    console.log(`[findAndLinkByEmail] No unlinked profile found for email: ${normalizedEmail}`);
    return null;
  }
  
  // Link the auth0Id to the existing profile
  console.log(`[findAndLinkByEmail] Linking auth0Id ${auth0Id} to existing profile ${existingProfile._id} with email ${normalizedEmail}`);
  existingProfile.auth0Id = auth0Id;
  await existingProfile.save();
  
  return mapMemberDocToDTO(existingProfile);
}

export const memberProfileService = {
  getAll: getAllMemberProfiles,
  getAllIds: getAllMemberIds,
  getById: getMemberProfileById,
  getByAuth0Id: getProfileForUser,
  create: createProfileForUser,
  update: updateMemberProfileById,
  delete: deleteMemberProfileById,
  getSquareCustomerId: getSquareCustomerIdForMember,
  getMembersWithSquareCustomerId,
  findAndLinkByEmail,
};
