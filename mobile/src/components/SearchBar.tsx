import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type SearchBarProps = TextInputProps & {
  onSubmit?: (query: string) => void;
};

export function SearchBar({ onSubmit, value, onChangeText, ...props }: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.field,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search assets"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={(event) => onSubmit?.(event.nativeEvent.text)}
        accessibilityLabel="Search assets"
        accessibilityRole="search"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: touch.min + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 10,
  },
});
