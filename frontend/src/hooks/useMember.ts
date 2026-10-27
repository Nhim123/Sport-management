import { useQuery } from '@tanstack/react-query';
import { getMe, getMySchedule } from '../api/members.api';
import { qk } from './queryKeys';

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: getMe });
}

export function useMySchedule() {
  return useQuery({ queryKey: qk.mySchedule, queryFn: getMySchedule });
}
