import { formatDistance } from "@/utils/geo";
import { Text, View } from "react-native";

interface DistanceLabelProps {
  meters: number;
  imperial?: boolean;
}

export default function DistanceLabel({
  meters,
  imperial = false,
}: DistanceLabelProps) {
  const { value, unit } = formatDistance(meters, imperial);

  return (
    <View className="flex-row items-baseline justify-center">
      <Text className="text-6xl font-bold text-white font-mono">{value}</Text>
      <Text className="ml-1.5 text-2xl font-medium text-white/60 font-mono">
        {unit}
      </Text>
    </View>
  );
}
