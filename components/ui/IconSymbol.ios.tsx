// components/ui/IconSymbol.ios.tsx

import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";
import { IconSymbolName } from "./IconSymbol";

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name as SymbolViewProps["name"]}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
