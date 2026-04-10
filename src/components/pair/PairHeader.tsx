import { Text, TouchableOpacity, View } from "react-native";

interface PairHeaderProps {
  onBack: () => void;
}

export default function PairHeader({ onBack }: PairHeaderProps) {
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <TouchableOpacity onPress={onBack}>
        <Text className="text-base text-white/60">Back</Text>
      </TouchableOpacity>
      <Text className="text-lg font-semibold text-white">Pair</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
