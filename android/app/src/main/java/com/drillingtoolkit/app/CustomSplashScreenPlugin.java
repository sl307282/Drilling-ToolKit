package com.drillingtoolkit.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SplashScreen")
public class CustomSplashScreenPlugin extends Plugin {

    @PluginMethod
    public void show(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        android.util.Log.i("CustomSplashScreen", "CustomSplashScreenPlugin.hide() called!");
        MainActivity.setAppReady();
        call.resolve();
    }
}
