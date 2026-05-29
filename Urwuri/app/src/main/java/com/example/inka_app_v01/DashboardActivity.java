package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

public class DashboardActivity extends BaseActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Set up click listeners for quick links
        findViewById(R.id.quick_link_cattle).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, CattleListActivity.class);
            startActivity(intent);
        });

        findViewById(R.id.quick_link_milk_records).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, MilkRecordsListActivity.class);
            startActivity(intent);
        });

        findViewById(R.id.quick_link_events).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, EventsActivity.class);
            startActivity(intent);
        });

        findViewById(R.id.quick_link_transactions).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, TransactionsActivity.class);
            startActivity(intent);
        });

        findViewById(R.id.quick_link_farm_setup).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, FarmSetupActivity.class);
            startActivity(intent);
        });

        // Bottom navigation
        findViewById(R.id.nav_manage).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, ManageExpensesActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_home).setOnClickListener(v -> {
            // Already on home
        });

        findViewById(R.id.nav_explore).setOnClickListener(v -> {
            // TODO: Navigate to Explore screen
        });

        findViewById(R.id.nav_reports).setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, ReportsActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_profile).setOnClickListener(v -> {
            // TODO: Navigate to Profile screen
        });
    }
}

