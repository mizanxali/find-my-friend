import * as Location from "expo-location";
import { useEffect, useState } from "react";

/** Returns the current device compass heading in degrees (0 = north). */
export function useCompass(): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    Location.watchHeadingAsync((data) => {
      // prefer trueHeading (geographic north) when available, fall back to magHeading
      const h = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
      setHeading(h);
    }).then((s) => {
      sub = s;
    });

    return () => {
      sub?.remove();
    };
  }, []);

  return heading;
}
