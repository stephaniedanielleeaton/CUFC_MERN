import { SquareClient } from 'square';
import { env } from '../../config/env';
import { SquareCustomerDto, mapCustomerToDto } from './dto';

export class SquareCustomersService {
  private readonly client: SquareClient;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Customers API Error:', error);
  }

  async getById(customerId: string): Promise<SquareCustomerDto | null> {
    try {
      const response = await this.client.customers.get({ customerId });
      return response.customer ? mapCustomerToDto(response.customer) : null;
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  async getByEmail(email: string): Promise<SquareCustomerDto | null> {
    try {
      const response = await this.client.customers.search({
        query: {
          filter: {
            emailAddress: { exact: email },
          },
        },
      });
      const customer = response.customers?.[0];
      return customer ? mapCustomerToDto(customer) : null;
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  async searchByEmail(email: string): Promise<SquareCustomerDto[]> {
    try {
      const response = await this.client.customers.search({
        query: {
          filter: {
            emailAddress: { exact: email },
          },
        },
      });
      return (response.customers ?? []).map(mapCustomerToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async create(params: {
    email: string;
    givenName?: string;
    familyName?: string;
    referenceId?: string;
  }): Promise<SquareCustomerDto | null> {
    try {
      const response = await this.client.customers.create({
        emailAddress: params.email,
        givenName: params.givenName,
        familyName: params.familyName,
        referenceId: params.referenceId,
      });
      return response.customer ? mapCustomerToDto(response.customer) : null;
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async getOrCreate(params: {
    email: string;
    givenName?: string;
    familyName?: string;
    referenceId?: string;
  }): Promise<SquareCustomerDto | null> {
    const existing = await this.getByEmail(params.email);
    if (existing) return existing;
    return this.create(params);
  }
}

export const squareCustomersService = new SquareCustomersService();
