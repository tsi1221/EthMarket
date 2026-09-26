import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../i18n/LanguageProvider";
import { CompareScreen } from "../screens/CompareScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InvestScreen } from "../screens/InvestScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { WatchlistScreen } from "../screens/WatchlistScreen";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTabParamList } from "./types";

const Tab = createBottomTabNavigator<AppTabParamList>();

const icons: Record<
  keyof AppTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: "home", inactive: "home-outline" },
  Compare: { active: "swap-horizontal", inactive: "swap-horizontal-outline" },
  Watchlist: { active: "star", inactive: "star-outline" },
  Invest: { active: "cash", inactive: "cash-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const labels: Record<keyof AppTabParamList, string> = {
    Home: t("nav.home"),
    Compare: t("nav.compare"),
    Watchlist: t("nav.watchlist"),
    Invest: t("nav.invest"),
    Profile: t("nav.profile"),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabel: labels[route.name],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarItemStyle: {
          minHeight: 44,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarAccessibilityLabel: labels[route.name],
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? icons[route.name].active : icons[route.name].inactive}
            size={22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Compare" component={CompareScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="Invest" component={InvestScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
