import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { useAuthStore } from "../store/authStore";
import { useRecentlyViewedStore } from "../store/recentlyViewedStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { AssetDetailsScreen } from "../screens/AssetDetailsScreen";
import { BuyAssetScreen } from "../screens/BuyAssetScreen";
import { ConfirmOrderScreen } from "../screens/ConfirmOrderScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { TransfersScreen } from "../screens/TransfersScreen";
import { VirtualCardScreen } from "../screens/VirtualCardScreen";
import { TabNavigator } from "./TabNavigator";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

function WatchlistSync() {
  const token = useAuthStore((state) => state.token);
  const hydrate = useWatchlistStore((state) => state.hydrate);
  const resetServerFlag = useWatchlistStore((state) => state.resetServerFlag);

  useEffect(() => {
    void hydrate();
    if (!token) {
      resetServerFlag();
    }
  }, [token, hydrate, resetServerFlag]);

  return null;
}

function RecentlyViewedSync() {
  const hydrate = useRecentlyViewedStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}

export function AppNavigator() {
  useBackendHealth();

  return (
    <>
      <WatchlistSync />
      <RecentlyViewedSync />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AssetDetails" component={AssetDetailsScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Portfolio" component={PortfolioScreen} />
        <Stack.Screen name="BuyAsset" component={BuyAssetScreen} />
        <Stack.Screen name="ConfirmOrder" component={ConfirmOrderScreen} />
        <Stack.Screen name="VirtualCard" component={VirtualCardScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Transfers" component={TransfersScreen} />
      </Stack.Navigator>
    </>
  );
}
