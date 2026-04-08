export interface SendToListRequest {
  emailListIds?: string[];
  additionalEmails?: string[];
  subject: string;
  message: string;
  template?: string;
}

export interface SendToListResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  failures: { email: string; error: string }[];
  blockedEmails: string[];
}
