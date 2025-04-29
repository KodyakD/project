module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          'react': './node_modules/react',
          'react-native': './node_modules/react-native'
        }
      }]
    ]
  };
};