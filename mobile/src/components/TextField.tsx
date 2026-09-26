import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  password?: boolean;
};

export function TextField({
  label,
  error,
  password = false,
  secureTextEntry,
  ...props
}: TextFieldProps) {
  const { colors, typography } = useTheme();
  const [hidden, setHidden] = useState(password);

  return (
    <View style={styles.wrapper}>
      <Text style={typography.label}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: error ? colors.errorLight : colors.surface,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
          secureTextEntry={password ? hidden : secureTextEntry}
          autoCorrect={false}
          accessibilityLabel={label}
          accessibilityHint={error}
          {...props}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={styles.eye}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  field: {
    minHeight: touch.min + 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: spacing.sm,
  },
  eye: {
    width: touch.min,
    height: touch.min,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
