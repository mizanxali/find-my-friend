import { useAuth } from "@offline-protocol/id-react-native";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NetworkAnimation from "@/components/common/NetworkAnimation";
import { Colors, Spacing } from "@/constants/theme";
import { useSessionStore } from "@/stores/sessionStore";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const reset = useSessionStore((s) => s.reset);

  // const peerId = user?.username ?? user?.email ?? String(user?.id ?? "");

  const handleStartSession = () => {
    reset();
    router.push("/(app)/pair");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: insets.top + Spacing.four,
        paddingHorizontal: Spacing.four,
        paddingBottom: insets.bottom + Spacing.three,
      }}
    >
      <View className="mb-8">
        <Text className="text-white text-3xl font-bold">Find My Friend</Text>
        <Text className="text-white/60 text-base mt-1">
          {user?.username ? `@${user.username}` : (user?.email ?? "")}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <NetworkAnimation />
      </View>

      <View className="gap-3">
        <TouchableOpacity
          className="bg-white rounded-xl py-4 items-center"
          onPress={handleStartSession}
        >
          <Text className="text-black text-lg font-semibold">
            Start a Session
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-white/20 rounded-xl py-4 items-center"
          onPress={logout}
        >
          <Text className="text-white/60 text-base">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
