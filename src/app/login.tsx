import NetworkAnimation from "@/components/common/NetworkAnimation";
import LoginForm from "@/components/login/LoginForm";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { KeyboardAvoidingView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 w-full"
      style={{
        backgroundColor: Colors.dark.background,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        flex: 1,
      }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <View className="flex-1 items-center justify-center w-full">
          <NetworkAnimation />
        </View>
        <LoginForm />
      </View>
    </KeyboardAvoidingView>
  );
}
