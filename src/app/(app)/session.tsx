import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FindPhase from "@/components/session/FindPhase";
import PairPhase from "@/components/session/PairPhase";
import { Colors, Spacing } from "@/constants/theme";
import { useMeshPeer } from "@/hooks/useMeshPeer";
import { useSessionStore } from "@/stores/sessionStore";

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const {
    start,
    stop,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    sendLocation,
    sendHeartbeat,
    sendHeartbeatTo,
  } = useMeshPeer();

  const pairedPeerId = useSessionStore((s) => s.pairedPeerId);
  const peerConnected = useSessionStore((s) => s.peer.isConnected);
  const reset = useSessionStore((s) => s.reset);

  const [meshStarted, setMeshStarted] = useState(false);

  const isFinding = pairedPeerId && peerConnected;

  useEffect(() => {
    start().then((protocol) => {
      if (protocol) setMeshStarted(true);
    });
  }, [start]);

  const handleDisconnect = async () => {
    await stop();
    reset();
    setMeshStarted(false);
    start().then((protocol) => {
      if (protocol) setMeshStarted(true);
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: insets.top + Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingBottom: insets.bottom + Spacing.three,
      }}
    >
      {isFinding ? (
        <FindPhase
          sendLocation={sendLocation}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <PairPhase
          meshStarted={meshStarted}
          sendConnectionRequest={sendConnectionRequest}
          acceptConnectionRequest={acceptConnectionRequest}
          rejectConnectionRequest={rejectConnectionRequest}
          sendHeartbeat={sendHeartbeat}
          sendHeartbeatTo={sendHeartbeatTo}
          onBack={() => {
            stop();
            router.back();
          }}
        />
      )}
    </View>
  );
}
