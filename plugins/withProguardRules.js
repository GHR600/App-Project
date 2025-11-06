const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const proguardRules = `
# Keep all React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }

# Keep Supabase
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**

# Keep RevenueCat
-keep class com.revenuecat.purchases.** { *; }

# Keep JavaScript interface
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep source file names and line numbers for stack traces
-keepattributes SourceFile,LineNumberTable

# Don't obfuscate native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native module classes
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep enums
-keepclassmembers enum * { *; }
`;

module.exports = function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      
      // Create or append to proguard-rules.pro
      if (fs.existsSync(proguardPath)) {
        const existing = fs.readFileSync(proguardPath, 'utf8');
        if (!existing.includes('Keep all React Native')) {
          fs.appendFileSync(proguardPath, '\n' + proguardRules);
        }
      } else {
        fs.writeFileSync(proguardPath, proguardRules);
      }
      
      return config;
    },
  ]);
};