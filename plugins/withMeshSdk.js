const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POD_LINE = `  pod 'MeshSdk', :path => '../node_modules/@offline-protocol/mesh-sdk/ios'`;

const withMeshSdk = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (contents.includes("pod 'MeshSdk'")) {
        return config;
      }

      contents = contents.replace(
        /use_expo_modules!/,
        `use_expo_modules!\n${POD_LINE}`
      );

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withMeshSdk;
