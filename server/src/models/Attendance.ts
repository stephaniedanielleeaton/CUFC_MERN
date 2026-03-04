import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  userId: string;
  timestamp: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
