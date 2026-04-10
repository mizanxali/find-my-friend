import { ActivityIndicator, Text, View } from "react-native";

interface PairLoadingStateProps {
  message: string;
}

export default function PairLoadingState({ message }: PairLoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="white" />
      <Text className="mt-4 text-sm text-white/60">{message}</Text>
    </View>
  );
}
