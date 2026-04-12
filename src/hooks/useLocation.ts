import { UPDATE_INTERVAL_MS } from "@/constants/mesh";
import { useSessionStore } from "@/stores/sessionStore";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef } from "react";

export function useLocation() {
  const setMyLocation = useSessionStore((s) => s.setMyLocation);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("[Location] Permission denied");
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setMyLocation({
        peerId: "",
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy ?? 0,
        heading: loc.coords.heading ?? null,
        timestamp: loc.timestamp,
      });
    } catch (err) {
      console.warn("[Location] Initial read failed:", err);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setMyLocation({
          peerId: "",
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy ?? 0,
          heading: loc.coords.heading ?? null,
          timestamp: loc.timestamp,
        });
      } catch (err) {
        console.warn("[Location] Poll failed:", err);
      }
    }, UPDATE_INTERVAL_MS);
  }, [setMyLocation]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop };
}
