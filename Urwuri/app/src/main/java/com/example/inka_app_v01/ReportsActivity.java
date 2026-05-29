package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class ReportsActivity extends BaseActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reports);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Report category click listeners
        findViewById(R.id.report_transactions).setOnClickListener(v -> {
            // TODO: Navigate to Transactions Report
        });

        findViewById(R.id.report_milk).setOnClickListener(v -> {
            // TODO: Navigate to Milk Report
        });

        findViewById(R.id.report_cattle).setOnClickListener(v -> {
            // TODO: Navigate to Cattle Report
        });

        findViewById(R.id.report_events).setOnClickListener(v -> {
            // TODO: Navigate to Events Report
        });

        findViewById(R.id.report_breeding).setOnClickListener(v -> {
            // TODO: Navigate to Breeding Report
        });

        findViewById(R.id.report_pregnancies).setOnClickListener(v -> {
            // TODO: Navigate to Pregnancies Report
        });

        findViewById(R.id.report_weight).setOnClickListener(v -> {
            // TODO: Navigate to Weight Report
        });

        findViewById(R.id.report_stage_tracking).setOnClickListener(v -> {
            // TODO: Navigate to Stage Tracking Report
        });

        // Bottom navigation
        findViewById(R.id.nav_home).setOnClickListener(v -> {
            Intent intent = new Intent(ReportsActivity.this, DashboardActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_manage).setOnClickListener(v -> {
            Intent intent = new Intent(ReportsActivity.this, ManageExpensesActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_explore).setOnClickListener(v -> {
            // TODO: Navigate to Explore screen
        });

        findViewById(R.id.nav_reports).setOnClickListener(v -> {
            // Already on reports screen
        });

        findViewById(R.id.nav_profile).setOnClickListener(v -> {
            // TODO: Navigate to Profile screen
        });
    }
}

