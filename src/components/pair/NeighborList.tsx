import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { DiscoveredNeighbor } from "@/types";

interface NeighborListProps {
  neighbors: DiscoveredNeighbor[];
  onSelect: (peerId: string) => void;
  connectingPeerId: string | null;
}

function signalLabel(rssi: number | null): string {
  if (rssi == null) return "—";
  if (rssi >= -60) return "Strong";
  if (rssi >= -75) return "Good";
  if (rssi >= -90) return "Weak";
  return "Faint";
}

function transportLabel(transport: DiscoveredNeighbor["transport"]): string {
  if (transport === "wifi-direct") return "Wi-Fi Direct";
  if (transport === "ble") return "BLE";
  return "Internet";
}

export default function NeighborList({
  neighbors,
  onSelect,
  connectingPeerId,
}: NeighborListProps) {
  if (neighbors.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <ActivityIndicator size="small" color="white" />
        <Text className="mt-4 text-center text-sm text-white/60">
          Searching for nearby friends...
        </Text>
        <Text className="mt-2 text-center text-xs text-white/40">
          Make sure your friend also has Find My Friend open.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-3 text-xs uppercase tracking-wider text-white/50">
        Nearby ({neighbors.length})
      </Text>
      <View className="gap-3">
        {neighbors.map((neighbor) => {
          const isConnecting = connectingPeerId === neighbor.peerId;
          return (
            <TouchableOpacity
              key={neighbor.peerId}
              className="flex-row items-center justify-between rounded-2xl bg-white/10 p-4"
              onPress={() => onSelect(neighbor.peerId)}
              disabled={connectingPeerId !== null}
            >
              <View className="flex-1 pr-3">
                <Text
                  className="text-base font-semibold text-white"
                  numberOfLines={1}
                >
                  {neighbor.peerId}
                </Text>
                <Text className="mt-1 text-xs text-white/50">
                  {transportLabel(neighbor.transport)} ·{" "}
                  {signalLabel(neighbor.rssi)}
                  {neighbor.rssi != null ? ` (${neighbor.rssi} dBm)` : ""}
                </Text>
              </View>
              {isConnecting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-semibold text-black">
                    Connect
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
