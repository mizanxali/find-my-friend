import { useAuth } from "@offline-protocol/id-react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginForm = () => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const { sendCode, verifyCode } = useAuth();

  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email],
  );

  const handleSendCode = async () => {
    try {
      setIsSendingCode(true);
      await sendCode(email);
      setStep("otp");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsVerifyingCode(true);
      const user = await verifyCode(email, otp);
      if (user) {
        router.replace("/");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <View className="bg-white rounded-t-3xl w-full px-6 py-8">
      <Text className="text-black text-4xl font-bold mb-2">Login</Text>
      {step === "email" && (
        <View className="flex flex-col">
          <Text className="text-black text-lg mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 w-full placeholder:text-gray-400"
            placeholder="mizan@offlineprotocol.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TouchableOpacity
            className={`border rounded-md p-3 w-full items-center justify-center mt-8 mb-8 ${isValidEmail ? "bg-black border-black" : "bg-gray-300 border-gray-300"}`}
            onPress={handleSendCode}
            disabled={!isValidEmail}
          >
            {isSendingCode ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white">Next</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {step === "otp" && (
        <View className="flex flex-col">
          <Text className="text-black text-lg mb-2">OTP</Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 w-full placeholder:text-gray-400"
            placeholder="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="one-time-code"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="done"
            onSubmitEditing={handleVerifyCode}
          />
          <TouchableOpacity
            className="bg-black text-white border border-black rounded-md p-3 w-full items-center justify-center mt-8"
            onPress={handleVerifyCode}
          >
            {isVerifyingCode ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white">Verify</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white border border-black rounded-md p-3 w-full items-center justify-center mt-4 mb-8"
            onPress={() => setStep("email")}
          >
            <Text className="text-black">Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LoginForm;
