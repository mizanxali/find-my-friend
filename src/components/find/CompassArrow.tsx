import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

interface CompassArrowProps {
  rotation: number;
  size?: number;
}

export default function CompassArrow({
  rotation,
  size = 200,
}: CompassArrowProps) {
  const animatedRotation = useSharedValue(rotation);

  useEffect(() => {
    animatedRotation.value = withSpring(rotation, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  }, [rotation, animatedRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${animatedRotation.value}deg` }],
  }));

  const arrowSize = size * 0.6;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <View
        className="absolute border-2 border-blue-500/30"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
      <Animated.View
        className="items-center justify-center"
        style={animatedStyle}
      >
        <Svg
          width={arrowSize}
          height={arrowSize}
          viewBox="0 0 100 100"
          fill="none"
        >
          <Path
            d="M50 10 L80 70 L50 55 L20 70 Z"
            fill="#3B82F6"
            stroke="#60A5FA"
            strokeWidth={2}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
