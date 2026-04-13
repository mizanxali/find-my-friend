import "../../globals.css";

import { OfflineAppProvider, useAuth } from "@offline-protocol/id-react-native";
import { Stack } from "expo-router";

import { SplashScreenController } from "@/splash";

const PROJECT_ID = "proj_qmdwot1lizwk";

export default function RootLayout() {
  return (
    <OfflineAppProvider projectId={PROJECT_ID}>
      <SplashScreenController />
      <RootNavigator />
    </OfflineAppProvider>
  );
}

function RootNavigator() {
  const { loading, user } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!loading && !!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!loading && !user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
