# iOS Animation Components - Quick Reference

## 🎯 Quick Start Guide

### 1. AnimatedButton - Use Everywhere!
Replace all buttons with this for instant iOS feel:

```tsx
import { AnimatedButton } from '../components/AnimatedButton';

// Basic usage
<AnimatedButton onPress={handlePress} hapticFeedback="light">
  <Text>Tap Me</Text>
</AnimatedButton>

// With custom scale
<AnimatedButton onPress={handlePress} hapticFeedback="medium" scaleMin={0.92}>
  <Icon name="save" />
  <Text>Save</Text>
</AnimatedButton>

// Destructive action (heavy haptic)
<AnimatedButton onPress={handleDelete} hapticFeedback="heavy">
  <Text>Delete</Text>
</AnimatedButton>
```

### 2. Toast Notifications
Show success/error messages with style:

```tsx
import { Toast } from '../components/Toast';

const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

// Show toast
setToast({ visible: true, message: 'Saved successfully!', type: 'success' });

// Render
<Toast
  visible={toast.visible}
  message={toast.message}
  type={toast.type}  // 'success' | 'error' | 'info'
  onHide={() => setToast({ ...toast, visible: false })}
  duration={3000}
/>
```

### 3. AnimatedSaveButton
Perfect for save/submit actions:

```tsx
import { AnimatedSaveButton } from '../components/AnimatedSaveButton';

const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);

<AnimatedSaveButton
  onPress={handleSave}
  isSaving={isSaving}
  isSuccess={saveSuccess}
  label="Save Entry"
/>
```

### 4. BlurCard
Frosted glass effect for cards:

```tsx
import { BlurCard } from '../components/BlurCard';

<BlurCard intensity={80}>
  <View style={{ padding: 16 }}>
    <Text>Card content with blur background</Text>
  </View>
</BlurCard>
```

### 5. BlurBackground
Modal backdrops with blur:

```tsx
import { BlurBackground } from '../components/BlurBackground';

<Modal visible={modalVisible} transparent>
  <BlurBackground intensity={50} overlayOpacity={0.3}>
    <View style={styles.modalContent}>
      {/* Modal content */}
    </View>
  </BlurBackground>
</Modal>
```

### 6. Skeleton Loading
Replace spinners with elegant skeletons:

```tsx
import { SkeletonLoader, SkeletonCard } from '../components/SkeletonLoader';

// Single skeleton
<SkeletonLoader width="80%" height={20} />

// Full card skeleton
<SkeletonCard />

// Custom skeleton
<View>
  <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
  <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
  <SkeletonLoader width="60%" height={16} />
</View>
```

### 7. FadeInView
Smooth content appearance:

```tsx
import { FadeInView } from '../components/SkeletonLoader';

<FadeInView duration={300} delay={100}>
  <Text>This content fades in smoothly</Text>
</FadeInView>
```

### 8. AnimatedCounter
Smooth number transitions:

```tsx
import { AnimatedCounter } from '../components/AnimatedCounter';

<AnimatedCounter
  value={totalEntries}
  duration={800}
  suffix=" entries"
  style={styles.statNumber}
/>
```

### 9. Background Images
Add aesthetic backgrounds:

```tsx
// 1. Wrap app with provider in App.tsx
import { BackgroundProvider } from './contexts/BackgroundContext';

<BackgroundProvider>
  <YourApp />
</BackgroundProvider>

// 2. Use in screens
import { BackgroundImage } from '../components/BackgroundImage';
import { useBackground } from '../contexts/BackgroundContext';

const { backgroundImage } = useBackground();

<BackgroundImage imageUri={backgroundImage} blurIntensity={35}>
  <YourScreenContent />
</BackgroundImage>

// 3. Let users select backgrounds
import { BACKGROUND_IMAGES } from '../components/BackgroundImage';

const { setBackgroundImage } = useBackground();

await setBackgroundImage('nature1');  // or 'ocean', 'desert', 'mountains', etc.
```

### 10. PressableCard
Interactive cards with press effects:

```tsx
import { PressableCard } from '../components/PressableCard';

<PressableCard
  onPress={handleCardPress}
  hapticFeedback="light"
  scaleMin={0.98}
  style={styles.card}
>
  <Text>Card content</Text>
</PressableCard>
```

## 📋 ScrollView Best Practices

Always add these props to ScrollView/FlatList:

```tsx
<ScrollView
  bounces={true}
  alwaysBounceVertical={true}
  showsVerticalScrollIndicator={false}
  decelerationRate="fast"
  scrollEventThrottle={16}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
    />
  }
>
  {/* Content */}
</ScrollView>
```

## 🎨 Haptic Feedback Guide

| Action Type | Haptic Level | Example Use Cases |
|-------------|--------------|-------------------|
| `light` | Light tap | Navigation, selections, small interactions |
| `medium` | Medium tap | Save actions, confirmations, important taps |
| `heavy` | Strong tap | Delete actions, critical operations |
| `none` | No haptic | Background elements, passive interactions |

## ⚡ Performance Tips

1. **Always use `useNativeDriver: true`** when possible (all our components do this automatically)
2. **Extract styles to StyleSheet** to prevent re-creation on each render
3. **Use FadeInView** instead of manual opacity animations
4. **Memoize animated values** with useRef

## 🚀 Quick Win: Update Existing Button

**Before:**
```tsx
<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
  <Text>Press Me</Text>
</TouchableOpacity>
```

**After:**
```tsx
<AnimatedButton onPress={handlePress} hapticFeedback="light">
  <Text>Press Me</Text>
</AnimatedButton>
```

That's it! Instant iOS feel with spring animations and haptics!

## 📱 Platform Differences

- **Haptics**: Only work on iOS by default (automatically disabled on Android)
- **Animations**: Work identically on both platforms
- **Blur**: Works on both platforms but may look slightly different

## 🎯 Common Patterns

### Success Flow with Feedback
```tsx
const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveData();
    setSaveSuccess(true);
    setToast({ visible: true, message: 'Saved!', type: 'success' });
  } catch (error) {
    setToast({ visible: true, message: 'Error saving', type: 'error' });
  } finally {
    setIsSaving(false);
  }
};
```

### Loading → Content Transition
```tsx
{isLoading ? (
  <SkeletonCard />
) : (
  <FadeInView duration={300}>
    <YourContent />
  </FadeInView>
)}
```

### Modal with Blur
```tsx
<Modal visible={visible} transparent animationType="fade">
  <BlurBackground>
    <AnimatedButton
      style={styles.modalBackdrop}
      onPress={onClose}
      hapticFeedback="none"
    >
      <View style={styles.modalCard}>
        {/* Modal content */}
      </View>
    </AnimatedButton>
  </BlurBackground>
</Modal>
```

---

**Need help?** Check the full implementation details in `IMPLEMENTATION_SUMMARY.md`
