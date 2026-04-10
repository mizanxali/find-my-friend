import LoginForm from "@/components/LoginForm";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { KeyboardAvoidingView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
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
        <LoginForm />
      </View>
    </KeyboardAvoidingView>
  );
}
