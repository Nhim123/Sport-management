import type { ClassSession } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';
import { CLASSES_TONIGHT } from '../mocks/data';

export async function getTonightClasses(): Promise<ClassSession[]> {
  if (USE_MOCK) return mockDelay(CLASSES_TONIGHT);
  const { data } = await client.get<ClassSession[]>('/classes', { params: { when: 'tonight' } });
  return data;
}
