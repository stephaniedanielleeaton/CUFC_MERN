import { MemberProfile } from '../models/MemberProfile';
import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/appTime';
import { MemberCheckIn, AttendanceScreenMember, AttendanceRecord, MemberStatus } from '@cufc/shared';
import { dbConnect } from '../config/database';
import { attendanceDAO } from '../dao/attendanceDAO';
import { memberProfileService } from './memberProfileService';

export interface RecentAttendanceDTO {
  memberId: string;
  lastCheckIn: string | null;
}

export async function getMembersWithCheckInStatus(): Promise<MemberCheckIn[]> {
  await dbConnect();
  const members = await MemberProfile.find(
    { 
      isArchived: { $ne: true },
      memberStatus: { $in: [MemberStatus.Enrolled, MemberStatus.Full] }
    },
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

  const todaysAttendanceRecords = await attendanceDAO.findTodayAttendance(todayStartUtc, todayEndUtc);

  const checkedInMemberIds = new Set(todaysAttendanceRecords.map((record) => record.userId.toString()));

  return membersWithDisplayNames.map((member) => ({
    id: member._id.toString(),
    displayFirstName: member.displayFirstName,
    displayLastName: member.displayLastName,
    isCheckedIn: checkedInMemberIds.has(member._id.toString()),
  }));
}

export async function checkInMember(memberId: string): Promise<{ checkedIn: boolean }> {
  const currentTimeInAppTimezone = DateTime.now().setZone(APP_TIMEZONE);
  const todayStartUtc = currentTimeInAppTimezone.startOf('day').toUTC().toJSDate();
  const todayEndUtc = currentTimeInAppTimezone.endOf('day').toUTC().toJSDate();

  const existingCheckIn = await attendanceDAO.findByUserIdAndDateRange(memberId, todayStartUtc, todayEndUtc);

  if (!existingCheckIn) {
    await attendanceDAO.createAttendance(memberId);
    return { checkedIn: true };
  } else {
    await attendanceDAO.deleteAttendanceById(existingCheckIn.id);
    return { checkedIn: false };
  }
}

export async function getMemberAttendanceHistory(memberId: string, maxRecords: number = 100): Promise<AttendanceRecord[]> {
  const attendanceRecords = await attendanceDAO.findByUserId(memberId, maxRecords);

  return attendanceRecords.map((record): AttendanceRecord => ({
    id: record.id,
    timestamp: record.timestamp,
  }));
}

export async function getRecentAttendanceForAllMembers(memberIds: string[]): Promise<RecentAttendanceDTO[]> {
  const mostRecentByMember = await attendanceDAO.getMostRecentByMemberIds(memberIds);

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
  const mostRecentCheckIn = await attendanceDAO.findMostRecentByUserId(memberId);

  if (!mostRecentCheckIn) {
    return { timestamp: null };
  }

  const timestampAsIsoString = mostRecentCheckIn.timestamp;

  return { timestamp: timestampAsIsoString };
}

export async function getRecentAttendance(): Promise<RecentAttendanceDTO[]> {
  const memberIds = await memberProfileService.getAllIds();
  return getRecentAttendanceForAllMembers(memberIds);
}

export const attendanceService = {
  getMembersWithCheckInStatus,
  checkInMember,
  getMemberHistory: getMemberAttendanceHistory,
  getRecentAttendance,
  getLastCheckIn: getLastCheckInForMember,
};
