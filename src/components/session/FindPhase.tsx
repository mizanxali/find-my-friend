import AccuracyRing from "@/components/find/AccuracyRing";
import CompassArrow from "@/components/find/CompassArrow";
import DistanceLabel from "@/components/find/DistanceLabel";
import {
  CLOSE_RANGE_METERS,
  LOST_THRESHOLD_MS,
  STALE_THRESHOLD_MS,
  UPDATE_INTERVAL_MS,
} from "@/constants/mesh";
import { useBearing } from "@/hooks/useBearing";
import { useCompass } from "@/hooks/useCompass";
import { useLocation } from "@/hooks/useLocation";
import { SIM_PEER_ID, useSimulatedPeer } from "@/hooks/useSimulatedPeer";
import { useSessionStore } from "@/stores/sessionStore";
import type { LocationPayload } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  sendLocation: (payload: LocationPayload) => Promise<void>;
  onDisconnect: () => void;
};

export default function FindPhase({ sendLocation, onDisconnect }: Props) {
  const myLocation = useSessionStore((s) => s.myLocation);
  const peer = useSessionStore((s) => s.peer);
  const bearing = useSessionStore((s) => s.bearing);
  const distance = useSessionStore((s) => s.distance);
  const pairedPeerId = useSessionStore((s) => s.pairedPeerId);

  const heading = useCompass();
  const { start: startLocation, stop: stopLocation } = useLocation();
  const { startSimulation, stopSimulation } = useSimulatedPeer();
  const isSimulated = pairedPeerId === SIM_PEER_ID;

  useBearing();

  const [freshness, setFreshness] = useState<"live" | "stale" | "lost">("live");

  useEffect(() => {
    startLocation();
    return () => stopLocation();
  }, [startLocation, stopLocation]);

  // Start simulated peer location updates when paired with sim peer
  useEffect(() => {
    if (isSimulated) {
      startSimulation();
      return () => stopSimulation();
    }
  }, [isSimulated, startSimulation, stopSimulation]);

  const lastSentRef = useRef(0);

  // Only send real location to real peers
  useEffect(() => {
    if (isSimulated) return;
    if (!myLocation || !pairedPeerId) return;
    const now = Date.now();
    if (now - lastSentRef.current < UPDATE_INTERVAL_MS) return;
    lastSentRef.current = now;
    sendLocation({ ...myLocation, peerId: pairedPeerId });
  }, [isSimulated, myLocation, pairedPeerId, sendLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      const lastTs = peer.lastPayload?.timestamp;
      if (!lastTs) {
        setFreshness("lost");
        return;
      }
      const age = Date.now() - lastTs;
      if (age > LOST_THRESHOLD_MS) setFreshness("lost");
      else if (age > STALE_THRESHOLD_MS) setFreshness("stale");
      else setFreshness("live");
    }, 1000);
    return () => clearInterval(timer);
  }, [peer.lastPayload?.timestamp]);

  const arrowRotation =
    bearing != null && heading != null ? bearing - heading : 0;

  const isCloseRange = distance != null && distance < CLOSE_RANGE_METERS;

  const freshnessColor =
    freshness === "live"
      ? "bg-green-400"
      : freshness === "stale"
        ? "bg-yellow-400"
        : "bg-red-400";

  const freshnessLabel =
    freshness === "live"
      ? "Connected"
      : freshness === "stale"
        ? "Signal weak"
        : "Connection lost";

  const handleDisconnect = () => {
    stopLocation();
    stopSimulation();
    onDisconnect();
  };

  return (
    <>
      <View className="items-center mb-2">
        <Text className="text-base text-white/60 font-medium">Finding</Text>
        <Text
          className="text-xl font-bold text-white mt-0.5 font-mono"
          numberOfLines={1}
        >
          {isSimulated ? "Simulated Friend" : (pairedPeerId ?? "—")}
        </Text>
      </View>

      <View className="flex-row items-center justify-center mb-4 gap-2">
        <View className={`h-2 w-2 rounded-full ${freshnessColor}`} />
        <Text className="text-sm text-white/60">{freshnessLabel}</Text>
        <Text className="text-xs font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded overflow-hidden">
          {peer.transport.toUpperCase()}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        {isCloseRange ? (
          <View className="items-center">
            <Text className="text-4xl font-bold text-green-400">
              You're close!
            </Text>
            <Text className="text-base text-white/60 mt-2">
              Within {CLOSE_RANGE_METERS}m — look around
            </Text>
          </View>
        ) : distance != null && bearing != null ? (
          <>
            <CompassArrow rotation={arrowRotation} size={220} />
            <View className="mt-6">
              <DistanceLabel meters={distance} />
            </View>
          </>
        ) : (
          <View className="items-center">
            <Text className="text-lg text-white/60">
              Waiting for peer location...
            </Text>
          </View>
        )}
      </View>

      <View className="items-center gap-3 pb-4">
        {myLocation && <AccuracyRing accuracy={myLocation.accuracy} />}

        {peer.lastPayload && (
          <Text className="text-xs text-white/60">
            Last update:{" "}
            {new Date(peer.lastPayload.timestamp).toLocaleTimeString()}
          </Text>
        )}

        <TouchableOpacity
          className="px-6 py-3 rounded-xl bg-white/10"
          onPress={handleDisconnect}
        >
          <Text className="text-base font-semibold text-red-400">
            Disconnect
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
