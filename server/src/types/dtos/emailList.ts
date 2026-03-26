/**
 * Email list with full data including emails array
 */
export interface EmailList {
  id: string;
  name: string;
  emails: string[];
}

/**
 * Email list summary data transfer object
 */
export interface EmailListSummaryDTO {
  id: string;
  name: string;
  size: number;
}

/**
 * Request body for adding email to promotional list
 */
export interface AddEmailRequest {
  email: string;
}

/**
 * Request body for removing email from promotional list
 */
export interface RemoveEmailRequest {
  email: string;
}
