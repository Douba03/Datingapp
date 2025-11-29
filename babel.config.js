module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Worklets plugin (replaces reanimated/plugin in SDK 54+)
      'react-native-worklets/plugin',
    ],
  };
};

