import type { BarcodeScanningResult } from "expo-camera";
import { Text, View } from "react-native";

import PairForm from "@/components/pair/PairForm";
import PeerQR from "@/components/pair/PeerQR";
import ScanQR from "@/components/pair/ScanQR";
import { PairingMode } from "@/types";

interface PairModeContentProps {
  mode: PairingMode;
  myPeerId: string;
  hasCameraPermission: boolean;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  scanned: boolean;
  manualPeerId: string;
  setManualPeerId: (peerId: string) => void;
  connectToPeer: (peerId: string) => void;
  isConnecting: boolean;
}

export default function PairModeContent({
  mode,
  myPeerId,
  hasCameraPermission,
  onBarcodeScanned,
  scanned,
  manualPeerId,
  setManualPeerId,
  connectToPeer,
  isConnecting,
}: PairModeContentProps) {
  return (
    <View className="flex-1 items-center justify-center">
      {mode === "show-qr" && (
        <View className="items-center">
          <PeerQR peerId={myPeerId} size={220} />
          <Text className="mt-6 px-8 text-center text-sm text-white/70">
            Show this to your friend so they can scan it
          </Text>
        </View>
      )}

      {mode === "scan-qr" && hasCameraPermission && (
        <ScanQR onBarcodeScanned={onBarcodeScanned} scanned={scanned} />
      )}

      {mode === "scan-qr" && !hasCameraPermission && (
        <Text className="px-8 text-center text-sm text-white/60">
          Camera access is required before you can scan a QR code.
        </Text>
      )}

      {mode === "manual" && (
        <PairForm
          manualPeerId={manualPeerId}
          setManualPeerId={setManualPeerId}
          connectToPeer={connectToPeer}
          isConnecting={isConnecting}
        />
      )}
    </View>
  );
}
