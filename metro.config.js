// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const EXCLUDE_ON_WEB = [
  '@stripe/stripe-react-native',
  'react-native-maps',
];

module.exports = (async () => {
  let config = await getDefaultConfig(__dirname);

  // 1. ignore native modules when platform is web / node
  const originalResolve = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (['web', 'node'].includes(platform) && EXCLUDE_ON_WEB.some(m => moduleName.includes(m))) {
      return { type: 'empty' };
    }
    return originalResolve
      ? originalResolve(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  };

  // 2. silence expo-asset warning
  config.resolver.unstable_enablePackageExports = false;

  // 3. keep NativeWind
  config = withNativeWind(config, { input: './global.css' });

  return config;
})();