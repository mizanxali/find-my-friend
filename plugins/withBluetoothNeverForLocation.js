const { withAndroidManifest } = require("@expo/config-plugins");

const withBluetoothNeverForLocation = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest["uses-permission"] || [];

    for (const perm of permissions) {
      if (
        perm.$?.["android:name"] === "android.permission.BLUETOOTH_SCAN"
      ) {
        perm.$["android:usesPermissionFlags"] = "neverForLocation";
      }
    }

    return config;
  });
};

module.exports = withBluetoothNeverForLocation;
