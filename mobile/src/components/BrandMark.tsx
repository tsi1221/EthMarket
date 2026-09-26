import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

type BrandMarkProps = {
  size?: number;
  light?: boolean;
  compact?: boolean;
};

/**
 * Geometric EthMarket mark: a clean "E" with a subtle market tick.
 * Drawn in SVG so it stays sharp at icon, splash, and navbar sizes.
 */
export function BrandMark({ size = 64, light = false, compact = false }: BrandMarkProps) {
  const { colors, shadows } = useTheme();
  const radius = compact ? size * 0.22 : size * 0.28;
  const markColor = light ? colors.primary : colors.white;
  const surface = light ? colors.surface : colors.primary;
  const stroke = Math.max(2.5, size * 0.1);
  const left = size * 0.28;
  const right = size * 0.72;
  const top = size * 0.28;
  const mid = size * 0.5;
  const bottom = size * 0.72;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="EthMarket logo"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: surface,
          borderWidth: light ? 1 : 0,
          borderColor: light ? colors.border : "transparent",
        },
        light ? null : shadows.card,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} rx={radius} fill={surface} />
        <Path
          d={`M ${left} ${top} V ${bottom}`}
          stroke={markColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${left} ${top} H ${right}`}
          stroke={markColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${left} ${mid} H ${right * 0.92}`}
          stroke={markColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${left} ${bottom} H ${right}`}
          stroke={markColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${right * 0.78} ${top + stroke * 0.2} L ${right + size * 0.02} ${top - stroke * 0.45} L ${right * 0.84} ${top + stroke}`}
          stroke={markColor}
          strokeWidth={Math.max(2, stroke * 0.7)}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
