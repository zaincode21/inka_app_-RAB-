package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class FarmSetupActivity extends BaseActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_farm_setup);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Income Categories card
        findViewById(R.id.card_income_categories).setOnClickListener(v -> {
            Intent intent = new Intent(FarmSetupActivity.this, IncomeCategoriesActivity.class);
            startActivity(intent);
        });

        // Expense Categories card
        findViewById(R.id.card_expense_categories).setOnClickListener(v -> {
            Intent intent = new Intent(FarmSetupActivity.this, ExpenseCategoriesActivity.class);
            startActivity(intent);
        });

        // Cattle Breeds card
        findViewById(R.id.card_cattle_breeds).setOnClickListener(v -> {
            Intent intent = new Intent(FarmSetupActivity.this, CattleBreedsActivity.class);
            startActivity(intent);
        });

        // Cattle Groups card
        findViewById(R.id.card_cattle_groups).setOnClickListener(v -> {
            Intent intent = new Intent(FarmSetupActivity.this, CattleGroupsActivity.class);
            startActivity(intent);
        });
    }
}

