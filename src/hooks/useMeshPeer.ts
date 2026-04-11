import { APP_ID } from "@/constants/mesh";
import { useSessionStore } from "@/stores/sessionStore";
import type { LocationPayload } from "@/types";
import { useAuth } from "@offline-protocol/id-react-native";
import {
  OfflineProtocol,
  type ConnectionAcceptedEvent,
  type ConnectionRequestReceivedEvent,
  type MessageReceivedEvent,
  type NeighborDiscoveredEvent,
  type NeighborLostEvent,
} from "@offline-protocol/mesh-sdk";
import { useCallback, useEffect, useRef } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";

async function ensureAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  const apiLevel =
    typeof Platform.Version === "number"
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);

  const perms: string[] = ["android.permission.ACCESS_FINE_LOCATION"];
  if (apiLevel >= 31) {
    perms.push(
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.BLUETOOTH_CONNECT",
    );
  }
  if (apiLevel >= 33) {
    perms.push("android.permission.NEARBY_WIFI_DEVICES");
  }

  const result = await PermissionsAndroid.requestMultiple(perms as never);
  const allGranted = Object.values(result).every(
    (v) => v === PermissionsAndroid.RESULTS.GRANTED,
  );
  if (!allGranted) {
    console.warn("[Mesh] Android permissions not fully granted:", result);
  }
  return allGranted;
}

let protocolInstance: OfflineProtocol | null = null;

export function getProtocol(): OfflineProtocol | null {
  return protocolInstance;
}

