import { useAuth } from "@offline-protocol/id-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IncomingRequestCard from "@/components/pair/IncomingRequestCard";
import NeighborList from "@/components/pair/NeighborList";
import PairConnectionStatus from "@/components/pair/PairConnectionStatus";
import PairHeader from "@/components/pair/PairHeader";
import PairLoadingState from "@/components/pair/PairLoadingState";
import { Colors, Spacing } from "@/constants/theme";
import { useMeshPeer } from "@/hooks/useMeshPeer";
import { SIM_PEER_ID, useSimulatedPeer } from "@/hooks/useSimulatedPeer";
import { useSessionStore } from "@/stores/sessionStore";

export default function PairScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    start,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    sendHeartbeat,
    sendHeartbeatTo,
  } = useMeshPeer();
  const { connectSimPeer } = useSimulatedPeer();

  const pairedPeerId = useSessionStore((s) => s.pairedPeerId);
  const peerConnected = useSessionStore((s) => s.peer.isConnected);
  const peerTransport = useSessionStore((s) => s.peer.transport);
  const incomingRequest = useSessionStore((s) => s.incomingRequest);
  const neighbors = useSessionStore((s) => s.neighbors);

  const [meshStarted, setMeshStarted] = useState(false);
  const [connectingPeerId, setConnectingPeerId] = useState<string | null>(null);

  const myPeerId = user?.username ?? user?.email ?? String(user?.id ?? "");

  useEffect(() => {
    start().then(() => setMeshStarted(true));
  }, [start]);

  // Navigate to finder screen once paired and connected
  useEffect(() => {
    if (pairedPeerId && peerConnected) {
      router.replace("/(app)/find");
    }
  }, [pairedPeerId, peerConnected]);

  const neighborList = useMemo(
    () =>
      Object.values(neighbors)
        .filter((n) => n.peerId !== myPeerId)
        .sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)),
    [neighbors, myPeerId],
  );

  const heartbeatPeer = useCallback(
    async (peerId: string) => {
      try {
        await sendHeartbeatTo(peerId);
      } catch (error) {
        console.error("[Pair] Heartbeat failed:", error);
        Alert.alert("Error", "Failed to send heartbeat.");
      }
    },
    [sendHeartbeatTo],
  );

  const connectToPeer = useCallback(
    async (peerId: string) => {
      if (!peerId || peerId === myPeerId) return;
      // Simulated peer — bypass SDK entirely
      if (peerId === SIM_PEER_ID) {
        connectSimPeer();
        return;
      }
      setConnectingPeerId(peerId);
      try {
        await sendConnectionRequest(peerId);
      } catch (error) {
        console.error("[Pair] Connection request failed:", error);
        Alert.alert("Error", "Failed to send connection request. Try again.");
      } finally {
        setConnectingPeerId(null);
      }
    },
    [myPeerId, sendConnectionRequest, connectSimPeer],
  );

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
      <PairHeader onBack={() => router.back()} />

      {pairedPeerId && (
        <PairConnectionStatus
          pairedPeerId={pairedPeerId}
          peerConnected={peerConnected}
          peerTransport={peerTransport}
        />
      )}

      {pairedPeerId && peerConnected && (
        <TouchableOpacity
          onPress={async () => {
            try {
              await sendHeartbeat();
            } catch (err) {
              console.error("[Pair] Heartbeat failed:", err);
              Alert.alert("Error", "Failed to send heartbeat.");
            }
          }}
          className="mb-4 items-center rounded-xl bg-blue-500 px-6 py-3"
        >
          <Text className="text-base font-semibold text-white">
            Send Heartbeat
          </Text>
        </TouchableOpacity>
      )}

      {!meshStarted && <PairLoadingState message="Starting mesh network..." />}

      {meshStarted && incomingRequest && !pairedPeerId && (
        <IncomingRequestCard
          senderName={incomingRequest.senderName}
          onAccept={() => acceptConnectionRequest(incomingRequest.sender)}
          onReject={() => rejectConnectionRequest(incomingRequest.sender)}
        />
      )}

      {meshStarted && !pairedPeerId && (
        <NeighborList
          neighbors={neighborList}
          onSelect={connectToPeer}
          onHeartbeat={heartbeatPeer}
          connectingPeerId={connectingPeerId}
        />
      )}
    </View>
  );
}
