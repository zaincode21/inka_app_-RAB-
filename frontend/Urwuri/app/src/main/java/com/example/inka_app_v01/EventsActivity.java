package com.example.inka_app_v01;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.PorterDuff;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class EventsActivity extends BaseActivity {

    private LinearLayout individualButton;
    private LinearLayout massButton;
    private ImageView individualIcon;
    private ImageView massIcon;
    private TextView individualText;
    private TextView massText;
    private boolean isIndividualSelected = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_events);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        individualButton = findViewById(R.id.individual_button);
        massButton = findViewById(R.id.mass_button);
        individualIcon = findViewById(R.id.individual_icon);
        massIcon = findViewById(R.id.mass_icon);
        individualText = findViewById(R.id.individual_text);
        massText = findViewById(R.id.mass_text);

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Search button
        findViewById(R.id.search_button).setOnClickListener(v -> {
            // TODO: Implement search functionality
        });

        // Filter button
        findViewById(R.id.filter_button).setOnClickListener(v -> {
            // TODO: Implement filter functionality
        });

        // More button
        findViewById(R.id.more_button).setOnClickListener(v -> {
            // TODO: Implement more options menu
        });

        // Event type selector
        individualButton.setOnClickListener(v -> {
            if (!isIndividualSelected) {
                isIndividualSelected = true;
                updateEventTypeSelector();
            }
        });

        massButton.setOnClickListener(v -> {
            if (isIndividualSelected) {
                isIndividualSelected = false;
                updateEventTypeSelector();
            }
        });

        // Add Event button
        findViewById(R.id.add_event_button).setOnClickListener(v -> {
            if (isIndividualSelected) {
                // Show cattle selection dialog for Individual events
                showSelectCattleDialog();
            } else {
                // Directly open Mass event form
                Intent intent = new Intent(EventsActivity.this, AddMassEventActivity.class);
                startActivity(intent);
            }
        });

        // Bottom navigation
        findViewById(R.id.nav_home).setOnClickListener(v -> {
            Intent intent = new Intent(EventsActivity.this, DashboardActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_manage).setOnClickListener(v -> {
            Intent intent = new Intent(EventsActivity.this, ManageExpensesActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_explore).setOnClickListener(v -> {
            // TODO: Navigate to Explore screen
        });

        findViewById(R.id.nav_reports).setOnClickListener(v -> {
            Intent intent = new Intent(EventsActivity.this, ReportsActivity.class);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.nav_profile).setOnClickListener(v -> {
            // TODO: Navigate to Profile screen
        });
    }

    private void updateEventTypeSelector() {
        if (isIndividualSelected) {
            // Individual selected
            individualButton.setBackgroundResource(R.drawable.event_type_selected);
            individualIcon.setColorFilter(ContextCompat.getColor(this, android.R.color.white), PorterDuff.Mode.SRC_IN);
            individualText.setTextColor(ContextCompat.getColor(this, android.R.color.white));
            
            massButton.setBackgroundResource(R.drawable.event_type_unselected);
            massIcon.setColorFilter(ContextCompat.getColor(this, R.color.teal_primary), PorterDuff.Mode.SRC_IN);
            massText.setTextColor(ContextCompat.getColor(this, R.color.teal_primary));
        } else {
            // Mass selected
            individualButton.setBackgroundResource(R.drawable.event_type_unselected);
            individualIcon.setColorFilter(ContextCompat.getColor(this, R.color.teal_primary), PorterDuff.Mode.SRC_IN);
            individualText.setTextColor(ContextCompat.getColor(this, R.color.teal_primary));
            
            massButton.setBackgroundResource(R.drawable.event_type_selected);
            massIcon.setColorFilter(ContextCompat.getColor(this, android.R.color.white), PorterDuff.Mode.SRC_IN);
            massText.setTextColor(ContextCompat.getColor(this, android.R.color.white));
        }
    }

    private void showSelectCattleDialog() {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_select_cattle);
        
        // Set transparent background with rounded corners
        Window window = dialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        }

        AutoCompleteTextView cattleSelect = dialog.findViewById(R.id.cattle_select);
        Button cancelButton = dialog.findViewById(R.id.cancel_button);
        Button nextButton = dialog.findViewById(R.id.next_button);

        // Setup cattle dropdown
        ArrayAdapter<String> cattleAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{"Bella (C001)", "Max (C002)", "Luna (C003)", "Charlie (C004)", "Daisy (C005)"});
        cattleSelect.setAdapter(cattleAdapter);
        cattleSelect.setThreshold(0);
        cattleSelect.setOnClickListener(v -> {
            cattleSelect.showDropDown();
        });
        cattleSelect.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                cattleSelect.showDropDown();
            }
        });

        // Cancel button
        cancelButton.setOnClickListener(v -> {
            dialog.dismiss();
        });

        // Next button
        nextButton.setOnClickListener(v -> {
            String selectedCattle = cattleSelect.getText().toString().trim();
            if (selectedCattle.isEmpty()) {
                // TODO: Show error message
                return;
            }
            dialog.dismiss();
            // Navigate to Individual event form
            Intent intent = new Intent(EventsActivity.this, AddIndividualEventActivity.class);
            intent.putExtra("selected_cattle", selectedCattle);
            startActivity(intent);
        });

        dialog.show();
    }
}

