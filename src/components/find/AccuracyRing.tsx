import { Text, View } from "react-native";

interface AccuracyRingProps {
  accuracy: number;
}

function accuracyColor(accuracy: number): string {
  if (accuracy <= 5) return "bg-green-400";
  if (accuracy <= 15) return "bg-yellow-400";
  return "bg-red-400";
}

function accuracyLabel(accuracy: number): string {
  if (accuracy <= 5) return "Excellent";
  if (accuracy <= 15) return "Good";
  if (accuracy <= 30) return "Fair";
  return "Poor";
}

export default function AccuracyRing({ accuracy }: AccuracyRingProps) {
  return (
    <View className="flex-row items-center justify-center">
      <View
        className={`h-2 w-2 rounded-full mr-1.5 ${accuracyColor(accuracy)}`}
      />
      <Text className="text-sm text-white/60">
        {accuracyLabel(accuracy)} ({"\u00B1"}
        {Math.round(accuracy)}m)
      </Text>
    </View>
  );
}
