import { create } from "zustand";
import type {
  DiscoveredNeighbor,
  IncomingConnectionRequest,
  LocationPayload,
  PeerState,
} from "@/types";

type SessionStore = {
  myLocation: LocationPayload | null;
  peer: PeerState;
  bearing: number | null;
  distance: number | null;
  pairedPeerId: string | null;
  incomingRequest: IncomingConnectionRequest | null;
  neighbors: Record<string, DiscoveredNeighbor>;

  setMyLocation: (location: LocationPayload) => void;
  setPeerPayload: (payload: LocationPayload) => void;
  setPeerConnected: (connected: boolean) => void;
  setPeerTransport: (transport: PeerState["transport"]) => void;
  setPeerSignalStrength: (rssi: number | null) => void;
  setBearingAndDistance: (bearing: number, distance: number) => void;
  setPairedPeerId: (peerId: string | null) => void;
  setIncomingRequest: (request: IncomingConnectionRequest | null) => void;
  upsertNeighbor: (neighbor: DiscoveredNeighbor) => void;
  removeNeighbor: (peerId: string) => void;
  clearNeighbors: () => void;
  reset: () => void;
};

const initialPeer: PeerState = {
  isConnected: false,
  lastPayload: null,
  signalStrength: null,
  transport: "ble",
};

export const useSessionStore = create<SessionStore>((set) => ({
  myLocation: null,
  peer: initialPeer,
  bearing: null,
  distance: null,
  pairedPeerId: null,
  incomingRequest: null,
  neighbors: {},

  setMyLocation: (location) => set({ myLocation: location }),

  setPeerPayload: (payload) =>
    set((state) => ({
      peer: { ...state.peer, lastPayload: payload, isConnected: true },
    })),

  setPeerConnected: (connected) =>
    set((state) => ({
      peer: { ...state.peer, isConnected: connected },
    })),

  setPeerTransport: (transport) =>
    set((state) => ({
      peer: { ...state.peer, transport },
    })),

  setPeerSignalStrength: (rssi) =>
    set((state) => ({
      peer: { ...state.peer, signalStrength: rssi },
    })),

  setBearingAndDistance: (bearing, distance) => set({ bearing, distance }),

  setPairedPeerId: (peerId) => set({ pairedPeerId: peerId }),

  setIncomingRequest: (request) => set({ incomingRequest: request }),

  upsertNeighbor: (neighbor) =>
    set((state) => ({
      neighbors: { ...state.neighbors, [neighbor.peerId]: neighbor },
    })),

  removeNeighbor: (peerId) =>
    set((state) => {
      if (!state.neighbors[peerId]) return state;
      const next = { ...state.neighbors };
      delete next[peerId];
      return { neighbors: next };
    }),

  clearNeighbors: () => set({ neighbors: {} }),

  reset: () =>
    set({
      myLocation: null,
      peer: initialPeer,
      bearing: null,
      distance: null,
      pairedPeerId: null,
      incomingRequest: null,
      neighbors: {},
    }),
}));
