const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const exampleDir = path.resolve(__dirname, "example");
const escapedExampleDir = exampleDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  new RegExp(`${escapedExampleDir}[/\\\\].*`),
];

module.exports = withNativeWind(config, { input: "./globals.css" });
