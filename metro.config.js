const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve React to the same instance
config.resolver.extraNodeModules = {
  'react': require.resolve('react'),
  'react-native': require.resolve('react-native')
};

module.exports = config;