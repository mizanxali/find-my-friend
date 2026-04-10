import { PairingMode } from "@/types";
import { Text, TouchableOpacity, View } from "react-native";

interface PairTabsProps {
  mode: PairingMode;
  onShowQrPress: () => void;
  onScanQrPress: () => void;
  onManualPress: () => void;
}

interface PairTabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function PairTabButton({ label, isActive, onPress }: PairTabButtonProps) {
  return (
    <TouchableOpacity
      className={`flex-1 items-center rounded-lg py-2.5 ${isActive ? "bg-white/20" : ""}`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-medium ${isActive ? "text-white" : "text-white/50"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PairTabs({
  mode,
  onShowQrPress,
  onScanQrPress,
  onManualPress,
}: PairTabsProps) {
  return (
    <View className="mb-6 flex-row rounded-xl bg-white/10 p-1">
      <PairTabButton
        label="My QR"
        isActive={mode === "show-qr"}
        onPress={onShowQrPress}
      />
      <PairTabButton
        label="Scan QR"
        isActive={mode === "scan-qr"}
        onPress={onScanQrPress}
      />
      <PairTabButton
        label="Enter ID"
        isActive={mode === "manual"}
        onPress={onManualPress}
      />
    </View>
  );
}
