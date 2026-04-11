export type IncomingConnectionRequest = {
  sender: string;
  senderName: string;
  timestamp: number;
};

export type DiscoveredNeighbor = {
  peerId: string;
  transport: "ble" | "wifi-direct" | "internet";
  rssi: number | null;
  discoveredAt: number;
};

export type LocationPayload = {
  peerId: string;
  lat: number;
  lng: number;
  altitude: number | null;
  accuracy: number;
  heading: number | null;
  timestamp: number;
};

export type PeerState = {
  isConnected: boolean;
  lastPayload: LocationPayload | null;
  signalStrength: number | null;
  transport: "ble" | "wifi-direct" | "internet";
};

export type SessionState = {
  myLocation: LocationPayload | null;
  peer: PeerState;
  bearing: number | null;
  distance: number | null;
};
