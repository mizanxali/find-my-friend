import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface PeerQRProps {
  peerId: string;
  size?: number;
}

export default function PeerQR({ peerId, size = 200 }: PeerQRProps) {
  return (
    <View className="items-center">
      <View className="bg-white p-4 rounded-2xl">
        <QRCode value={peerId} size={size} />
      </View>
      <Text className="text-white/50 text-sm mt-3">
        Ask your friend to scan this code
      </Text>
    </View>
  );
}
