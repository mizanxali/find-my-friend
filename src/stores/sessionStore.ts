import { create } from "zustand";
import type { LocationPayload, PeerState } from "@/types";

type SessionStore = {
  myLocation: LocationPayload | null;
  peer: PeerState;
  bearing: number | null;
  distance: number | null;
  pairedPeerId: string | null;

  setMyLocation: (location: LocationPayload) => void;
  setPeerPayload: (payload: LocationPayload) => void;
  setPeerConnected: (connected: boolean) => void;
  setPeerTransport: (transport: PeerState["transport"]) => void;
  setPeerSignalStrength: (rssi: number | null) => void;
  setBearingAndDistance: (bearing: number, distance: number) => void;
  setPairedPeerId: (peerId: string | null) => void;
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

  reset: () =>
    set({
      myLocation: null,
      peer: initialPeer,
      bearing: null,
      distance: null,
      pairedPeerId: null,
    }),
}));
