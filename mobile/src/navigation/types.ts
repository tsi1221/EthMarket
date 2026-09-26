import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { NormalizedTradeQuote, TradeOrderRequest } from "../types/trading";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Compare: undefined;
  Watchlist: undefined;
  Invest: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<AppTabParamList> | undefined;
  AssetDetails: { symbol: string };
  Explore: { query?: string } | undefined;
  Portfolio: undefined;
  BuyAsset: { symbol: string; side?: "buy" | "sell" };
  ConfirmOrder: {
    quote: NormalizedTradeQuote;
    request: TradeOrderRequest;
  };
  VirtualCard: undefined;
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  Transfers: undefined;
};

export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;
