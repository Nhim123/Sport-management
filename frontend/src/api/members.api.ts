import type { Member, ScheduleItem } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';
import { ME, MY_SCHEDULE } from '../mocks/data';

export async function getMe(): Promise<Member> {
  if (USE_MOCK) return mockDelay(ME);
  const { data } = await client.get<Member>('/members/me');
  return data;
}

export async function getMySchedule(): Promise<ScheduleItem[]> {
  if (USE_MOCK) return mockDelay(MY_SCHEDULE);
  const { data } = await client.get<ScheduleItem[]>('/members/me/schedule');
  return data;
}
