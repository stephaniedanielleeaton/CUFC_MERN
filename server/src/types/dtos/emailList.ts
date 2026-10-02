export interface EmailList {
  id: string;
  name: string;
  emails: string[];
}

export interface AddEmailRequest {
  email: string;
}

export interface RemoveEmailRequest {
  email: string;
}
