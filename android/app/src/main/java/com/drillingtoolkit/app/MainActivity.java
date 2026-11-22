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

import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static volatile boolean isAppReady = false;
    private static volatile boolean isOverlayReady = false;

    private static MainActivity instance;
    private View overlayView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;
        isAppReady = false;
        isOverlayReady = false;

        // Install Android core splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep system splash visible until the native overlay has completed pre-draw
        splashScreen.setKeepOnScreenCondition(() -> !isOverlayReady);

        // Immediately dismiss system splash with 0 exit animation duration once overlay is ready
        splashScreen.setOnExitAnimationListener(splashViewProvider -> splashViewProvider.remove());

        registerPlugin(ThemeManagerPlugin.class);

        super.onCreate(savedInstanceState);

        // Sizing & display cutout handling: ensure splash and window layout do not jump on notched displays
        Window window = getWindow();
        if (window != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = window.getAttributes();
                lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(lp);
            }

            // Force solid white system bars matching the splash background across light and dark system themes
            int splashColor = Color.parseColor("#FFFFFF");
            window.setNavigationBarColor(splashColor);
            window.setStatusBarColor(splashColor);
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.setAppearanceLightNavigationBars(true);
                controller.setAppearanceLightStatusBars(true);
            }
        }

        // Attach full-screen native overlay view on frame 1 (identical across API 24-36)
        ViewGroup root = findViewById(android.R.id.content);
        if (root != null) {
            overlayView = getLayoutInflater().inflate(R.layout.native_splash_overlay, root, false);
            root.addView(overlayView);

            final View taglineView = overlayView.findViewById(R.id.splash_tagline_view);

            // On Android 12+ (API 31+), the system splash displayed only the badge.
            // Prepare tagline with alpha 0 so it fades in smoothly once the overlay is visible.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && taglineView != null) {
                taglineView.setAlpha(0f);
            }

            // Anchor tagline above navigation bar inset across all screen sizes and orientations
            ViewCompat.setOnApplyWindowInsetsListener(overlayView, (v, insets) -> {
                Insets navInsets = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                if (taglineView != null) {
                    FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) taglineView.getLayoutParams();
                    int baseMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 48, getResources().getDisplayMetrics());
                    lp.bottomMargin = baseMargin + navInsets.bottom;
                    taglineView.setLayoutParams(lp);
                }
                return insets;
            });

            // Wait until overlayView is fully measured, laid out, and about to draw its first frame
            overlayView.getViewTreeObserver().addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {
                @Override
                public boolean onPreDraw() {
                    if (overlayView != null) {
                        overlayView.getViewTreeObserver().removeOnPreDrawListener(this);
                    }
                    isOverlayReady = true;

                    // Smoothly fade in tagline over 120ms on Android 12+
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && taglineView != null) {
                        taglineView.animate()
                            .alpha(1f)
                            .setDuration(120)
                            .setInterpolator(new LinearInterpolator())
                            .start();
                    }
                    return true;
                }
            });
        }

        // Failsafe timer: guarantee isOverlayReady within 200ms
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            isOverlayReady = true;
        }, 200);

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
