package com.drillingtoolkit.app;

import androidx.appcompat.app.AppCompatDelegate;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ThemeManagerPlugin")
public class ThemeManagerPlugin extends Plugin {

    @PluginMethod
    public void setNightMode(PluginCall call) {
        String mode = call.getString("mode");
        
        getActivity().runOnUiThread(() -> {
            if ("dark".equals(mode)) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else if ("light".equals(mode)) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            }
            call.resolve();
        });
    }
}
