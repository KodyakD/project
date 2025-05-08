module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module-resolver', {
        alias: {
          '@': './src',
        },
      }],
      // Add this plugin to handle Android SDK configuration
      ['expo-gradle-properties-plugin', {
        "androidXCore": "1.12.0",
        "compileSdkVersion": 35,
        "targetSdkVersion": 33,
        "buildToolsVersion": "35.0.0"
      }]
    ]
  };
};