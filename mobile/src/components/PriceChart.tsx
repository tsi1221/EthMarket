import { useMemo, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, radius, spacing } from "../theme";
import type { ChartPeriod, ChartPoint } from "../types/market";
import { formatAvailableCurrency, formatChartTime } from "../utils/format";

type PriceChartProps = {
  points: ChartPoint[];
  period: ChartPeriod;
};

const HEIGHT = 168;
const PAD_X = 8;
const PAD_Y = 12;

export function PriceChart({ points, period }: PriceChartProps) {
  const [width, setWidth] = useState(0);

  const chart = useMemo(() => {
    const usable = points.filter((point) => Number.isFinite(point.price) && point.price > 0);
    const first = usable[0];
    const last = usable[usable.length - 1];
    const isPositive = first && last ? last.price >= first.price : true;
    const prices = usable.map((point) => point.price);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const range = max - min || 1;

    if (usable.length < 2 || width <= 0) {
      return {
        first,
        last,
        isPositive,
        min,
        max,
        line: "",
        area: "",
        lastX: 0,
        lastY: 0,
      };
    }

    const innerWidth = Math.max(width - PAD_X * 2, 1);
    const innerHeight = HEIGHT - PAD_Y * 2;
    const coords = usable.map((point, index) => {
      const x = PAD_X + (index / (usable.length - 1)) * innerWidth;
      const y = PAD_Y + (1 - (point.price - min) / range) * innerHeight;
      return { x, y };
    });

    const line = coords
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
    const lastPoint = coords[coords.length - 1];
    const area = `${line} L ${lastPoint.x.toFixed(2)} ${HEIGHT} L ${coords[0].x.toFixed(2)} ${HEIGHT} Z`;

    return {
      first,
      last,
      isPositive,
      min,
      max,
      line,
      area,
      lastX: lastPoint.x,
      lastY: lastPoint.y,
    };
  }, [points, width]);

  const stroke = chart.isPositive ? colors.gain : colors.loss;
  const fill = chart.isPositive ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.1)";

  function onLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== width) {
      setWidth(nextWidth);
    }
  }

  return (
    <View style={styles.wrap} accessibilityLabel={`Price chart for ${period}`}>
      <Text style={[styles.axisLabel, chart.isPositive ? styles.gain : styles.loss]}>
        {formatAvailableCurrency(chart.max)}
      </Text>
      <View onLayout={onLayout} style={styles.canvas} accessibilityElementsHidden>
        {width > 0 && chart.line ? (
          <Svg width={width} height={HEIGHT}>
            <Path d={chart.area} fill={fill} />
            <Path
              d={chart.line}
              fill="none"
              stroke={stroke}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle cx={chart.lastX} cy={chart.lastY} r={4.5} fill={stroke} />
          </Svg>
        ) : null}
      </View>
      <Text style={styles.axisLabel}>{formatAvailableCurrency(chart.min)}</Text>
      <View style={styles.times}>
        <Text style={styles.time}>{formatChartTime(chart.first?.time, period)}</Text>
        <Text style={styles.time}>{formatChartTime(chart.last?.time, period)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  canvas: {
    height: HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  axisLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  gain: {
    color: colors.gain,
  },
  loss: {
    color: colors.loss,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
});
