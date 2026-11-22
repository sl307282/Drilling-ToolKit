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
-keep class com.drillingtoolkit.app.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @android.webkit.JavascriptInterface public <methods>;
}
-keepattributes JavascriptInterface
-dontwarn com.getcapacitor.**

