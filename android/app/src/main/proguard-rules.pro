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