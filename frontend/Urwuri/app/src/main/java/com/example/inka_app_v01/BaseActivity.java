package com.example.inka_app_v01;

import android.os.Bundle;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class BaseActivity extends AppCompatActivity {

    protected boolean shouldHideStatusBar = false; // Show status bar by default on all activities

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        
        // Set status bar color to teal (#008B8B) for all activities
        getWindow().setStatusBarColor(getResources().getColor(R.color.teal_primary, null));
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (shouldHideStatusBar) {
            hideStatusBar();
        } else {
            // Ensure status bar is visible and colored
            showStatusBar();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            if (shouldHideStatusBar) {
                hideStatusBar();
            } else {
                // Ensure status bar is visible and colored
                showStatusBar();
            }
        }
    }

    protected void hideStatusBar() {
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
    }

    protected void showStatusBar() {
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_VISIBLE;
        decorView.setSystemUiVisibility(uiOptions);
        // Ensure status bar color is set
        getWindow().setStatusBarColor(getResources().getColor(R.color.teal_primary, null));
    }

    protected void setupWindowInsets(int mainLayoutId) {
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(mainLayoutId), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }
}

