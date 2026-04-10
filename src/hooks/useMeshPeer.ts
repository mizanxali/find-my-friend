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
  } = useSessionStore();

  const userId = user?.username ?? user?.email ?? String(user?.id ?? "anon");

  const start = useCallback(async () => {
    if (protocolRef.current) return protocolRef.current;

    const protocol = new OfflineProtocol({
      appId: APP_ID,
      userId,
      transports: {
        ble: { enabled: true },
        wifiDirect: { enabled: true },
      },
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
      );
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
      if (event.peer_id === pairedPeerId) {
        setPeerConnected(false);
      }
    });

    // listener for incoming location messages
    protocol.on<MessageReceivedEvent>("message_received", (event) => {
      if (event.sender !== pairedPeerId) return;
      try {
        const payload: LocationPayload = JSON.parse(event.content);
        setPeerPayload(payload);
      } catch {
        console.warn("[Mesh] Failed to parse location message:", event.content);
      }
    });

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
  ]);

  const stop = useCallback(async () => {
    if (protocolRef.current) {
      await protocolRef.current.stop();
      protocolRef.current = null;
      protocolInstance = null;
    }
  }, []);

  const sendConnectionRequest = useCallback(
    async (recipientId: string) => {
      const protocol = protocolRef.current;
      if (!protocol) throw new Error("Protocol not started");
      await protocol.sendConnectionRequest({
        recipient: recipientId,
        senderName: userId,
      });
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
      setPairedPeerId(senderId);
      setPeerConnected(true);
    },
    [userId, setPairedPeerId, setPeerConnected],
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
    sendLocation,
    protocol: protocolRef.current,
  };
}
