const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.alias = {
  "@": path.resolve(__dirname)
};
module.exports = config;