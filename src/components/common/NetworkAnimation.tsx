import LottieView from "lottie-react-native";
import { View } from "react-native";

const NetworkAnimation = () => {
  return (
    <View className="items-center justify-center w-full">
      <LottieView
        autoPlay
        style={{
          width: 300,
          height: 300,
        }}
        source={require("../../../assets/TechnologyNetwork.json")}
      />
    </View>
  );
};

export default NetworkAnimation;
