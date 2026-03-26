import { EmailList } from '../models/EmailList';
import { EmailListSummaryDTO } from '../types/dtos/emailList';

export interface EmailListResult {
  id: string;
  name: string;
  emails: string[];
  save(): Promise<EmailListResult>;
}

export class EmailListDAO {
  async getAllListSummary(): Promise<EmailListSummaryDTO[]> {
    try {
      const lists = await EmailList.aggregate([
        {
          $project: {
            _id: 0,
            id: 1,
            name: 1,
            size: { $size: { $ifNull: ['$emails', []] } }
          }
        }
      ]);
      return lists;
    } catch (error) {
      console.error('Error fetching email list summaries in DAO:', error);
      throw error;
    }
  }

  async addEmailToList(listId: string, email: string): Promise<EmailListResult> {
    const list = await EmailList.findOne({ id: listId });
    if (!list) {
      throw new Error(`Email list with ID ${listId} not found`);
    }
    if (!list.emails.includes(email.toLowerCase())) {
      list.emails.push(email);
      await list.save();
    }
    return list;
  }

  async removeEmailFromList(listId: string, email: string): Promise<EmailListResult> {
    const list = await EmailList.findOne({ id: listId });
    if (!list) {
      throw new Error(`Email list with ID ${listId} not found`);
    }
    list.emails = list.emails.filter(e => e.toLowerCase() !== email.toLowerCase());
    await list.save();
    return list;
  }
}

export const emailListDAO = new EmailListDAO();
