import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

type TextLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

export function TextLink({ prompt, action, onPress }: TextLinkProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={styles.row}>
      <Text style={styles.prompt}>
        {prompt} <Text style={styles.action}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
  },
  prompt: {
    color: colors.muted,
    fontSize: 15,
  },
  action: {
    color: colors.primary,
    fontWeight: "700",
  },
});
