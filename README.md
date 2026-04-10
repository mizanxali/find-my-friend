# Find My Friend — Offline Peer-to-Peer Friend Finder

## What This Is

- React Native app that lets two people find each other **without internet**
- Exchanges GPS coordinates over BLE/WiFi Direct via Offline Protocol Mesh SDK
- Shows **direction arrow** (compass bearing) and **distance** to the other person
- Apple Find My requires internet relay through Apple servers — this works fully offline, peer-to-peer

## Tech Stack

- **Framework**: React Native >= 0.70.0 (Expo managed workflow)
- **Mesh Networking**: `@offline-protocol/mesh-sdk` — handles BLE/WiFi Direct peer discovery, messaging, transport switching (DORS)
- **Identity**: `@offline-protocol/id-react-native` — OfflineID for peer authentication
- **State**: Zustand (lightweight, no boilerplate)
- **Compass/Sensors**: `react-native-sensors` (magnetometer for device heading)
- **Location**: `expo-location` (GPS reads — works fully offline, satellite-based)
- **Maps** (optional, offline): `react-native-maps` with pre-cached tiles or no map (compass-only mode)
- **Language**: TypeScript (strict mode)
- **Target**: iOS >= 13.0, Android >= API 26

## Architecture

### Core Loop (runs every 1-2s)

```
1. Read own GPS coords (expo-location)
2. Send {lat, lng, altitude, accuracy, timestamp} to paired peer via Mesh SDK
3. Receive peer's coords from Mesh SDK
4. Compute bearing + distance (Haversine formula)
5. Read device heading (magnetometer)
6. Render arrow: rotation = bearing - deviceHeading
7. Render distance label with unit auto-scaling (m/km)
```

### Screens

- **Home** — start/join a session, show OfflineID QR for pairing
- **Pairing** — scan peer's QR or tap to pair via BLE proximity
- **Finder** — the main compass/arrow UI with distance, accuracy indicator, last-update timestamp
- **Settings** — update interval, units (metric/imperial), display name

### Data Model

```ts
type LocationPayload = {
  peerId: string;
  lat: number;
  lng: number;
  altitude: number | null;
  accuracy: number; // meters, from GPS
  heading: number | null; // device compass heading
  timestamp: number; // unix ms
};

type PeerState = {
  isConnected: boolean;
  lastPayload: LocationPayload | null;
  signalStrength: number | null; // from BLE RSSI
  transport: "ble" | "wifi-direct" | "internet";
};

type SessionState = {
  myLocation: LocationPayload | null;
  peer: PeerState;
  bearing: number | null; // degrees, 0=north
  distance: number | null; // meters
};
```

### Key Computations

- **Haversine distance**: `2 * R * asin(sqrt(sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlng/2)))`
- **Bearing**: `atan2(sin(Δlng)*cos(lat2), cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(Δlng))`
- **Arrow rotation**: `bearing - deviceMagneticHeading` (apply magnetic declination if available)
- All trig in radians, convert to degrees for display

## Mesh SDK Integration

### Peer Discovery & Messaging

- Use Mesh SDK's peer discovery to find nearby devices
- Pair via QR code exchange (encode peerId + session token)
- `sendMessage(peerId, JSON.stringify(locationPayload))` — every 1-2s
- `onMessage(callback)` — parse incoming LocationPayload, update Zustand store
- SDK handles transport switching (BLE ↔ WiFi Direct) via DORS automatically

### Reliability

- SDK provides built-in ACKs, retries, deduplication
- App-level: show "stale" indicator if last update > 5s old
- Show "lost connection" if last update > 15s old

## UX Considerations

- **Close range (<10m)**: GPS accuracy degrades — show "You're close!" instead of jittery arrow
- **Accuracy indicator**: ring/badge showing GPS accuracy radius (±3m, ±10m, etc.)
- **Battery**: GPS polling at 1-2s is moderate drain — offer "power saver" mode (5s interval)
- **BLE range**: ~30-70m direct, extendable via mesh hops through intermediate devices
- **WiFi Direct range**: ~200m, SDK auto-upgrades when available
- **No map needed**: compass-only UI works without tiles or internet
- **Haptic feedback**: pulse when distance decreases, stronger as you get closer

## File Structure

```
src/
├── app/                    # Expo Router screens
│   ├── index.tsx           # Home/start screen
│   ├── pair.tsx            # QR pairing screen
│   ├── find.tsx            # Main finder compass UI
│   └── settings.tsx        # Preferences
├── components/
│   ├── CompassArrow.tsx    # Animated directional arrow
│   ├── DistanceLabel.tsx   # Auto-scaling distance display
│   ├── AccuracyRing.tsx    # GPS accuracy visualization
│   ├── ConnectionBadge.tsx # BLE/WiFi/Internet + signal strength
│   └── PeerQR.tsx          # QR code display/scanner
├── hooks/
│   ├── useLocation.ts      # GPS polling, expo-location wrapper
│   ├── useMeshPeer.ts      # Mesh SDK send/receive, connection state
│   ├── useCompass.ts       # Magnetometer heading
│   └── useBearing.ts       # Haversine + bearing math
├── stores/
│   └── sessionStore.ts     # Zustand: session, peer, location state
├── utils/
│   ├── geo.ts              # Haversine, bearing, unit conversion
│   └── constants.ts        # Update intervals, thresholds
└── types/
    └── index.ts            # LocationPayload, PeerState, SessionState
```

## Constraints & Known Limits

- **No internet required** — entire flow is offline (GPS + BLE/WiFi Direct)
- **Two-person only** (v1) — 1:1 pairing, not group finding
- **GPS won't work indoors** — degrade gracefully, show BLE RSSI-based proximity instead
- **iOS background BLE restrictions** — foreground usage recommended; background mode limited by Apple
- **Magnetic interference** — compass heading unreliable near metal/electronics; warn user
- **No offline maps** — compass-only in v1; could add pre-cached tiles in v2
