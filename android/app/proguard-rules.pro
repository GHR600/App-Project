# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Don't obfuscate anything
-dontobfuscate

# Don't remove any code
-dontshrink

# Keep everything
-keepattributes *
-keep class ** { *; }
-keepclassmembers class * {
    *;
}

# Keep all native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep source file and line numbers
-keepattributes SourceFile,LineNumberTable

# Suppress warnings
-dontwarn **
-ignorewarnings