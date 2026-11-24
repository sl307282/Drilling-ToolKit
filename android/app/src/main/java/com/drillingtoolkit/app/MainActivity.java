package com.drillingtoolkit.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;
import android.widget.FrameLayout;

import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static volatile boolean isAppReady = false;

    private static MainActivity instance;
    private View overlayView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;
        isAppReady = false;

        // 1. Install Android core splash screen BEFORE super.onCreate()
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep system splash visible until the app is fully loaded
        splashScreen.setKeepOnScreenCondition(() -> !isAppReady);

        // Smoothly fade out the native splash screen directly into the home screen
        splashScreen.setOnExitAnimationListener(splashViewProvider -> {
            View splashView = splashViewProvider.getView();
            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(splashView, View.ALPHA, 1f, 0f);
            fadeOut.setDuration(200);
            fadeOut.setInterpolator(new LinearInterpolator());
            fadeOut.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    splashViewProvider.remove();
                }
            });
            fadeOut.start();
        });

        registerPlugin(ThemeManagerPlugin.class);

        super.onCreate(savedInstanceState);

        // 2. Enable modern Edge-to-Edge support for Android 15 (API 35+) and backward-compatible inset handling
        EdgeToEdge.enable(this);

        // Sizing & display cutout handling: ensure splash and window layout do not jump on notched displays
        Window window = getWindow();
        if (window != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = window.getAttributes();
                lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(lp);
            }

            // On Android versions prior to API 35 (Android 15), set system bar colors to match splash
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                int splashColor = Color.parseColor("#FFFFFF");
                window.setNavigationBarColor(splashColor);
                window.setStatusBarColor(splashColor);
            }
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.setAppearanceLightNavigationBars(true);
                controller.setAppearanceLightStatusBars(true);
            }
        }

        // On Android 11 and below (API < 31), attach native overlay view as fallback
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            ViewGroup root = findViewById(android.R.id.content);
            if (root != null) {
                overlayView = getLayoutInflater().inflate(R.layout.native_splash_overlay, root, false);
                root.addView(overlayView);
            }
        }

        // Neutralize underlying window background so no ghost logo or tagline remains underneath overlay during fadeout
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.parseColor("#FFFFFF")));
        }

        // Register CustomSplashScreenPlugin on bridge to forward SplashScreen.hide() to MainActivity
        if (this.bridge != null) {
            this.bridge.registerPlugin(CustomSplashScreenPlugin.class);
            if (this.bridge.getWebView() != null) {
                this.bridge.getWebView().setBackgroundColor(Color.parseColor("#FFFFFF"));
                this.bridge.getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
            }
        }

        // Failsafe timer: dismiss overlay after 2s max if web bootstrap encounters an unexpected error
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (!isAppReady) {
                android.util.Log.i("MainActivity", "Failsafe timer (2s) expired, setting isAppReady = true");
                setAppReady();
            }
        }, 2000);
    }

    public static void setAppReady() {
        if (isAppReady) return;
        android.util.Log.i("MainActivity", "setAppReady() invoked!");
        isAppReady = true;
        if (instance != null) {
            instance.runOnUiThread(() -> instance.dismissOverlay());
        }
    }

    private void dismissOverlay() {
        if (overlayView == null || !overlayView.isAttachedToWindow()) return;
        android.util.Log.i("MainActivity", "dismissOverlay() animating fadeout (200ms)");
        ObjectAnimator fadeOut = ObjectAnimator.ofFloat(overlayView, View.ALPHA, 1f, 0f);
        fadeOut.setDuration(200);
        fadeOut.setInterpolator(new LinearInterpolator());
        fadeOut.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                if (overlayView != null) {
                    ViewGroup parent = (ViewGroup) overlayView.getParent();
                    if (parent != null) {
                        parent.removeView(overlayView);
                    }
                    overlayView = null;
                }
            }
        });
        fadeOut.start();
    }
}
