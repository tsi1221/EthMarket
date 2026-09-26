import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { useAuthStore } from "../store/authStore";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const clearError = useAuthStore((state) => state.clearError);
  const authEntry = useAuthStore((state) => state.authEntry);

  return (
    <Stack.Navigator
      initialRouteName={authEntry}
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onGoToRegister={() => {
              clearError();
              navigation.navigate("Register");
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onGoToLogin={() => {
              clearError();
              navigation.navigate("Login");
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
