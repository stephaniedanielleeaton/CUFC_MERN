import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailList extends Document {
  id: string;
  name: string;
  emails: string[];
  created_at: Date;
  updated_at: Date;
}

const emailListSchema = new Schema<IEmailList>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  emails: [{
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter valid email addresses']
  }],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export const EmailList: Model<IEmailList> = mongoose.models.EmailList || mongoose.model<IEmailList>('EmailList', emailListSchema);
