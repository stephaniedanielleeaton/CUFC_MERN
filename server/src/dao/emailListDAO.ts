import { EmailList } from '../models/EmailList';

export interface EmailListResult {
  id: string;
  name: string;
  emails: string[];
  save(): Promise<EmailListResult>;
}

export class EmailListDAO {
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
