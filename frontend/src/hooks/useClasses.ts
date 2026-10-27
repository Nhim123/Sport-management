import { useQuery } from '@tanstack/react-query';
import { getTonightClasses } from '../api/classes.api';
import { qk } from './queryKeys';

export function useTonightClasses() {
  return useQuery({ queryKey: qk.classesTonight, queryFn: getTonightClasses });
}
