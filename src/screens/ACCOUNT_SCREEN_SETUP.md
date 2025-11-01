# Account Screen Setup Guide

This guide explains how to set up the Account Screen with all its features.

## Features Implemented

### 1. Profile Section
- Display email address
- Show join date (member since)
- Editable display name
- Profile picture upload (requires additional setup)

### 2. Subscription Status Section
- Current plan badge (Free/Premium)
- Usage progress bar showing AI insights used (for free users)
- Manage/Upgrade subscription button

### 3. Account Actions Section
- Change password modal
- Sign out with confirmation
- Delete account with double confirmation

### 4. Additional Features
- Loading states while fetching data
- Error states with retry functionality
- Dark theme integration
- Responsive design

## Database Setup

### Step 1: Add Profile Fields to Database

Run the migration script to add the required columns to the `users` table:

```bash
# In your Supabase SQL Editor, run:
scripts/add-profile-fields-migration.sql
```

This adds:
- `display_name` (TEXT) - User's display name
- `profile_picture_url` (TEXT) - URL to profile picture in storage

### Step 2: Set Up Storage Bucket (Optional - for profile pictures)

To enable profile picture uploads, create a storage bucket in Supabase:

1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `avatars`
3. Set the bucket to **public** (so profile pictures are accessible)
4. Add the following RLS policy for the bucket:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND auth.uid()::text = (storage.filename(name))::text
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Step 3: Install Image Picker (Optional - for profile pictures)

To enable profile picture selection from the device:

```bash
npx expo install expo-image-picker
```

Then update `accountService.ts` to use the image picker properly. The current implementation shows a placeholder message.

## Usage

### In Your Navigation

```typescript
import { AccountScreen } from './src/screens/AccountScreen';

// In your navigation setup
<Stack.Screen
  name="Account"
  component={AccountScreen}
  options={{
    title: 'Account',
    // ... other options
  }}
/>
```

### With Props

```typescript
<AccountScreen
  onMenuPress={() => navigation.toggleDrawer()}
  onManageSubscription={() => navigation.navigate('Subscription')}
/>
```

## API Methods Used

The Account Screen uses the following services:

### AccountService (src/services/accountService.ts)
- `getUserProfile()` - Fetch user profile data
- `getUsageStats()` - Get API usage statistics
- `updateDisplayName(name)` - Update display name
- `updatePassword(password)` - Change password
- `uploadProfilePicture(uri)` - Upload profile picture (requires image picker)
- `deleteAccount()` - Permanently delete user account

### AuthContext
- `user` - Current user data
- `signOut()` - Sign out user

### SubscriptionContext
- `status` - Current subscription status ('free' | 'premium')
- `isPremium` - Boolean indicating premium status
- `isLoading` - Loading state

## Delete Account Functionality

The delete account feature requires a database function. Add this to your Supabase SQL Editor:

```sql
-- Function to delete user (called from app)
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

**Note:** This is a destructive operation. The CASCADE delete should handle cleaning up related data in:
- journal_entries
- ai_insights
- user_preferences

Make sure your foreign key constraints have `ON DELETE CASCADE` set up properly.

## Styling

The Account Screen uses the existing design system:
- Theme tokens from `ThemeContext`
- Spacing from `designSystem.ts`
- Border radius from `designSystem.ts`
- Automatically adapts to light/dark mode

## Testing Checklist

- [ ] Profile data loads correctly
- [ ] Display name can be edited and saved
- [ ] Email and join date display properly
- [ ] Subscription status shows correct plan
- [ ] Usage progress bar shows accurate data (free users)
- [ ] Change password modal works
- [ ] Sign out confirmation works
- [ ] Delete account double-confirmation works
- [ ] Loading states display
- [ ] Error states display with retry option
- [ ] Dark/light theme switches properly

## Known Limitations

1. **Profile Picture Upload**: Requires `expo-image-picker` installation and implementation
2. **Delete Account**: Requires database function setup
3. **Storage Bucket**: Profile pictures require Supabase storage bucket setup

## Future Enhancements

- Add profile picture cropping
- Add email change functionality
- Add two-factor authentication settings
- Add privacy settings
- Add notification preferences
- Add data export functionality
