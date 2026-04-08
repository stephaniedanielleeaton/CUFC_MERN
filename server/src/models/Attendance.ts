import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AttendanceDto } from '../types/dtos/attendance';

export interface IAttendance extends Document<Types.ObjectId> {
  userId: string;
  timestamp: Date;
  toDTO(): AttendanceDto;
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

AttendanceSchema.methods.toDTO = function(): AttendanceDto {
  return {
    id: this._id.toString(),
    userId: this.userId,
    timestamp: this.timestamp instanceof Date ? this.timestamp.toISOString() : String(this.timestamp),
  };
};

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
