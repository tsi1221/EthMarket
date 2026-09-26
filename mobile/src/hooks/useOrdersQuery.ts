import { useQuery, useQueryClient } from "@tanstack/react-query";
import { liveOrPreview } from "../api/liveOrPreview";
import { fetchOrders, fetchOrderStatus } from "../api/trading";
import { useAuthStore } from "../store/authStore";
import { useBackendStatus } from "../store/backendStatus";
import type { LocalOrder } from "../types/trading";

export const orderKeys = {
  all: ["orders"] as const,
  list: () => [...orderKeys.all, "list"] as const,
  status: (id: string) => [...orderKeys.all, "status", id] as const,
};

function upsertOrder(
  list: LocalOrder[] | undefined,
  order: LocalOrder,
): LocalOrder[] {
  if (!list) {
    return [order];
  }

  const exists = list.some((item) => item.id === order.id);
  if (!exists) {
    return [order, ...list];
  }

  return list.map((item) => (item.id === order.id ? { ...item, ...order } : item));
}

export function useOrdersQuery() {
  const token = useAuthStore((state) => state.token);
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...orderKeys.list(), backendStatus, Boolean(token)],
    queryFn: () => liveOrPreview(() => fetchOrders(), () => []),
    enabled: Boolean(token) || backendStatus === "unavailable",
    staleTime: 15_000,
  });
}

export function useOrderStatusQuery(orderId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: orderKeys.status(orderId),
    queryFn: async () => {
      const order = await fetchOrderStatus(orderId);
      queryClient.setQueryData<LocalOrder[]>(orderKeys.list(), (current) =>
        upsertOrder(current, order),
      );
      return order;
    },
    enabled: Boolean(orderId),
    staleTime: 10_000,
  });
}

