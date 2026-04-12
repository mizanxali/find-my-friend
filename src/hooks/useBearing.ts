import { useSessionStore } from "@/stores/sessionStore";
import { computeBearing, haversineDistance } from "@/utils/geo";
import { useEffect } from "react";

export function useBearing() {
  const myLocation = useSessionStore((s) => s.myLocation);
  const peerPayload = useSessionStore((s) => s.peer.lastPayload);
  const setBearingAndDistance = useSessionStore((s) => s.setBearingAndDistance);

  useEffect(() => {
    if (!myLocation || !peerPayload) return;

    const distance = haversineDistance(
      myLocation.lat,
      myLocation.lng,
      peerPayload.lat,
      peerPayload.lng,
    );
    const bearing = computeBearing(
      myLocation.lat,
      myLocation.lng,
      peerPayload.lat,
      peerPayload.lng,
    );

    setBearingAndDistance(bearing, distance);
  }, [myLocation, peerPayload, setBearingAndDistance]);
}
