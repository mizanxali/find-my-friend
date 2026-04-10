import { Text, View } from "react-native";

interface ConnectionBadgeProps {
  isConnected: boolean;
  transport?: "ble" | "wifi-direct" | "internet";
}

export default function ConnectionBadge({
  isConnected,
  transport,
}: ConnectionBadgeProps) {
  const label = isConnected
    ? transport === "wifi-direct"
      ? "WiFi Direct"
      : transport === "internet"
        ? "Internet"
        : "Bluetooth"
    : "Disconnected";

  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
      />
      <Text className="text-white/70 text-sm">{label}</Text>
    </View>
  );
}
