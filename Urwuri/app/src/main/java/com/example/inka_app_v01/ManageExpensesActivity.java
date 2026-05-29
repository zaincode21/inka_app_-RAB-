package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ManageExpensesActivity extends BaseActivity {

    private RecyclerView transactionsRecyclerView;
    private TransactionAdapter transactionAdapter;
    private List<Transaction> transactionList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_manage_expenses);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize transaction list
        transactionList = new ArrayList<>();
        // TODO: Load actual data from database/API
        // Sample data
        transactionList.add(new Transaction("Medication Purchase", "June 28, 2024", 215.50, false, R.drawable.ic_transactions));
        transactionList.add(new Transaction("Cattle Sale (3 head)", "June 25, 2024", 7500.00, true, R.drawable.ic_transactions));
        transactionList.add(new Transaction("Labor: Fence Repair", "June 22, 2024", 450.00, false, R.drawable.ic_transactions));
        transactionList.add(new Transaction("Milk Output Sale", "June 21, 2024", 4300.00, true, R.drawable.ic_transactions));

        // Setup RecyclerView
        transactionsRecyclerView = findViewById(R.id.transactions_recycler_view);
        transactionAdapter = new TransactionAdapter(transactionList);
        transactionsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        transactionsRecyclerView.setAdapter(transactionAdapter);

        // View All click
        findViewById(R.id.view_all).setOnClickListener(v -> {
            // TODO: Navigate to full transactions list
        });

        // Bottom navigation
        findViewById(R.id.nav_home).setOnClickListener(v -> {
            Intent intent = new Intent(ManageExpensesActivity.this, DashboardActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_manage).setOnClickListener(v -> {
            // Already on manage screen
        });

        findViewById(R.id.nav_explore).setOnClickListener(v -> {
            // TODO: Navigate to Explore screen
        });

        findViewById(R.id.nav_reports).setOnClickListener(v -> {
            Intent intent = new Intent(ManageExpensesActivity.this, ReportsActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_profile).setOnClickListener(v -> {
            // TODO: Navigate to Profile screen
        });
    }
}

