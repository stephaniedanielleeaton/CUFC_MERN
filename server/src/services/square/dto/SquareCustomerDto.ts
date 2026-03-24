import type { Square } from 'square';

export interface SquareCustomerDto {
  id: string;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
}

export function mapCustomerToDto(customer: Square.Customer): SquareCustomerDto {
  return {
    id: customer.id ?? '',
    email: customer.emailAddress ?? null,
    givenName: customer.givenName ?? null,
    familyName: customer.familyName ?? null,
  };
}
