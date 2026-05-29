package com.example.inka_app_v01;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import java.util.Calendar;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class NewMilkRecordActivity extends AppCompatActivity {

    private EditText milkingDateEditText;
    private AutoCompleteTextView milkTypeSpinner;
    private EditText amTotalEditText;
    private EditText noonTotalEditText;
    private EditText pmTotalEditText;
    private EditText totalProducedEditText;
    private EditText totalUsedEditText;
    private EditText notesEditText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_new_milk_record);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        milkingDateEditText = findViewById(R.id.milking_date);
        milkTypeSpinner = findViewById(R.id.milk_type_spinner);
        amTotalEditText = findViewById(R.id.am_total);
        noonTotalEditText = findViewById(R.id.noon_total);
        pmTotalEditText = findViewById(R.id.pm_total);
        totalProducedEditText = findViewById(R.id.total_produced);
        totalUsedEditText = findViewById(R.id.total_used);
        notesEditText = findViewById(R.id.notes);

        // Setup milk type spinner
        ArrayAdapter<String> milkTypeAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{"Whole Farm", "Individual Cow Milk"});
        milkTypeSpinner.setAdapter(milkTypeAdapter);
        milkTypeSpinner.setThreshold(0); // Show dropdown immediately on click
        milkTypeSpinner.setOnClickListener(v -> {
            milkTypeSpinner.showDropDown();
        });
        milkTypeSpinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                milkTypeSpinner.showDropDown();
            }
        });

        // Setup date picker for milking date
        milkingDateEditText.setFocusable(false);
        milkingDateEditText.setClickable(true);
        milkingDateEditText.setOnClickListener(v -> showDatePicker());

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Save button
        Button saveButton = findViewById(R.id.save_button);
        saveButton.setOnClickListener(v -> {
            if (validateForm()) {
                // TODO: Save milk record to database/API
                Toast.makeText(this, "Milk record saved successfully!", Toast.LENGTH_SHORT).show();
                finish();
            }
        });

        // Cancel button
        Button cancelButton = findViewById(R.id.cancel_button);
        cancelButton.setOnClickListener(v -> {
            finish();
        });

        // Calculate total when AM, Noon, or PM values change
        amTotalEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus) calculateTotal();
        });
        noonTotalEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus) calculateTotal();
        });
        pmTotalEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus) calculateTotal();
        });
    }

    private void calculateTotal() {
        try {
            double am = parseDouble(amTotalEditText.getText().toString());
            double noon = parseDouble(noonTotalEditText.getText().toString());
            double pm = parseDouble(pmTotalEditText.getText().toString());
            double total = am + noon + pm;
            totalProducedEditText.setText(String.format("%.1f", total));
        } catch (Exception e) {
            // Ignore calculation errors
        }
    }

    private double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private boolean validateForm() {
        if (milkingDateEditText.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select milking date", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (milkTypeSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select milk type", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (amTotalEditText.getText().toString().trim().isEmpty() &&
            noonTotalEditText.getText().toString().trim().isEmpty() &&
            pmTotalEditText.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please enter at least one milk total", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }

    private void showDatePicker() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
            this,
            (view, selectedYear, selectedMonth, selectedDay) -> {
                String date = String.format("%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay);
                milkingDateEditText.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }
}

