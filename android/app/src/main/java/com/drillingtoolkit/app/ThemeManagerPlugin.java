package com.drillingtoolkit.app;

import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

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
            boolean isDark = "dark".equalsIgnoreCase(mode);
            if (isDark) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else if ("light".equalsIgnoreCase(mode)) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            }

            Window window = getActivity().getWindow();
            if (window != null) {
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
                if (controller != null) {
                    controller.setAppearanceLightNavigationBars(!isDark);
                    controller.setAppearanceLightStatusBars(!isDark);
                }
            }
            call.resolve();
        });
    }
}
