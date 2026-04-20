// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "figure.run": "directions-run",
  "gamecontroller.fill": "sports-esports",
  "trophy.fill": "emoji-events",
  "clock.fill": "history",
  "person.fill": "person",
  "flame.fill": "local-fire-department",
  "bolt.fill": "bolt",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "play.fill": "play-arrow",
  "stop.fill": "stop",
  "pause.fill": "pause",
  "chevron.left": "chevron-left",
  "info.circle": "info",
  "heart.fill": "favorite",
  "waveform": "graphic-eq",
  "chart.bar.fill": "bar-chart",
  "dumbbell.fill": "fitness-center",
  "plus.circle.fill": "add-circle",
  "star.fill": "star",
  "medal.fill": "military-tech",
  "target": "gps-fixed",
  "calendar": "calendar-today",
  "mic.fill": "mic",
  "speaker.wave.2.fill": "volume-up",
  "gear": "settings",
  "arrow.up.circle.fill": "arrow-upward",
} as IconMapping;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
