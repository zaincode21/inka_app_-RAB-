package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class TransactionsActivity extends BaseActivity {

    private LinearLayout incomeButton;
    private LinearLayout expenseButton;
    private TextView headerTitle;
    private TextView incomeText;
    private TextView expenseText;
    private ImageView incomeIcon;
    private ImageView expenseIcon;
    private TextView fabText;
    private boolean isIncomeSelected = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_transactions);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        incomeButton = findViewById(R.id.income_button);
        expenseButton = findViewById(R.id.expense_button);
        headerTitle = findViewById(R.id.header_title);
        incomeText = findViewById(R.id.income_text);
        expenseText = findViewById(R.id.expense_text);
        incomeIcon = findViewById(R.id.income_icon);
        expenseIcon = findViewById(R.id.expense_icon);
        fabText = findViewById(R.id.fab_text);

        // Set initial state (Income selected)
        updateToggleButtons();

        // Income button click
        incomeButton.setOnClickListener(v -> {
            if (!isIncomeSelected) {
                isIncomeSelected = true;
                updateToggleButtons();
                updateHeaderTitle();
                updateEmptyStateMessage();
            }
        });

        // Expense button click
        expenseButton.setOnClickListener(v -> {
            if (isIncomeSelected) {
                isIncomeSelected = false;
                updateToggleButtons();
                updateHeaderTitle();
                updateEmptyStateMessage();
            }
        });

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Search button
        findViewById(R.id.search_button).setOnClickListener(v -> {
            // TODO: Implement search functionality
        });

        // Menu button
        findViewById(R.id.menu_button).setOnClickListener(v -> {
            // TODO: Implement menu functionality
        });

        // More button
        findViewById(R.id.more_button).setOnClickListener(v -> {
            // TODO: Implement more options
        });

        // FAB click
        findViewById(R.id.fab_add_expense).setOnClickListener(v -> {
            if (isIncomeSelected) {
                Intent intent = new Intent(TransactionsActivity.this, AddIncomeActivity.class);
                startActivity(intent);
            } else {
                Intent intent = new Intent(TransactionsActivity.this, AddExpenseActivity.class);
                startActivity(intent);
            }
        });
    }

    private void updateToggleButtons() {
        if (isIncomeSelected) {
            incomeButton.setBackgroundResource(R.drawable.event_type_selected);
            expenseButton.setBackgroundResource(R.drawable.event_type_unselected);
            // Update text colors
            incomeText.setTextColor(getResources().getColor(android.R.color.white, null));
            expenseText.setTextColor(0xFF008B8B);
            // Update icon colors
            incomeIcon.setColorFilter(getResources().getColor(android.R.color.white, null));
            expenseIcon.setColorFilter(0xFF008B8B);
        } else {
            incomeButton.setBackgroundResource(R.drawable.event_type_unselected);
            expenseButton.setBackgroundResource(R.drawable.event_type_selected);
            // Update text colors
            incomeText.setTextColor(0xFF008B8B);
            expenseText.setTextColor(getResources().getColor(android.R.color.white, null));
            // Update icon colors
            incomeIcon.setColorFilter(0xFF008B8B);
            expenseIcon.setColorFilter(getResources().getColor(android.R.color.white, null));
        }
    }

    private void updateHeaderTitle() {
        if (headerTitle != null) {
            headerTitle.setText(isIncomeSelected ? getString(R.string.income) : getString(R.string.expense));
        }
    }

    private void updateEmptyStateMessage() {
        TextView emptyState = findViewById(R.id.empty_state_message);
        if (emptyState != null) {
            if (isIncomeSelected) {
                emptyState.setText(getString(R.string.no_income_records_message));
            } else {
                emptyState.setText(getString(R.string.no_expense_records_message));
            }
        }
        // Update FAB text
        if (fabText != null) {
            fabText.setText(isIncomeSelected ? getString(R.string.income) : getString(R.string.expense));
        }
    }
}

