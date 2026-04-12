import { UPDATE_INTERVAL_MS } from "@/constants/mesh";
import { useSessionStore } from "@/stores/sessionStore";
import type { LocationPayload } from "@/types";
import { useCallback, useEffect, useRef } from "react";

const SIM_PEER_ID = "__sim-peer__";
const SIM_PEER_NAME = "Simulated Friend";
const SIM_DISTANCE_M = 150; // distance from initial position

/** Offset a lat/lng by a distance (meters) and bearing (degrees). */
function offsetLatLng(
  lat: number,
  lng: number,
  distanceM: number,
  bearingDeg: number,
): { lat: number; lng: number } {
  const R = 6_371_000;
  const d = distanceM / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

export { SIM_PEER_ID };

export function useSimulatedPeer() {
  const {
    upsertNeighbor,
    removeNeighbor,
    setPairedPeerId,
    setPeerConnected,
    setPeerTransport,
    setPeerSignalStrength,
    setPeerPayload,
  } = useSessionStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fixedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const bearingRef = useRef(Math.random() * 360);

  // Inject the fake neighbor on mount
  useEffect(() => {
    upsertNeighbor({
      peerId: SIM_PEER_ID,
      transport: "ble",
      rssi: -45,
      discoveredAt: Date.now(),
    });
    return () => {
      removeNeighbor(SIM_PEER_ID);
    };
  }, [upsertNeighbor, removeNeighbor]);

  // Connect to the simulated peer (called from pair screen)
  const connectSimPeer = useCallback(() => {
    setPairedPeerId(SIM_PEER_ID);
    setPeerConnected(true);
    setPeerTransport("ble");
    setPeerSignalStrength(-45);
  }, [
    setPairedPeerId,
    setPeerConnected,
    setPeerTransport,
    setPeerSignalStrength,
  ]);

  // Start simulating peer location updates (called from find screen)
  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;

    const tick = () => {
      // Compute the fixed target once from the user's initial position
      if (!fixedLocationRef.current) {
        const loc = useSessionStore.getState().myLocation;
        if (!loc) return;
        fixedLocationRef.current = offsetLatLng(
          loc.lat,
          loc.lng,
          SIM_DISTANCE_M,
          bearingRef.current,
        );
      }

      const target = fixedLocationRef.current;
      const payload: LocationPayload = {
        peerId: SIM_PEER_ID,
        lat: target.lat,
        lng: target.lng,
        altitude: null,
        accuracy: 5,
        heading: null,
        timestamp: Date.now(),
      };

      setPeerPayload(payload);
    };

    // Fire immediately, then re-emit the same location on interval
    // so the freshness indicator stays "live"
    tick();
    intervalRef.current = setInterval(tick, UPDATE_INTERVAL_MS);
  }, [setPeerPayload]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    fixedLocationRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopSimulation();
  }, [stopSimulation]);

  return {
    simPeerId: SIM_PEER_ID,
    simPeerName: SIM_PEER_NAME,
    connectSimPeer,
    startSimulation,
    stopSimulation,
  };
}
