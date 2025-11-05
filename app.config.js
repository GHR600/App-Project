import 'dotenv/config';

export default {
  expo: {
    name: "Journaling",
    slug: "ai-journaling-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./Journaling App Logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./journaling-anim.gif",
      resizeMode: "contain",
      backgroundColor: "#0f172a"
    },
    assetBundlePatterns: [
      
      "**/*"
    ],
    plugins: [
      "expo-font",
      "./plugins/withDisableProguard"  // ← ADD THIS LINE

    ],
    ios: {
      bundleIdentifier: "com.aijournalingapp",
      supportsTablet: true,
      infoPlist: {
        SKAdNetworkItems: [
          {
            SKAdNetworkIdentifier: "cstr6suwn9.skadnetwork"
          }
        ]
      }
    },
    android: {
      package: "com.aijournalingapp",
      versionCode: 13,  // ← ADD THIS (increment each upload)

      adaptiveIcon: {
        foregroundImage: "./Journaling App Logo.png",
        backgroundColor: "#000000ff"
      },
      permissions: [
        "com.android.vending.BILLING",  
        "android.permission.INTERNET",           // ADD THIS
        "android.permission.ACCESS_NETWORK_STATE" // ADD THIS
      ], 
      blockedPermissions: [  // ← ADD THIS
        "android.permission.RECORD_AUDIO"
      ],
      // ADD THESE THREE LINES:        
    },
    web: {
      favicon: "./Journaling App Logo.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: "06efae0a-7267-4167-ae99-30c977eb16bb"
      },
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
      supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      anthropicApiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      // RevenueCat platform-specific API keys
      revenuecatAppleApiKey: process.env.REACT_APP_REVENUECAT_APPLE_API_KEY,
      revenuecatGoogleApiKey: process.env.REACT_APP_REVENUECAT_GOOGLE_API_KEY,
      revenuecatWebApiKey: process.env.REACT_APP_REVENUECAT_WEB_API_KEY,
      revenuecatId: process.env.REACT_APP_REVENUECAT_ID
    }
  }
};