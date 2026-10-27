import type { PayMethod } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';
import { PAY_METHODS } from '../mocks/data';

export async function getPayMethods(): Promise<PayMethod[]> {
  if (USE_MOCK) return mockDelay(PAY_METHODS);
  const { data } = await client.get<PayMethod[]>('/payments/methods');
  return data;
}
