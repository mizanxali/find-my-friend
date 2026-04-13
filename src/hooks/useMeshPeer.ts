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
import { useCallback, useRef } from "react";
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
    console.warn(
      `[Mesh][Android ${Platform.Version}] Android permissions not fully granted:`,
      result,
    );
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

    const granted = await ensureAndroidPermissions();
    if (!granted) return null;

    const protocol = new OfflineProtocol({
      appId: APP_ID,
      userId,
      transports: {
        ble: { enabled: true },
        wifiDirect: { enabled: true },
        internet: { enabled: true },
      },
      encryption: {
        enabled: false,
        autoKeyExchange: false,
        storePending: false,
      },
    });

    // diagnostic listener
    // biome-ignore lint/suspicious/noExplicitAny: type is broken from offline-protocol/mesh-sdk
    protocol.on("diagnostic", (event: any) => {
      if (event.level === "warning")
        console.log(`[Mesh][${userId}] Diagnostic:`, event);
    });

    protocol.on("transport_switched", (event) => {
      console.log(
        `[Mesh][${userId}] Transport switched:`,
        event.type,
        event.seenAt,
      );
    });

    // listener for incoming messages
    protocol.on<MessageReceivedEvent>("message_received", (event) => {
      console.log(
        `[Mesh][${userId}] Message received from:`,
        event.sender,
        event.content,
      );
    });

    // listener for incoming connection requests
    protocol.on<ConnectionRequestReceivedEvent>(
      "connection_request_received",
      (event) => {
        console.log(
          `[Mesh][${userId}] Connection request from:`,
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
      console.log(
        `[Mesh][${userId}] Connection accepted by:`,
        event.accepted_by_name,
      );
      setPairedPeerId(event.accepted_by);
      setPeerConnected(true);
    });

    // listener for neighbor discovery
    protocol.on<NeighborDiscoveredEvent>("neighbor_discovered", (event) => {
      console.log(
        `[Mesh][${userId}] Neighbor discovered:`,
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
      const currentPaired = useSessionStore.getState().pairedPeerId;
      if (event.peer_id === currentPaired) {
        setPeerConnected(true);
        setPeerTransport(event.transport as "ble" | "wifi-direct" | "internet");
        if (event.rssi != null) {
          setPeerSignalStrength(event.rssi);
        }
      }
    });

    // listener for neighbor loss
    protocol.on<NeighborLostEvent>("neighbor_lost", (event) => {
      console.log(`[Mesh][${userId}] Neighbor lost:`, event.peer_id);
      removeNeighbor(event.peer_id);
      const currentPaired = useSessionStore.getState().pairedPeerId;
      if (event.peer_id === currentPaired) {
        setPeerConnected(false);
      }
    });

    // listener for incoming location messages, heartbeat, and connection confirmation
    protocol.on<MessageReceivedEvent>("message_received", (event) => {
      if (event.content === "heartbeat") {
        Alert.alert("Heartbeat received", `From ${event.sender}`);
        return;
      }
      // Backup for connection_accepted: the acceptor sends this confirmation
      if (event.content === "connection_confirmed") {
        console.log(
          `[Mesh][${userId}] Connection confirmed message from:`,
          event.sender,
        );
        setPairedPeerId(event.sender);
        setPeerConnected(true);
        return;
      }
      // Only accept location payloads from the paired peer
      const currentPairedPeerId = useSessionStore.getState().pairedPeerId;
      if (event.sender !== currentPairedPeerId) return;
      try {
        const payload: LocationPayload = JSON.parse(event.content);
        setPeerPayload(payload);
      } catch {
        console.warn(
          `[Mesh][${userId}] Failed to parse location message:`,
          event.content,
        );
      }
    });

    if (Platform.OS === "android") {
      try {
        const enabled = await protocol.isBluetoothEnabled();
        console.log(`[Mesh][${userId}] Bluetooth enabled:`, enabled);
        if (!enabled) {
          const accepted = await protocol.requestEnableBluetooth();
          console.log(`[Mesh][${userId}] Bluetooth enable accepted:`, accepted);
        }
      } catch (err) {
        console.warn(
          `[Mesh][${userId}] Failed to check/enable Bluetooth:`,
          err,
        );
      }
    }

    await protocol.start();
    protocolRef.current = protocol;
    protocolInstance = protocol;
    console.log(`[Mesh][${userId}] Protocol started for user:`, userId);

    return protocol;
  }, [
    userId,
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
    const protocol = protocolRef.current ?? protocolInstance;
    if (protocol) {
      await protocol.stop();
      protocolRef.current = null;
      protocolInstance = null;
      clearNeighbors();
    }
  }, [clearNeighbors]);

  const sendConnectionRequest = useCallback(
    async (recipientId: string) => {
      const protocol = protocolRef.current ?? protocolInstance;
      if (!protocol) throw new Error("Protocol not started");

      console.log(
        `[Mesh][${userId}] Sending connection request to: ${recipientId}`,
      );
      const response = await protocol.sendConnectionRequest({
        recipient: recipientId,
        senderName: userId,
      });
      console.log(`[Mesh][${userId}] Connection request response:`, response);
    },
    [userId],
  );

  const acceptConnectionRequest = useCallback(
    async (senderId: string) => {
      const protocol = protocolRef.current ?? protocolInstance;
      if (!protocol) throw new Error("Protocol not started");
      await protocol.acceptConnectionRequest({
        recipient: senderId,
        accepterName: userId,
      });
      // Send a backup confirmation message so the sender can detect
      // acceptance even if the connection_accepted event doesn't arrive
      await protocol.sendMessage({
        recipient: senderId,
        content: "connection_confirmed",
      });
      setIncomingRequest(null);
      setPairedPeerId(senderId);
      setPeerConnected(true);
    },
    [userId, setPairedPeerId, setPeerConnected, setIncomingRequest],
  );

  const rejectConnectionRequest = useCallback(
    async (senderId: string) => {
      const protocol = protocolRef.current ?? protocolInstance;
      if (!protocol) throw new Error("Protocol not started");
      await protocol.rejectConnectionRequest({ recipient: senderId });
      setIncomingRequest(null);
    },
    [setIncomingRequest],
  );

  const sendLocation = useCallback(
    async (payload: LocationPayload) => {
      const protocol = protocolRef.current ?? protocolInstance;
      if (!protocol || !pairedPeerId) return;
      console.log(`[Mesh][${userId}] Sending location to:`, pairedPeerId);
      await protocol.sendMessage({
        recipient: pairedPeerId,
        content: JSON.stringify(payload),
      });
    },
    [pairedPeerId],
  );

  const sendHeartbeat = useCallback(async () => {
    const protocol = protocolRef.current ?? protocolInstance;
    if (!protocol || !pairedPeerId) return;
    console.log(`[Mesh][${userId}] Sending heartbeat to:`, pairedPeerId);
    const response = await protocol.sendMessage({
      recipient: pairedPeerId,
      content: "heartbeat",
    });
    console.log(`[Mesh][${userId}] Heartbeat response:`, response);
  }, [pairedPeerId]);

  const sendHeartbeatTo = useCallback(async (recipientId: string) => {
    const protocol = protocolRef.current ?? protocolInstance;
    if (!protocol) throw new Error("Protocol not started");
    console.log(`[Mesh][${userId}] Sending heartbeat to:`, recipientId);
    const response = await protocol.sendMessage({
      recipient: recipientId,
      content: "heartbeat",
    });
    console.log(`[Mesh][${userId}] Heartbeat response:`, response);
  }, []);

  return {
    start,
    stop,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    sendLocation,
    sendHeartbeat,
    sendHeartbeatTo,
    protocol: protocolRef.current,
  };
}
