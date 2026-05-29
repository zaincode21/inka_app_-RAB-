package com.example.inka_app_v01;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.EditText;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.Calendar;

public class AddMassEventActivity extends BaseActivity {

    private EditText eventDateEditText;
    private AutoCompleteTextView eventTypeSpinner;
    private EditText medicineInput;
    private EditText notesEditText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_mass_event);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        eventDateEditText = findViewById(R.id.event_date);
        eventTypeSpinner = findViewById(R.id.event_type);
        medicineInput = findViewById(R.id.medicine_input);
        notesEditText = findViewById(R.id.notes);

        // Setup date picker
        eventDateEditText.setOnClickListener(v -> showDatePicker());
        eventDateEditText.setFocusable(false);
        eventDateEditText.setClickable(true);

        // Setup event type spinner
        ArrayAdapter<String> eventTypeAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{
                getString(R.string.vaccination),
                getString(R.string.herd_spraying),
                getString(R.string.deworming),
                getString(R.string.treatment),
                getString(R.string.hoof_trimming)
            });
        eventTypeSpinner.setAdapter(eventTypeAdapter);
        eventTypeSpinner.setThreshold(0);
        eventTypeSpinner.setOnClickListener(v -> {
            eventTypeSpinner.showDropDown();
        });
        eventTypeSpinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                eventTypeSpinner.showDropDown();
            }
        });

        // Listen to event type changes to show/hide medicine input
        eventTypeSpinner.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateMedicineInputVisibility();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Save button
        findViewById(R.id.save_button).setOnClickListener(v -> {
            if (validateForm()) {
                // TODO: Save event to database
                Toast.makeText(this, "Event saved successfully!", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
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
                eventDateEditText.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }

    private void updateMedicineInputVisibility() {
        String selectedType = eventTypeSpinner.getText().toString().trim();
        String treatment = getString(R.string.treatment);
        String vaccination = getString(R.string.vaccination);
        String deworming = getString(R.string.deworming);

        if (selectedType.equals(treatment) || selectedType.equals(vaccination) || selectedType.equals(deworming)) {
            medicineInput.setVisibility(View.VISIBLE);
            
            // Update placeholder based on event type
            if (selectedType.equals(treatment)) {
                medicineInput.setHint(getString(R.string.treatment_medicine_placeholder));
            } else {
                medicineInput.setHint(getString(R.string.medicine_placeholder));
            }
            
            // Clear the input when switching types
            medicineInput.setText("");
        } else {
            medicineInput.setVisibility(View.GONE);
            medicineInput.setText("");
        }
    }

    private boolean validateForm() {
        if (eventDateEditText.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select event date", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (eventTypeSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select an event type", Toast.LENGTH_SHORT).show();
            return false;
        }
        
        // Validate medicine input if it's visible
        String selectedType = eventTypeSpinner.getText().toString().trim();
        String treatment = getString(R.string.treatment);
        String vaccination = getString(R.string.vaccination);
        String deworming = getString(R.string.deworming);
        
        if (medicineInput.getVisibility() == View.VISIBLE) {
            if (medicineInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter medicine information", Toast.LENGTH_SHORT).show();
                return false;
            }
        }
        
        return true;
    }
}

