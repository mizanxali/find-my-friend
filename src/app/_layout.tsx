import "../../globals.css";

import { OfflineAppProvider } from "@offline-protocol/id-react-native";
import { Stack } from "expo-router";

const PROJECT_ID = "proj_qmdwot1lizwk";

export default function RootLayout() {
  return (
    <OfflineAppProvider projectId={PROJECT_ID}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </OfflineAppProvider>
  );
}
