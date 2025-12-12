// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver to handle optional native modules
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  // Provide a mock for react-native-iap on web
  resolveRequest: (context, moduleName, platform) => {
    // Mock react-native-iap for web platform
    if (platform === 'web' && moduleName === 'react-native-iap') {
      return {
        type: 'empty',
      };
    }
    // Use default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Metro will handle optional native modules automatically

module.exports = config;
