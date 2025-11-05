const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withDisableProguard(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'android.enableR8',
      value: 'false',
    });
    config.modResults.push({
      type: 'property',
      key: 'android.enableProguardInReleaseBuilds',
      value: 'false',
    });
    return config;
  });
};