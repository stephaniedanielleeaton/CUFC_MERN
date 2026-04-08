export interface EmailList {
  id: string;
  name: string;
  emails: string[];
}

export interface EmailListSummaryDTO {
  id: string;
  name: string;
  size: number;
}

export interface AddEmailRequest {
  email: string;
}

export interface RemoveEmailRequest {
  email: string;
}
