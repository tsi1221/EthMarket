import { useNavigation } from "@react-navigation/native";
import type { AppNavigationProp } from "../navigation/types";

export function useAppNavigation() {
  return useNavigation<AppNavigationProp>();
}
