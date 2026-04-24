import { Attendance, IAttendance } from '../models/Attendance';
import { AttendanceDto } from '../types/dtos/attendance';
import { dbConnect } from '../config/database';

export async function findTodayAttendance(startOfDayUtc: Date, endOfDayUtc: Date): Promise<AttendanceDto[]> {
  await dbConnect();
  const records = await Attendance.find({
    timestamp: { $gte: startOfDayUtc, $lte: endOfDayUtc },
  });
  return records.map((r) => r.toDTO());
}

export async function findByUserIdAndDateRange(userId: string, startUtc: Date, endUtc: Date): Promise<AttendanceDto | null> {
  await dbConnect();
  const record = await Attendance.findOne({
    userId,
    timestamp: { $gte: startUtc, $lte: endUtc },
  });
  return record ? record.toDTO() : null;
}

export async function createAttendance(userId: string): Promise<AttendanceDto> {
  await dbConnect();
  const record = await Attendance.create({ userId });
  return record.toDTO();
}

export async function deleteAttendanceById(id: string): Promise<void> {
  await dbConnect();
  await Attendance.deleteOne({ _id: id });
}

export async function findByUserId(userId: string, limit: number): Promise<AttendanceDto[]> {
  await dbConnect();
  const records = await Attendance.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
  return records.map((r) => r.toDTO());
}

export async function getMostRecentByMemberIds(memberIds: string[]): Promise<{ _id: string; mostRecentTimestamp: string }[]> {
  await dbConnect();
  return Attendance.aggregate([
    { $match: { userId: { $in: memberIds } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$userId', mostRecentTimestamp: { $first: '$timestamp' } } },
  ]) as Promise<{ _id: string; mostRecentTimestamp: string }[]>;
}

export async function findMostRecentByUserId(userId: string): Promise<AttendanceDto | null> {
  await dbConnect();
  const record = await Attendance.findOne({ userId })
    .sort({ timestamp: -1 });
  return record ? record.toDTO() : null;
}

export const attendanceDAO = {
  findTodayAttendance,
  findByUserIdAndDateRange,
  createAttendance,
  deleteAttendanceById,
  findByUserId,
  getMostRecentByMemberIds,
  findMostRecentByUserId,
};
