# 🚀 Deployment Guide for AI Journaling App

This guide covers deploying the AI Journaling App to production environments.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase project (production database)
- OpenAI API key (optional, but recommended for real AI features)
- EAS CLI for Expo builds
- Access to app stores (for mobile distribution)

## 🏗️ Build Process

### 1. Environment Configuration

Create production environment files:

```bash
# .env.production
REACT_APP_SUPABASE_URL=https://your-production-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
REACT_APP_OPENAI_API_KEY=your-openai-api-key
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

### 2. Database Setup (Production)

1. **Create Production Supabase Project:**
   ```bash
   # Create new project in Supabase dashboard
   # Note down URL and anon key
   ```

2. **Run Database Schema:**
   ```sql
   -- Execute scripts/setup-database.sql
   -- Execute scripts/add-chat-table.sql
   -- Execute scripts/setup-proper-rls.sql
   ```

3. **Verify RLS Policies:**
   ```bash
   # Test with production data
   npm run test-db
   ```

### 3. Mobile App Build (React Native/Expo)

#### Configure EAS Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

#### Build Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### iOS Build

```bash
# Development build
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production
```

#### Android Build

```bash
# Development build
eas build --platform android --profile development

# Production build for Google Play
eas build --platform android --profile production
```

### 4. Web Deployment

#### Using Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Using Netlify

```bash
# Build the project
npm run build

# Deploy using Netlify CLI
netlify deploy --prod --dir=dist
```

#### Using Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## 🔧 Configuration Management

### Environment Variables

**Required Variables:**
```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Optional Variables:**
```env
REACT_APP_OPENAI_API_KEY=your-openai-key
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_ANALYTICS_ID=your-analytics-id
```

### App Configuration (app.json/app.config.js)

```json
{
  "expo": {
    "name": "AI Journaling",
    "slug": "ai-journaling-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.aijournaling",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.aijournaling",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-notifications",
      "expo-av",
      "expo-speech"
    ]
  }
}
```

## 📱 App Store Deployment

### iOS App Store

1. **Prepare App Store Connect:**
   - Create app record in App Store Connect
   - Set up app metadata, screenshots, descriptions
   - Configure pricing and availability

2. **Submit for Review:**
   ```bash
   # Build and submit
   eas submit --platform ios

   # Or manually upload via Xcode
   ```

3. **Review Process:**
   - Apple typically takes 24-48 hours for review
   - Address any feedback from Apple Review Team
   - Release once approved

### Google Play Store

1. **Prepare Play Console:**
   - Create app in Google Play Console
   - Set up store listing, graphics, content rating
   - Configure pricing and distribution

2. **Submit for Review:**
   ```bash
   # Build and submit
   eas submit --platform android

   # Or manually upload AAB/APK
   ```

3. **Release Process:**
   - Google typically reviews within a few hours
   - Use staged rollout for gradual release
   - Monitor crash reports and user feedback

## 🔍 Monitoring & Analytics

### Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/react-native

# Configure in app.json
{
  "expo": {
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your-org",
            "project": "ai-journaling-app"
          }
        }
      ]
    }
  }
}
```

### Analytics (Firebase/Expo Analytics)

```bash
# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/analytics

# Or use Expo Analytics
npm install expo-analytics-amplitude
```

### Performance Monitoring

```bash
# Firebase Performance
npm install @react-native-firebase/perf

# Or Flipper for development
npm install react-native-flipper
```

## 🔒 Security Considerations

### API Keys and Secrets

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use platform-specific secret management
   - Rotate keys regularly

2. **Supabase Security:**
   - Enable RLS (Row Level Security)
   - Configure proper authentication policies
   - Set up database backups

3. **OpenAI API Security:**
   - Implement rate limiting
   - Monitor usage and costs
   - Use server-side proxy for sensitive operations

### Code Security

1. **Code Obfuscation:**
   ```bash
   # Enable for production builds
   eas build --platform ios --profile production
   ```

2. **Certificate Pinning:**
   - Pin SSL certificates for API endpoints
   - Implement certificate validation

## 📊 Performance Optimization

### Bundle Optimization

```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Enable Hermes (Android)
# In android/app/build.gradle
enableHermes: true
```

### Image Optimization

```bash
# Optimize images
npm install imagemin imagemin-pngquant imagemin-mozjpeg

# Use WebP format where possible
```

### Caching Strategy

1. **API Response Caching:**
   - Implement cache-first strategy
   - Use appropriate cache headers
   - Clear cache on app updates

2. **Asset Caching:**
   - Enable asset caching in Expo
   - Use CDN for static assets

## 🚨 Rollback Strategy

### Quick Rollback Options

1. **OTA Updates (Expo):**
   ```bash
   # Publish previous version
   expo publish --release-channel production-v1.0.0
   ```

2. **App Store Rollback:**
   - Use previous version in App Store Connect
   - Prepare rollback communication

3. **Database Rollback:**
   - Maintain database backups
   - Test rollback procedures regularly

## 📋 Pre-Launch Checklist

### Technical Checks
- [ ] All environment variables configured
- [ ] Database schema deployed and tested
- [ ] SSL certificates valid
- [ ] Error tracking configured
- [ ] Analytics implemented
- [ ] Performance monitoring active
- [ ] Push notifications working
- [ ] Deep links functional

### Business Checks
- [ ] App store metadata complete
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Support documentation ready
- [ ] Customer support system active
- [ ] Pricing/subscription model configured

### Quality Assurance
- [ ] All features tested on production environment
- [ ] Cross-platform compatibility verified
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility compliance verified
- [ ] User acceptance testing passed

## 🎯 Post-Launch Monitoring

### Key Metrics to Track

1. **Technical Metrics:**
   - App crash rate (< 1%)
   - API response times (< 2s average)
   - App startup time (< 3s)
   - Memory usage
   - Battery consumption

2. **Business Metrics:**
   - Daily/Monthly active users
   - User retention rates
   - Feature adoption rates
   - In-app purchase conversion
   - User satisfaction scores

3. **Performance Metrics:**
   - Page load times
   - API error rates
   - Database query performance
   - Push notification delivery rates

### Incident Response

1. **Critical Issues:**
   - Have rollback plan ready
   - Monitor error rates closely
   - Prepare hotfix deployment process

2. **Communication:**
   - Status page for service updates
   - In-app messaging for user communication
   - Social media monitoring

## 🔄 Continuous Deployment

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build for production
        run: npm run build
      - name: Deploy
        run: |
          # Deploy to your hosting platform
```

### Automated Testing

```bash
# Run all tests before deployment
npm run test
npm run test:e2e
npm run test:performance
```

This deployment guide should help you successfully launch your AI Journaling App to production! 🚀