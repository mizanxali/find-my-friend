import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PairFormProps {
  manualPeerId: string;
  setManualPeerId: (peerId: string) => void;
  connectToPeer: (peerId: string) => void;
  isConnecting: boolean;
}

const PairForm = ({
  manualPeerId,
  setManualPeerId,
  connectToPeer,
  isConnecting,
}: PairFormProps) => {
  return (
    <View className="w-full px-2">
      <Text className="text-white/70 text-sm mb-3">
        Enter your friend's Peer ID
      </Text>
      <TextInput
        className="bg-white/10 text-white rounded-xl px-4 py-3.5 text-base"
        placeholder="username or email"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={manualPeerId}
        onChangeText={setManualPeerId}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={() => connectToPeer(manualPeerId)}
      />
      <TouchableOpacity
        className="bg-white rounded-xl py-4 items-center mt-4"
        onPress={() => connectToPeer(manualPeerId)}
        disabled={isConnecting || !manualPeerId.trim()}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="black" />
        ) : (
          <Text className="text-black text-base font-semibold">Connect</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PairForm;
