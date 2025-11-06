const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const proguardRules = `
# Don't obfuscate anything - aggressive approach
-dontobfuscate
-dontoptimize

# Keep everything
-keepattributes *

# Keep all classes
-keep class ** { *; }

# Keep all methods
-keepclassmembers class * {
    <methods>;
}

# Keep source file and line numbers for debugging
-keepattributes SourceFile,LineNumberTable
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
        if (!existing.includes('Don\'t obfuscate anything')) {
          fs.appendFileSync(proguardPath, '\n' + proguardRules);
        }
      } else {
        fs.writeFileSync(proguardPath, proguardRules);
      }
      
      return config;
    },
  ]);
};