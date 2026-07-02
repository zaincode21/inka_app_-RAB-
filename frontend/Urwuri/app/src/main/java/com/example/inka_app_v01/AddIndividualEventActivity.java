package com.example.inka_app_v01;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.Calendar;

public class AddIndividualEventActivity extends BaseActivity {

    private EditText eventDateEditText;
    private AutoCompleteTextView eventTypeSpinner;
    private EditText symptomsInput;
    private EditText diagnosisInput;
    private EditText technicianNameInput;
    private EditText weightResultInput;
    private EditText medicineInput;
    private EditText notesEditText;
    
    // Breeding fields
    private EditText semenUsedInput;
    private EditText veterinarianNameInput;
    private EditText estimatedReturnHeatDateInput;
    
    // Pregnant fields
    private EditText breedingDateInput;
    private EditText expectedDeliveryDateInput;
    private EditText bullResponsibleInput;
    
    // Giving Birth fields
    private EditText givingBirthBullResponsibleInput;
    private Button registerCalfButton;
    private LinearLayout calfRegistrationContainer;
    private EditText calfTagNoInput;
    private AutoCompleteTextView calfGenderInput;
    private TextView calfRegistrationNote;
    
    private String selectedCattle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_individual_event);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Get selected cattle from intent
        selectedCattle = getIntent().getStringExtra("selected_cattle");

        // Initialize views
        eventDateEditText = findViewById(R.id.event_date);
        eventTypeSpinner = findViewById(R.id.event_type);
        symptomsInput = findViewById(R.id.symptoms_input);
        diagnosisInput = findViewById(R.id.diagnosis_input);
        technicianNameInput = findViewById(R.id.technician_name_input);
        weightResultInput = findViewById(R.id.weight_result_input);
        medicineInput = findViewById(R.id.medicine_input);
        notesEditText = findViewById(R.id.notes);
        
        // Breeding fields
        semenUsedInput = findViewById(R.id.semen_used_input);
        veterinarianNameInput = findViewById(R.id.veterinarian_name_input);
        estimatedReturnHeatDateInput = findViewById(R.id.estimated_return_heat_date_input);
        
        // Pregnant fields
        breedingDateInput = findViewById(R.id.breeding_date_input);
        expectedDeliveryDateInput = findViewById(R.id.expected_delivery_date_input);
        bullResponsibleInput = findViewById(R.id.bull_responsible_input);
        
        // Giving Birth fields
        givingBirthBullResponsibleInput = findViewById(R.id.giving_birth_bull_responsible_input);
        registerCalfButton = findViewById(R.id.register_calf_button);
        calfRegistrationContainer = findViewById(R.id.calf_registration_container);
        calfTagNoInput = findViewById(R.id.calf_tag_no_input);
        calfGenderInput = findViewById(R.id.calf_gender_input);
        calfRegistrationNote = findViewById(R.id.calf_registration_note);
        
        // Setup gender dropdown for calf
        ArrayAdapter<String> genderAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{
                getString(R.string.male),
                getString(R.string.female)
            });
        calfGenderInput.setAdapter(genderAdapter);
        calfGenderInput.setThreshold(0);
        calfGenderInput.setOnClickListener(v -> {
            calfGenderInput.showDropDown();
        });
        calfGenderInput.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                calfGenderInput.showDropDown();
            }
        });
        
        // Setup register calf button
        registerCalfButton.setOnClickListener(v -> {
            if (calfRegistrationContainer.getVisibility() == View.GONE) {
                calfRegistrationContainer.setVisibility(View.VISIBLE);
                calfRegistrationNote.setVisibility(View.VISIBLE);
            } else {
                calfRegistrationContainer.setVisibility(View.GONE);
                calfRegistrationNote.setVisibility(View.GONE);
                calfTagNoInput.setText("");
                calfGenderInput.setText("");
            }
        });
        
        // Estimated return to heat date is read-only (auto-calculated)
        estimatedReturnHeatDateInput.setFocusable(false);
        estimatedReturnHeatDateInput.setClickable(false);
        estimatedReturnHeatDateInput.setEnabled(false);
        
        breedingDateInput.setOnClickListener(v -> showBreedingDatePicker());
        breedingDateInput.setFocusable(false);
        breedingDateInput.setClickable(true);

        // Setup date picker
        eventDateEditText.setOnClickListener(v -> showDatePicker());
        eventDateEditText.setFocusable(false);
        eventDateEditText.setClickable(true);

        // Setup event type spinner
        ArrayAdapter<String> eventTypeAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{
                getString(R.string.treated),
                getString(R.string.weighed),
                getString(R.string.weaned),
                getString(R.string.castrated),
                getString(R.string.vaccinated),
                getString(R.string.tagging),
                getString(R.string.breeding),
                getString(R.string.dry_off),
                getString(R.string.giving_birth),
                getString(R.string.pregnant)
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

        // Listen to event type changes to show/hide conditional fields
        eventTypeSpinner.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateConditionalFieldsVisibility();
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
                Calendar eventDate = Calendar.getInstance();
                eventDate.set(selectedYear, selectedMonth, selectedDay);
                
                String date = String.format("%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay);
                eventDateEditText.setText(date);
                
                // Auto-calculate estimated return to heat date if event type is Breeding
                // Cattle estrous cycle is typically 21 days
                String selectedType = eventTypeSpinner.getText().toString().trim();
                String breeding = getString(R.string.breeding);
                if (selectedType.equals(breeding)) {
                    Calendar returnToHeatDate = (Calendar) eventDate.clone();
                    returnToHeatDate.add(Calendar.DAY_OF_MONTH, 21);
                    
                    String returnToHeatDateStr = String.format("%04d-%02d-%02d", 
                        returnToHeatDate.get(Calendar.YEAR),
                        returnToHeatDate.get(Calendar.MONTH) + 1,
                        returnToHeatDate.get(Calendar.DAY_OF_MONTH));
                    estimatedReturnHeatDateInput.setText(returnToHeatDateStr);
                }
            },
            year, month, day
        );
        datePickerDialog.show();
    }
    
    private void showDatePickerForField(EditText editText) {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
            this,
            (view, selectedYear, selectedMonth, selectedDay) -> {
                String date = String.format("%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay);
                editText.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }
    
    private void showBreedingDatePicker() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
            this,
            (view, selectedYear, selectedMonth, selectedDay) -> {
                Calendar breedingDate = Calendar.getInstance();
                breedingDate.set(selectedYear, selectedMonth, selectedDay);
                
                String date = String.format("%04d-%02d-%02d", selectedYear, selectedMonth + 1, selectedDay);
                breedingDateInput.setText(date);
                
                // Auto-calculate expected delivery date (280 days for cattle)
                Calendar expectedDate = (Calendar) breedingDate.clone();
                expectedDate.add(Calendar.DAY_OF_MONTH, 280);
                
                String expectedDateStr = String.format("%04d-%02d-%02d", 
                    expectedDate.get(Calendar.YEAR),
                    expectedDate.get(Calendar.MONTH) + 1,
                    expectedDate.get(Calendar.DAY_OF_MONTH));
                expectedDeliveryDateInput.setText(expectedDateStr);
            },
            year, month, day
        );
        datePickerDialog.show();
    }

    private void updateConditionalFieldsVisibility() {
        String selectedType = eventTypeSpinner.getText().toString().trim();
        String treated = getString(R.string.treated);
        String weighed = getString(R.string.weighed);
        String vaccinated = getString(R.string.vaccinated);
        String breeding = getString(R.string.breeding);
        String pregnant = getString(R.string.pregnant);
        String givingBirth = getString(R.string.giving_birth);

        // Hide all fields first
        symptomsInput.setVisibility(View.GONE);
        diagnosisInput.setVisibility(View.GONE);
        technicianNameInput.setVisibility(View.GONE);
        weightResultInput.setVisibility(View.GONE);
        medicineInput.setVisibility(View.GONE);
        semenUsedInput.setVisibility(View.GONE);
        veterinarianNameInput.setVisibility(View.GONE);
        estimatedReturnHeatDateInput.setVisibility(View.GONE);
        breedingDateInput.setVisibility(View.GONE);
        expectedDeliveryDateInput.setVisibility(View.GONE);
        bullResponsibleInput.setVisibility(View.GONE);
        givingBirthBullResponsibleInput.setVisibility(View.GONE);
        registerCalfButton.setVisibility(View.GONE);
        calfRegistrationContainer.setVisibility(View.GONE);
        calfRegistrationNote.setVisibility(View.GONE);

        // Clear all fields
        symptomsInput.setText("");
        diagnosisInput.setText("");
        technicianNameInput.setText("");
        weightResultInput.setText("");
        medicineInput.setText("");
        semenUsedInput.setText("");
        veterinarianNameInput.setText("");
        estimatedReturnHeatDateInput.setText("");
        breedingDateInput.setText("");
        expectedDeliveryDateInput.setText("");
        bullResponsibleInput.setText("");
        givingBirthBullResponsibleInput.setText("");
        calfTagNoInput.setText("");
        calfGenderInput.setText("");

        // Show relevant fields based on selection
        if (selectedType.equals(treated)) {
            // Treated: symptoms, diagnosis, technician name, medicine
            symptomsInput.setVisibility(View.VISIBLE);
            diagnosisInput.setVisibility(View.VISIBLE);
            technicianNameInput.setVisibility(View.VISIBLE);
            medicineInput.setVisibility(View.VISIBLE);
        } else if (selectedType.equals(weighed)) {
            // Weighed: weight result
            weightResultInput.setVisibility(View.VISIBLE);
        } else if (selectedType.equals(vaccinated)) {
            // Vaccinated: medicine
            medicineInput.setVisibility(View.VISIBLE);
        } else if (selectedType.equals(breeding)) {
            // Breeding: Semen used, Name of veterinarian, Estimated return to heat date
            semenUsedInput.setVisibility(View.VISIBLE);
            veterinarianNameInput.setVisibility(View.VISIBLE);
            estimatedReturnHeatDateInput.setVisibility(View.VISIBLE);
            
            // Auto-calculate estimated return to heat date if event date is already set
            String eventDateStr = eventDateEditText.getText().toString().trim();
            if (!eventDateStr.isEmpty()) {
                try {
                    // Parse event date (format: YYYY-MM-DD)
                    String[] dateParts = eventDateStr.split("-");
                    if (dateParts.length == 3) {
                        int year = Integer.parseInt(dateParts[0]);
                        int month = Integer.parseInt(dateParts[1]) - 1; // Calendar months are 0-based
                        int day = Integer.parseInt(dateParts[2]);
                        
                        Calendar eventDate = Calendar.getInstance();
                        eventDate.set(year, month, day);
                        
                        // Calculate return to heat date (21 days later - standard cattle estrous cycle)
                        Calendar returnToHeatDate = (Calendar) eventDate.clone();
                        returnToHeatDate.add(Calendar.DAY_OF_MONTH, 21);
                        
                        String returnToHeatDateStr = String.format("%04d-%02d-%02d", 
                            returnToHeatDate.get(Calendar.YEAR),
                            returnToHeatDate.get(Calendar.MONTH) + 1,
                            returnToHeatDate.get(Calendar.DAY_OF_MONTH));
                        estimatedReturnHeatDateInput.setText(returnToHeatDateStr);
                    }
                } catch (Exception e) {
                    // If parsing fails, leave field empty
                }
            }
        } else if (selectedType.equals(pregnant)) {
            // Pregnant: Breeding date, Expected delivery date (auto-calculated), Semen/tag no. of bull responsible
            breedingDateInput.setVisibility(View.VISIBLE);
            expectedDeliveryDateInput.setVisibility(View.VISIBLE);
            bullResponsibleInput.setVisibility(View.VISIBLE);
        } else if (selectedType.equals(givingBirth)) {
            // Giving Birth: Semen/tag no. of bull responsible, Note, Register calf button
            givingBirthBullResponsibleInput.setVisibility(View.VISIBLE);
            calfRegistrationNote.setVisibility(View.VISIBLE);
            registerCalfButton.setVisibility(View.VISIBLE);
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

        String selectedType = eventTypeSpinner.getText().toString().trim();
        String treated = getString(R.string.treated);
        String weighed = getString(R.string.weighed);
        String vaccinated = getString(R.string.vaccinated);
        String breeding = getString(R.string.breeding);
        String pregnant = getString(R.string.pregnant);
        String givingBirth = getString(R.string.giving_birth);

        // Validate conditional fields
        if (selectedType.equals(treated)) {
            if (symptomsInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter symptoms", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (diagnosisInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter diagnosis", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (technicianNameInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter technician name", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (medicineInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter medicine information", Toast.LENGTH_SHORT).show();
                return false;
            }
        } else if (selectedType.equals(weighed)) {
            if (weightResultInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter weight result", Toast.LENGTH_SHORT).show();
                return false;
            }
        } else if (selectedType.equals(vaccinated)) {
            if (medicineInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter medicine information", Toast.LENGTH_SHORT).show();
                return false;
            }
        } else if (selectedType.equals(breeding)) {
            if (semenUsedInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter semen used", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (veterinarianNameInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter name of veterinarian", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (estimatedReturnHeatDateInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please select estimated return to heat date", Toast.LENGTH_SHORT).show();
                return false;
            }
        } else if (selectedType.equals(pregnant)) {
            if (breedingDateInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please select breeding date", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (bullResponsibleInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter semen/tag no. of bull responsible", Toast.LENGTH_SHORT).show();
                return false;
            }
        } else if (selectedType.equals(givingBirth)) {
            if (givingBirthBullResponsibleInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter semen/tag no. of bull responsible", Toast.LENGTH_SHORT).show();
                return false;
            }
            // Validate calf registration if container is visible
            if (calfRegistrationContainer.getVisibility() == View.VISIBLE) {
                if (calfTagNoInput.getText().toString().trim().isEmpty()) {
                    Toast.makeText(this, "Please enter calf tag number", Toast.LENGTH_SHORT).show();
                    return false;
                }
                if (calfGenderInput.getText().toString().trim().isEmpty()) {
                    Toast.makeText(this, "Please select calf gender", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        }

        return true;
    }
}

