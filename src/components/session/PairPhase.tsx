import { useAuth } from "@offline-protocol/id-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";

import IncomingRequestCard from "@/components/pair/IncomingRequestCard";
import NeighborList from "@/components/pair/NeighborList";
import PairConnectionStatus from "@/components/pair/PairConnectionStatus";
import PairHeader from "@/components/pair/PairHeader";
import PairLoadingState from "@/components/pair/PairLoadingState";
import { useSessionStore } from "@/stores/sessionStore";

type Props = {
  meshStarted: boolean;
  sendConnectionRequest: (peerId: string) => Promise<void>;
  acceptConnectionRequest: (senderId: string) => Promise<void>;
  rejectConnectionRequest: (senderId: string) => Promise<void>;
  sendHeartbeat: () => Promise<void>;
  sendHeartbeatTo: (peerId: string) => Promise<void>;
  onBack: () => void;
};

export default function PairPhase({
  meshStarted,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  sendHeartbeat,
  sendHeartbeatTo,
  onBack,
}: Props) {
  const { user } = useAuth();

  const pairedPeerId = useSessionStore((s) => s.pairedPeerId);
  const peerConnected = useSessionStore((s) => s.peer.isConnected);
  const peerTransport = useSessionStore((s) => s.peer.transport);
  const incomingRequest = useSessionStore((s) => s.incomingRequest);
  const neighbors = useSessionStore((s) => s.neighbors);

  const [connectingPeerId, setConnectingPeerId] = useState<string | null>(null);

  const myPeerId = user?.username ?? user?.email ?? String(user?.id ?? "");

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
    [myPeerId, sendConnectionRequest],
  );

  return (
    <>
      <PairHeader onBack={onBack} />

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
    </>
  );
}
