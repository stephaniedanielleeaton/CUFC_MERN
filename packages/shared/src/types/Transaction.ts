export interface TransactionLineItem {
  name?: string;
  variationName?: string;
  quantity?: string;
  totalMoney?: { amount?: number; currency?: string };
}

export interface Transaction {
  id?: string;
  createdAt?: string;
  state?: string;
  totalMoney?: { amount?: number; currency?: string };
  lineItems: TransactionLineItem[];
}

export interface AttendanceRecord {
  id: string;
  timestamp: string;
}
