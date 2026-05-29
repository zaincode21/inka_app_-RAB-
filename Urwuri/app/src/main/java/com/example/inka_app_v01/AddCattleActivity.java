package com.example.inka_app_v01;

import android.app.DatePickerDialog;
import android.app.Dialog;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.Window;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class AddCattleActivity extends BaseActivity {

    private EditText tagNumberEditText;
    private EditText nameEditText;
    private EditText weightEditText;
    private EditText dateOfBirthEditText;
    private EditText farmEntryDateEditText;
    private EditText notesEditText;
    private EditText otherSourceInput;
    private AutoCompleteTextView breedSpinner;
    private AutoCompleteTextView groupSpinner;
    private AutoCompleteTextView obtainedSpinner;
    private AutoCompleteTextView motherTagSpinner;
    private AutoCompleteTextView fatherTagSpinner;
    
    private List<String> breedList;
    private ArrayAdapter<String> breedAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_cattle);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        tagNumberEditText = findViewById(R.id.tag_number);
        nameEditText = findViewById(R.id.cattle_name);
        weightEditText = findViewById(R.id.weight);
        dateOfBirthEditText = findViewById(R.id.date_of_birth);
        farmEntryDateEditText = findViewById(R.id.farm_entry_date);
        notesEditText = findViewById(R.id.notes);
        otherSourceInput = findViewById(R.id.other_source_input);
        breedSpinner = findViewById(R.id.breed_spinner);
        groupSpinner = findViewById(R.id.group_spinner);
        obtainedSpinner = findViewById(R.id.obtained_spinner);
        motherTagSpinner = findViewById(R.id.mother_tag_spinner);
        fatherTagSpinner = findViewById(R.id.father_tag_spinner);
        
        // Gender and Cattle Stage spinners
        AutoCompleteTextView genderSpinner = findViewById(R.id.gender_spinner);
        AutoCompleteTextView cattleStageSpinner = findViewById(R.id.cattle_stage_spinner);

        // Setup breed spinner with default breeds and "Create New Breed" option
        breedList = new ArrayList<>(Arrays.asList(
            "Ayrshire",
            "Friesian",
            "Guernsey",
            "Jersey",
            getString(R.string.create_new_breed)
        ));
        breedAdapter = new ArrayAdapter<>(this, 
            android.R.layout.simple_dropdown_item_1line, breedList);
        breedSpinner.setAdapter(breedAdapter);
        breedSpinner.setThreshold(0);
        breedSpinner.setInputType(android.text.InputType.TYPE_NULL);
        breedSpinner.setFocusableInTouchMode(false);
        breedSpinner.setClickable(true);
        breedSpinner.setOnClickListener(v -> breedSpinner.showDropDown());
        breedSpinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                breedSpinner.showDropDown();
            }
        });
        
        // Listen for breed selection, especially "Create New Breed"
        breedSpinner.setOnItemClickListener((parent, view, position, id) -> {
            String selected = breedList.get(position);
            if (selected.equals(getString(R.string.create_new_breed))) {
                // Clear the selection temporarily
                breedSpinner.setText("", false);
                showCreateBreedDialog();
            }
        });

        // Setup gender spinner
        setupSpinner(genderSpinner, new String[]{
            getString(R.string.male),
            getString(R.string.female)
        });
        
        // Setup cattle stage spinner
        setupSpinner(cattleStageSpinner, new String[]{
            getString(R.string.calf),
            getString(R.string.weaner),
            getString(R.string.steer),
            getString(R.string.bull)
        });
        
        // Setup how obtained spinner
        setupSpinner(obtainedSpinner, new String[]{
            getString(R.string.born_on_farm),
            getString(R.string.purchased),
            getString(R.string.other)
        });
        
        // Listen for "Other" selection to show/hide source input
        obtainedSpinner.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String selected = s.toString().trim();
                if (selected.equals(getString(R.string.other))) {
                    showOtherSourceInput();
                } else {
                    hideOtherSourceInput();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        
        // Setup group spinner
        setupSpinner(groupSpinner, new String[]{
            getString(R.string.milking_cows),
            getString(R.string.dry_cows),
            "Calves",
            "Bulls"
        });
        
        // Setup date pickers
        setupDatePickers();
        
        // Setup other spinners
        setupSpinner(motherTagSpinner, new String[]{"UK 722212 123 (Bessie)", "UK 722212 124 (Daisy)", "UK 722212 126 (Molly)"});
        setupSpinner(fatherTagSpinner, new String[]{"UK 722212 125 (Bella's Sire)", "UK 722212 199 (Max)"});

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Save button
        Button saveButton = findViewById(R.id.save_button);
        saveButton.setOnClickListener(v -> {
            if (validateForm()) {
                // TODO: Save cattle data to database/API
                Toast.makeText(this, "Cattle added successfully!", Toast.LENGTH_SHORT).show();
                Intent resultIntent = new Intent();
                setResult(RESULT_OK, resultIntent);
                finish();
            }
        });

        // Cancel button
        Button cancelButton = findViewById(R.id.cancel_button);
        cancelButton.setOnClickListener(v -> {
            finish();
        });

        // Photo upload placeholder
        findViewById(R.id.photo_placeholder).setOnClickListener(v -> {
            // TODO: Implement image picker
            Toast.makeText(this, "Photo upload - Coming soon", Toast.LENGTH_SHORT).show();
        });
    }

    private void showOtherSourceInput() {
        otherSourceInput.setVisibility(View.VISIBLE);
    }
    
    private void hideOtherSourceInput() {
        otherSourceInput.setVisibility(View.GONE);
        otherSourceInput.setText("");
    }
    
    private void setupDatePickers() {
        dateOfBirthEditText.setOnClickListener(v -> showDatePicker(dateOfBirthEditText));
        dateOfBirthEditText.setFocusable(false);
        dateOfBirthEditText.setClickable(true);
        
        farmEntryDateEditText.setOnClickListener(v -> showDatePicker(farmEntryDateEditText));
        farmEntryDateEditText.setFocusable(false);
        farmEntryDateEditText.setClickable(true);
    }
    
    private void showDatePicker(EditText editText) {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
            this,
            (view, selectedYear, selectedMonth, selectedDay) -> {
                String date = String.format(Locale.getDefault(), "%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay);
                editText.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }

    private void setupSpinner(AutoCompleteTextView spinner, String[] items) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, 
            android.R.layout.simple_dropdown_item_1line, items);
        spinner.setAdapter(adapter);
        spinner.setThreshold(0);
        spinner.setInputType(android.text.InputType.TYPE_NULL);
        spinner.setFocusableInTouchMode(false);
        spinner.setClickable(true);
        spinner.setOnClickListener(v -> spinner.showDropDown());
        spinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                spinner.showDropDown();
            }
        });
    }

    private void showCreateBreedDialog() {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_add_category);
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        
        // Set dialog width
        android.view.WindowManager.LayoutParams layoutParams = new android.view.WindowManager.LayoutParams();
        layoutParams.copyFrom(dialog.getWindow().getAttributes());
        layoutParams.width = (int) (getResources().getDisplayMetrics().widthPixels * 0.85);
        layoutParams.height = android.view.WindowManager.LayoutParams.WRAP_CONTENT;
        dialog.getWindow().setAttributes(layoutParams);

        TextView dialogTitle = dialog.findViewById(R.id.dialog_title);
        TextView inputLabel = dialog.findViewById(R.id.input_label);
        EditText breedInput = dialog.findViewById(R.id.category_input);
        Button cancelButton = dialog.findViewById(R.id.cancel_button);
        Button saveButton = dialog.findViewById(R.id.save_button);

        dialogTitle.setText(getString(R.string.add_cattle_breed));
        inputLabel.setText(getString(R.string.cattle_breed_name));
        breedInput.setHint(getString(R.string.enter_cattle_breed_name));

        cancelButton.setOnClickListener(v -> {
            dialog.dismiss();
            breedSpinner.setText(""); // Clear selection
        });

        saveButton.setOnClickListener(v -> {
            String newBreed = breedInput.getText().toString().trim();
            if (newBreed.isEmpty()) {
                Toast.makeText(this, "Please enter breed name", Toast.LENGTH_SHORT).show();
                return;
            }

            // Check if breed already exists
            if (breedList.contains(newBreed)) {
                Toast.makeText(this, "Breed already exists", Toast.LENGTH_SHORT).show();
                return;
            }

            // Remove "Create New Breed" option temporarily
            breedList.remove(getString(R.string.create_new_breed));
            
            // Add new breed
            breedList.add(newBreed);
            
            // Add "Create New Breed" back at the end
            breedList.add(getString(R.string.create_new_breed));
            
            // Update adapter
            breedAdapter.notifyDataSetChanged();
            
            // Select the newly created breed
            breedSpinner.setText(newBreed, false);
            
            dialog.dismiss();
            Toast.makeText(this, "Breed added successfully", Toast.LENGTH_SHORT).show();
        });

        dialog.show();
    }

    private boolean validateForm() {
        if (tagNumberEditText.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please enter tag number", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (nameEditText.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please enter cattle name", Toast.LENGTH_SHORT).show();
            return false;
        }
        String selectedBreed = breedSpinner.getText().toString().trim();
        if (selectedBreed.isEmpty() || selectedBreed.equals(getString(R.string.create_new_breed))) {
            Toast.makeText(this, "Please select a breed", Toast.LENGTH_SHORT).show();
            return false;
        }
        AutoCompleteTextView genderSpinner = findViewById(R.id.gender_spinner);
        if (genderSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select gender", Toast.LENGTH_SHORT).show();
            return false;
        }
        AutoCompleteTextView cattleStageSpinner = findViewById(R.id.cattle_stage_spinner);
        if (cattleStageSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select cattle stage", Toast.LENGTH_SHORT).show();
            return false;
        }
        String selectedObtained = obtainedSpinner.getText().toString().trim();
        if (selectedObtained.isEmpty()) {
            Toast.makeText(this, "Please select how cattle was obtained", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (selectedObtained.equals(getString(R.string.other)) && otherSourceInput.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please specify the source", Toast.LENGTH_SHORT).show();
            return false;
        }
        String selectedGroup = groupSpinner.getText().toString().trim();
        if (selectedGroup.isEmpty()) {
            Toast.makeText(this, "Please select a group", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }
}

