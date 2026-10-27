import { useQuery } from '@tanstack/react-query';
import { getPayMethods } from '../api/payments.api';
import { qk } from './queryKeys';

export function usePayMethods() {
  return useQuery({ queryKey: qk.payMethods, queryFn: getPayMethods });
}
