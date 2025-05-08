const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove any potential React resolution issues
config.resolver.sourceExts = process.env.RN_SRC_EXT
  ? [...process.env.RN_SRC_EXT.split(',').concat(config.resolver.sourceExts), 'mjs']
  : [...config.resolver.sourceExts, 'mjs'];

// Ensure proper symlink resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;