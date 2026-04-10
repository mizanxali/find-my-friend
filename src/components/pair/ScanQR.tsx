import { BarcodeScanningResult, CameraView } from "expo-camera";
import { ActivityIndicator, Text, View } from "react-native";

interface ScanQRProps {
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  scanned: boolean;
}

const ScanQR = ({ onBarcodeScanned, scanned }: ScanQRProps) => {
  return (
    <View className="w-full aspect-square rounded-2xl overflow-hidden">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />
      {scanned && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-3">Connecting...</Text>
        </View>
      )}
    </View>
  );
};

export default ScanQR;
