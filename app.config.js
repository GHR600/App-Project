import 'dotenv/config';

export default {
  expo: {
    name: "Journaling",
    slug: "journaling",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      bundleIdentifier: "com.journaling",
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
      package: "com.journaling",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a"
      },
      permissions: [
        "com.android.vending.BILLING"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
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