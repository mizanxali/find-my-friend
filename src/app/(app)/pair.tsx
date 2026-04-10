import { useAuth } from "@offline-protocol/id-react-native";
import type { BarcodeScanningResult } from "expo-camera";
import { useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PairConnectionStatus from "@/components/pair/PairConnectionStatus";
import PairHeader from "@/components/pair/PairHeader";
import PairLoadingState from "@/components/pair/PairLoadingState";
import PairModeContent from "@/components/pair/PairModeContent";
import PairTabs from "@/components/pair/PairTabs";
import { Colors, Spacing } from "@/constants/theme";
import { useMeshPeer } from "@/hooks/useMeshPeer";
import { useSessionStore } from "@/stores/sessionStore";
import { PairingMode } from "@/types";

export default function PairScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { start, sendConnectionRequest } = useMeshPeer();

  const pairedPeerId = useSessionStore((s) => s.pairedPeerId);
  const peerConnected = useSessionStore((s) => s.peer.isConnected);
  const peerTransport = useSessionStore((s) => s.peer.transport);

  const [mode, setMode] = useState<PairingMode>("show-qr");
  const [manualPeerId, setManualPeerId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [meshStarted, setMeshStarted] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const myPeerId = user?.username ?? user?.email ?? String(user?.id ?? "");

  useEffect(() => {
    start().then(() => setMeshStarted(true));
  }, [start]);

  useEffect(() => {
    if (pairedPeerId && peerConnected) {
      const timeout = setTimeout(() => {
        console.log("Paired and connected", pairedPeerId, peerConnected);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [pairedPeerId, peerConnected]);

  const connectToPeer = useCallback(
    async (peerId: string) => {
      const trimmed = peerId.trim();
      if (!trimmed) return;
      if (trimmed === myPeerId) {
        Alert.alert("Error", "You can't pair with yourself.");
        return;
      }

      setIsConnecting(true);
      try {
        await sendConnectionRequest(trimmed);
      } catch (error) {
        console.error("[Pair] Connection request failed:", error);
        Alert.alert("Error", "Failed to send connection request. Try again.");
      } finally {
        setIsConnecting(false);
      }
    },
    [myPeerId, sendConnectionRequest],
  );

  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);
      connectToPeer(result.data);
    },
    [scanned, connectToPeer],
  );

  const handleScanMode = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera access is needed to scan QR codes.",
        );
        return;
      }
    }
    setScanned(false);
    setMode("scan-qr");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: insets.top + Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingBottom: insets.bottom + Spacing.three,
      }}
    >
      <PairHeader onBack={() => router.back()} />

      {pairedPeerId && (
        <PairConnectionStatus
          pairedPeerId={pairedPeerId}
          peerConnected={peerConnected}
          peerTransport={peerTransport}
        />
      )}

      {!meshStarted && <PairLoadingState message="Starting mesh network..." />}

      {meshStarted && !pairedPeerId && (
        <>
          <PairTabs
            mode={mode}
            onShowQrPress={() => setMode("show-qr")}
            onScanQrPress={handleScanMode}
            onManualPress={() => setMode("manual")}
          />

          <PairModeContent
            mode={mode}
            myPeerId={myPeerId}
            hasCameraPermission={Boolean(cameraPermission?.granted)}
            onBarcodeScanned={handleBarCodeScanned}
            scanned={scanned}
            manualPeerId={manualPeerId}
            setManualPeerId={setManualPeerId}
            connectToPeer={connectToPeer}
            isConnecting={isConnecting}
          />
        </>
      )}
    </View>
  );
}
