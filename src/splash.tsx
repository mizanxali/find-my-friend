import { useAuth } from "@offline-protocol/id-react-native";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";

void SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync();
    }
  }, [loading]);

  return null;
}