export function useMeshPeer() {
  const { user } = useAuth();
  const protocolRef = useRef<OfflineProtocol | null>(null);
  const {
    pairedPeerId,
    setPairedPeerId,
    setPeerPayload,
    setPeerConnected,
    setPeerTransport,
    setPeerSignalStrength,
    setIncomingRequest,
    upsertNeighbor,
    removeNeighbor,
    clearNeighbors,
  } = useSessionStore();

  const userId = user?.username ?? user?.email ?? String(user?.id ?? "anon");

  const start = useCallback(async () => {
    if (protocolRef.current) return protocolRef.current;

    await ensureAndroidPermissions();

    const protocol = new OfflineProtocol({
      appId: APP_ID,
      userId,
      transports: {
        ble: { enabled: true },
        wifiDirect: { enabled: true },
      },
    });

    // diagnostic listener — reveals native-side issues (perm, BT, scan, advertise)
    protocol.on("diagnostic", (event: any) => {
      const level = String(event?.level ?? "info").toUpperCase();
      console.log(`[Mesh][${level}] ${event?.message}`, event?.context ?? "");
    });

    protocol.on("transport_switched", (event: any) => {
      console.log("[Mesh] Transport switched:", event);
    });

    // listener for incoming messages
    protocol.on<MessageReceivedEvent>("message_received", (event) => {
      console.log("[Mesh] Message received from:", event.sender, event.content);
    });

    // listener for incoming connection requests
    protocol.on<ConnectionRequestReceivedEvent>(
      "connection_request_received",
      (event) => {
        console.log(
          "[Mesh] Connection request from:",
          event.sender,
          event.sender_name,
        );
        setIncomingRequest({
          sender: event.sender,
          senderName: event.sender_name,
          timestamp: event.timestamp,
        });
      },
    );

    // listener for accepted connections
    protocol.on<ConnectionAcceptedEvent>("connection_accepted", (event) => {
      console.log("[Mesh] Connection accepted by:", event.accepted_by_name);
      setPairedPeerId(event.accepted_by);
      setPeerConnected(true);
    });

    // listener for neighbor discovery
    protocol.on<NeighborDiscoveredEvent>("neighbor_discovered", (event) => {
      console.log(
        "[Mesh] Neighbor discovered:",
        event.peer_id,
        "via",
        event.transport,
        "RSSI:",
        event.rssi,
      );
      upsertNeighbor({
        peerId: event.peer_id,
        transport: event.transport as "ble" | "wifi-direct" | "internet",
        rssi: event.rssi ?? null,
        discoveredAt: Date.now(),
      });
      if (event.peer_id === pairedPeerId) {
        setPeerConnected(true);
        setPeerTransport(event.transport as "ble" | "wifi-direct" | "internet");
        if (event.rssi != null) {
          setPeerSignalStrength(event.rssi);
        }
      }
    });

    // listener for neighbor loss
    protocol.on<NeighborLostEvent>("neighbor_lost", (event) => {
      console.log("[Mesh] Neighbor lost:", event.peer_id);
      removeNeighbor(event.peer_id);
      if (event.peer_id === pairedPeerId) {
        setPeerConnected(false);
      }
    });

    // listener for incoming location messages + heartbeat
    protocol.on<MessageReceivedEvent>("message_received", (event) => {
      if (event.content === "heartbeat") {
        Alert.alert("Heartbeat received", `From ${event.sender}`);
        return;
      }
      if (event.sender !== pairedPeerId) return;
      try {
        const payload: LocationPayload = JSON.parse(event.content);
        setPeerPayload(payload);
      } catch {
        console.warn("[Mesh] Failed to parse location message:", event.content);
      }
    });

    if (Platform.OS === "android") {
      try {
        const enabled = await protocol.isBluetoothEnabled();
        console.log("[Mesh] Bluetooth enabled:", enabled);
        if (!enabled) {
          const accepted = await protocol.requestEnableBluetooth();
          console.log("[Mesh] Bluetooth enable accepted:", accepted);
        }
      } catch (err) {
        console.warn("[Mesh] Failed to check/enable Bluetooth:", err);
      }
    }

    await protocol.start();
    protocolRef.current = protocol;
    protocolInstance = protocol;
    console.log("[Mesh] Protocol started for user:", userId);

    return protocol;
  }, [
    userId,
    pairedPeerId,
    setPairedPeerId,
    setPeerPayload,
    setPeerConnected,
    setPeerTransport,
    setPeerSignalStrength,
    setIncomingRequest,
    upsertNeighbor,
    removeNeighbor,
  ]);

  const stop = useCallback(async () => {
    if (protocolRef.current) {
      await protocolRef.current.stop();
      protocolRef.current = null;
      protocolInstance = null;
      clearNeighbors();
    }
  }, [clearNeighbors]);

  const sendConnectionRequest = useCallback(
    async (recipientId: string) => {
      const protocol = protocolRef.current;
      if (!protocol) throw new Error("Protocol not started");
      console.log("[Mesh] Sending connection request to:", recipientId);
      const response = await protocol.sendConnectionRequest({
        recipient: recipientId,
        senderName: userId,
      });
      console.log("[Mesh] Connection request response:", response);
      setPairedPeerId(recipientId);
    },
    [userId, setPairedPeerId],
  );

  const acceptConnectionRequest = useCallback(
    async (senderId: string) => {
      const protocol = protocolRef.current;
      if (!protocol) throw new Error("Protocol not started");
      await protocol.acceptConnectionRequest({
        recipient: senderId,
        accepterName: userId,
      });
      setIncomingRequest(null);
      setPairedPeerId(senderId);
      setPeerConnected(true);
    },
    [userId, setPairedPeerId, setPeerConnected, setIncomingRequest],
  );

  const rejectConnectionRequest = useCallback(
    async (senderId: string) => {
      const protocol = protocolRef.current;
      if (!protocol) throw new Error("Protocol not started");
      await protocol.rejectConnectionRequest({ recipient: senderId });
      setIncomingRequest(null);
    },
    [setIncomingRequest],
  );

  const sendLocation = useCallback(
    async (payload: LocationPayload) => {
      const protocol = protocolRef.current;
      if (!protocol || !pairedPeerId) return;
      await protocol.sendMessage({
        recipient: pairedPeerId,
        content: JSON.stringify(payload),
      });
    },
    [pairedPeerId],
  );

  const sendHeartbeat = useCallback(async () => {
    const protocol = protocolRef.current;
    if (!protocol || !pairedPeerId) return;
    console.log("[Mesh] Sending heartbeat to:", pairedPeerId);
    const response = await protocol.sendMessage({
      recipient: pairedPeerId,
      content: "heartbeat",
    });
    console.log("[Mesh] Heartbeat response:", response);
  }, [pairedPeerId]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    sendLocation,
    sendHeartbeat,
    protocol: protocolRef.current,
  };
}
