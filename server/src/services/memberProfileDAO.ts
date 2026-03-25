import { MemberProfile, IMemberProfile, mapMemberDocToDTO } from '../models/MemberProfile';
import { MemberProfileDTO } from '@cufc/shared';
import { dbConnect } from '../config/database';

export async function findAll(): Promise<MemberProfileDTO[]> {
  await dbConnect();
  const profiles = await MemberProfile.find({}).sort({ displayLastName: 1 });
  return profiles.map(mapMemberDocToDTO);
}

export async function findAllIds(): Promise<string[]> {
  await dbConnect();
  const profiles = await MemberProfile.find({}, { _id: 1 });
  return profiles.map((p) => p.id);
}

export async function findByAuth0Id(auth0Id: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const doc = await MemberProfile.findOne({ auth0Id });
  return doc ? mapMemberDocToDTO(doc) : null;
}

export async function findById(id: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const doc = await MemberProfile.findById(id);
  return doc ? mapMemberDocToDTO(doc) : null;
}

export async function findByEmailUnlinked(email: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();
  const doc = await MemberProfile.findOne({
    'personalInfo.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    $or: [{ auth0Id: { $exists: false } }, { auth0Id: null }, { auth0Id: '' }]
  });
  return doc ? mapMemberDocToDTO(doc) : null;
}

export async function create(data: Partial<IMemberProfile>): Promise<MemberProfileDTO> {
  await dbConnect();
  const doc = await MemberProfile.create(data);
  return mapMemberDocToDTO(doc);
}

export async function updateById(id: string, updateSet: Record<string, unknown>): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const updated = await MemberProfile.findByIdAndUpdate(
    id,
    { $set: updateSet },
    { new: true }
  );
  return updated ? mapMemberDocToDTO(updated) : null;
}

export async function deleteById(id: string): Promise<boolean> {
  await dbConnect();
  const deleted = await MemberProfile.findByIdAndDelete(id);
  return !!deleted;
}

export async function findSquareCustomerIdById(id: string): Promise<string | null> {
  await dbConnect();
  const member = await MemberProfile.findById(id, { squareCustomerId: 1 });
  return member?.squareCustomerId ?? null;
}

export async function findAllWithSquareCustomerId(): Promise<{ memberId: string; squareCustomerId: string }[]> {
  await dbConnect();
  const members = await MemberProfile.find(
    { squareCustomerId: { $exists: true, $ne: null } },
    { _id: 1, squareCustomerId: 1 }
  );

  return members
    .filter((m): m is typeof m & { squareCustomerId: string } => !!m.squareCustomerId)
    .map((m) => ({
      memberId: m.id,
      squareCustomerId: m.squareCustomerId,
    }));
}

export async function linkAuth0Id(id: string, auth0Id: string): Promise<MemberProfileDTO | null> {
  await dbConnect();
  const doc = await MemberProfile.findById(id);
  if (!doc) return null;
  doc.auth0Id = auth0Id;
  await doc.save();
  return mapMemberDocToDTO(doc);
}

export const memberProfileDAO = {
  findAll,
  findAllIds,
  findByAuth0Id,
  findById,
  findByEmailUnlinked,
  create,
  updateById,
  deleteById,
  findSquareCustomerIdById,
  findAllWithSquareCustomerId,
  linkAuth0Id,
};
