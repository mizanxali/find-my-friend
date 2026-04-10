import { Text, View } from "react-native";

import ConnectionBadge from "@/components/pair/ConnectionBadge";
import type { PeerState } from "@/types";

interface PairConnectionStatusProps {
  pairedPeerId: string;
  peerConnected: boolean;
  peerTransport: PeerState["transport"];
}

export default function PairConnectionStatus({
  pairedPeerId,
  peerConnected,
  peerTransport,
}: PairConnectionStatusProps) {
  return (
    <View className="mb-4 items-center">
      <ConnectionBadge isConnected={peerConnected} transport={peerTransport} />
      {!peerConnected && (
        <Text className="mt-2 text-sm text-white/40">
          Waiting for {pairedPeerId} to accept...
        </Text>
      )}
      {peerConnected && (
        <Text className="mt-2 text-base font-medium text-green-400">
          Connected to {pairedPeerId}
        </Text>
      )}
    </View>
  );
}
