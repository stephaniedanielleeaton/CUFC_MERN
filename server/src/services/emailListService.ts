import { emailListDAO } from '../dao/emailListDAO';
import { EmailListSummaryDTO } from '../types/dtos/emailList';

/**
 * Service for email list business logic
 * Uses DAO for data access and returns DTOs
 */
export class EmailListService {

  async getEmailListSummaries(): Promise<EmailListSummaryDTO[]> {
    return emailListDAO.getAllListSummary();
  }


  async addEmailToPromotionalList(email: string): Promise<void> {
    try {
      try {
        await emailListDAO.removeEmailFromList('do-not-contact', email);
      } catch (error) {
        // If do-not-contact list doesn't exist or email not in it, continue
        if (!(error instanceof Error && error.message.includes('not found'))) {
          console.log('Note: Could not remove from do-not-contact list:', error);
        }
      }
      await emailListDAO.addEmailToList('promotional', email);
    } catch (error) {
      console.error('Error adding email to promotional list:', error);
      throw error;
    }
  }

  async removeEmailFromPromotionalList(email: string): Promise<void> {
    try {
      await emailListDAO.removeEmailFromList('promotional', email);

      // Add to do-not-contact list
      try {
        await emailListDAO.addEmailToList('do-not-contact', email);
      } catch (error) {
        // If do-not-contact list doesn't exist, create it first
        if (error instanceof Error && error.message.includes('not found')) {
          const { EmailList } = await import('../models/EmailList');
          const newList = new EmailList({
            name: 'Do Not Contact',
            emails: [email]
          });
          await newList.save();
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error removing email from promotional list:', error);
      throw error;
    }
  }
}

export const emailListService = new EmailListService();
