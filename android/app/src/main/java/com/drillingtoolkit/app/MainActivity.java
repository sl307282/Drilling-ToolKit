package com.drillingtoolkit.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the Android 12+ SplashScreen API handler
        androidx.core.splashscreen.SplashScreen.installSplashScreen(this);

        registerPlugin(ThemeManagerPlugin.class);
        
        super.onCreate(savedInstanceState);

        // Make WebView background transparent to prevent white flash during bootstrap
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(android.graphics.Color.TRANSPARENT);
        }
    }
}
