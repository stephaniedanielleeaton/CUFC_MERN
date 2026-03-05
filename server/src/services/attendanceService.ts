import { MemberProfile } from '../models/MemberProfile';
import { Attendance } from '../models/Attendance';
import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/appTime';
import { MemberCheckIn, AttendanceScreenMember, AttendanceRecord } from '@cufc/shared';
import { dbConnect } from '../config/database';

export interface RecentAttendanceDTO {
  memberId: string;
  lastCheckIn: string | null;
}

export async function getMembersWithCheckInStatus(): Promise<MemberCheckIn[]> {
  await dbConnect();
  const members = await MemberProfile.find(
    { isArchived: { $ne: true } },
    {
      displayFirstName: 1,
      displayLastName: 1,
      _id: 1,
    }
  ).lean();

  const membersWithDisplayNames = members as AttendanceScreenMember[];

  const currentTimeInAppTimezone = DateTime.now().setZone(APP_TIMEZONE);
  const todayStartUtc = currentTimeInAppTimezone.startOf('day').toUTC().toJSDate();
  const todayEndUtc = currentTimeInAppTimezone.endOf('day').toUTC().toJSDate();

  const todaysAttendanceRecords = await Attendance.find({
    timestamp: { $gte: todayStartUtc, $lte: todayEndUtc },
  }).lean();

  const checkedInMemberIds = new Set(todaysAttendanceRecords.map((record) => record.userId.toString()));

  return membersWithDisplayNames.map((member) => ({
    id: member._id.toString(),
    displayFirstName: member.displayFirstName,
    displayLastName: member.displayLastName,
    isCheckedIn: checkedInMemberIds.has(member._id.toString()),
  }));
}

export async function checkInMember(memberId: string): Promise<{ checkedIn: boolean }> {
  await dbConnect();
  const currentTimeInAppTimezone = DateTime.now().setZone(APP_TIMEZONE);
  const todayStartUtc = currentTimeInAppTimezone.startOf('day').toUTC().toJSDate();
  const todayEndUtc = currentTimeInAppTimezone.endOf('day').toUTC().toJSDate();

  const existingCheckIn = await Attendance.findOne({
    userId: memberId,
    timestamp: { $gte: todayStartUtc, $lte: todayEndUtc },
  });

  if (!existingCheckIn) {
    await Attendance.create({ userId: memberId });
    return { checkedIn: true };
  } else {
    await Attendance.deleteOne({ _id: existingCheckIn._id });
    return { checkedIn: false };
  }
}

export async function getMemberAttendanceHistory(memberId: string, maxRecords: number = 100): Promise<AttendanceRecord[]> {
  await dbConnect();
  const attendanceRecords = await Attendance.find({ userId: memberId })
    .sort({ timestamp: -1 })
    .limit(maxRecords)
    .lean();
  
  return attendanceRecords.map((record): AttendanceRecord => ({
    id: String(record._id),
    timestamp: record.timestamp instanceof Date ? record.timestamp.toISOString() : String(record.timestamp),
  }));
}

export async function getRecentAttendanceForAllMembers(memberIds: string[]): Promise<RecentAttendanceDTO[]> {
  await dbConnect();
  
  type MostRecentAttendanceByMember = { _id: string; mostRecentTimestamp: string };
  const mostRecentByMember = await Attendance.aggregate([
    { $match: { userId: { $in: memberIds } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$userId', mostRecentTimestamp: { $first: '$timestamp' } } },
  ]) as MostRecentAttendanceByMember[];

  const lastCheckInByMemberId: Record<string, string> = {};
  mostRecentByMember.forEach((entry) => {
    lastCheckInByMemberId[entry._id] = entry.mostRecentTimestamp;
  });

  return memberIds.map((memberId): RecentAttendanceDTO => ({
    memberId,
    lastCheckIn: lastCheckInByMemberId[memberId] || null,
  }));
}

export interface LastCheckInDTO {
  timestamp: string | null;
}

export async function getLastCheckInForMember(memberId: string): Promise<LastCheckInDTO> {
  await dbConnect();
  const mostRecentCheckIn = await Attendance.findOne({ userId: memberId })
    .sort({ timestamp: -1 })
    .lean();

  if (!mostRecentCheckIn) {
    return { timestamp: null };
  }

  const timestampAsIsoString = mostRecentCheckIn.timestamp instanceof Date 
    ? mostRecentCheckIn.timestamp.toISOString() 
    : String(mostRecentCheckIn.timestamp);

  return { timestamp: timestampAsIsoString };
}
