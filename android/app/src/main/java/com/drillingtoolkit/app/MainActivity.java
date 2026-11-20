package com.drillingtoolkit.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static volatile boolean isAppReady = false;

    private static MainActivity instance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;
        isAppReady = false;

        // Install Android core splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep native launch splash visible until the web app has rendered its first frame
        splashScreen.setKeepOnScreenCondition(() -> !isAppReady);

        // Smooth exit animation: dissolve native splash directly into the home screen
        splashScreen.setOnExitAnimationListener(splashViewProvider -> {
            android.util.Log.i("MainActivity", "splashScreen onExitAnimationListener fired!");
            View splashView = splashViewProvider.getView();
            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(splashView, View.ALPHA, 1f, 0f);
            fadeOut.setDuration(250);
            fadeOut.setInterpolator(new LinearInterpolator());
            fadeOut.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    android.util.Log.i("MainActivity", "splashViewProvider.remove() called");
                    splashViewProvider.remove();
                }
            });
            fadeOut.start();
        });

        registerPlugin(ThemeManagerPlugin.class);

        super.onCreate(savedInstanceState);

        // Register CustomSplashScreenPlugin on bridge to take precedence over default plugin
        if (this.bridge != null) {
            this.bridge.registerPlugin(CustomSplashScreenPlugin.class);
            if (this.bridge.getWebView() != null) {
                this.bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            }
        }

        // Failsafe timer: dismiss splash after 4s max if web bootstrap encounters an error
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (!isAppReady) {
                android.util.Log.i("MainActivity", "Failsafe timer expired, setting isAppReady = true");
                setAppReady();
            }
        }, 4000);
    }

    public static void setAppReady() {
        android.util.Log.i("MainActivity", "setAppReady() invoked!");
        isAppReady = true;
        if (instance != null) {
            instance.runOnUiThread(() -> {
                View content = instance.findViewById(android.R.id.content);
                if (content != null) {
                    content.invalidate();
                }
            });
        }
    }
}
