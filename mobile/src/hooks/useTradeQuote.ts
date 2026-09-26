import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestTradeQuote, submitTradeOrder } from "../api/trading";
import type { TradeOrderRequest, TradeQuoteRequest } from "../types/trading";
import { orderKeys } from "./useOrdersQuery";

export function useTradeQuoteMutation() {
  return useMutation({
    mutationFn: (payload: TradeQuoteRequest) => requestTradeQuote(payload),
  });
}

export function useTradeOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TradeOrderRequest) => submitTradeOrder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
