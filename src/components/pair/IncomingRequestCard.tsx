import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

interface IncomingRequestCardProps {
  senderName: string;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export default function IncomingRequestCard({
  senderName,
  onAccept,
  onReject,
}: IncomingRequestCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  const disabled = isAccepting || isRejecting;

  return (
    <View className="bg-white/10 rounded-2xl p-5 mx-1 mb-6">
      <Text className="text-white text-base font-semibold mb-1">
        Incoming Request
      </Text>
      <Text className="text-white/60 text-sm mb-5">
        {senderName} wants to connect with you
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-white rounded-xl py-3 items-center"
          onPress={handleAccept}
          disabled={disabled}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <Text className="text-black font-semibold">Accept</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 border border-white/20 rounded-xl py-3 items-center"
          onPress={handleReject}
          disabled={disabled}
        >
          {isRejecting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white/60 font-medium">Decline</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
