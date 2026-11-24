# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Capacitor ProGuard Rules
-keep public class * extends com.getcapacitor.Plugin {
    public *;
}
-keep public class com.getcapacitor.** { *; }
# Keep entry points (Activity and Plugins), allow R8 to optimize and obfuscate all other classes
-keep public class com.drillingtoolkit.app.MainActivity { public *; }
-keep public class com.drillingtoolkit.app.ThemeManagerPlugin { public *; }
-keep public class com.drillingtoolkit.app.CustomSplashScreenPlugin { public *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @android.webkit.JavascriptInterface public <methods>;
}
-keepattributes JavascriptInterface
-dontwarn com.getcapacitor.**

