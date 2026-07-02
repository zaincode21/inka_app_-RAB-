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

public class AddIncomeActivity extends BaseActivity {

    private EditText dateInput;
    private AutoCompleteTextView incomeTypeSpinner;
    private EditText milkQuantityInput;
    private EditText sellingPriceInput;
    private EditText amountInput;
    private EditText receiptNoInput;
    private EditText notesInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_income);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Prevent keyboard from opening automatically
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN);

        // Initialize views
        dateInput = findViewById(R.id.date_input);
        incomeTypeSpinner = findViewById(R.id.income_type);
        milkQuantityInput = findViewById(R.id.milk_quantity_input);
        sellingPriceInput = findViewById(R.id.selling_price_input);
        amountInput = findViewById(R.id.amount_input);
        receiptNoInput = findViewById(R.id.receipt_no_input);
        notesInput = findViewById(R.id.notes_input);

        // Prevent auto-focus on any input
        dateInput.setFocusableInTouchMode(false);
        incomeTypeSpinner.setFocusableInTouchMode(false);
        milkQuantityInput.setFocusableInTouchMode(false);
        sellingPriceInput.setFocusableInTouchMode(false);
        amountInput.setFocusableInTouchMode(false);
        receiptNoInput.setFocusableInTouchMode(false);
        notesInput.setFocusableInTouchMode(false);

        // Set focus on main layout to prevent auto-focus on inputs
        findViewById(R.id.main).requestFocus();

        // Set up click listeners to enable focus and show keyboard when clicked
        setupInputFocusListeners();

        // Setup date picker
        dateInput.setOnClickListener(v -> showDatePicker());

        // Setup income type spinner
        ArrayAdapter<String> incomeTypeAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{
                getString(R.string.milk_sale),
                getString(R.string.category_income),
                getString(R.string.other_income)
            });
        incomeTypeSpinner.setAdapter(incomeTypeAdapter);
        incomeTypeSpinner.setThreshold(0);
        incomeTypeSpinner.setOnClickListener(v -> {
            incomeTypeSpinner.showDropDown();
        });
        incomeTypeSpinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                incomeTypeSpinner.showDropDown();
            }
        });

        // Listen to income type changes to show/hide conditional fields
        incomeTypeSpinner.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateConditionalFieldsVisibility();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Auto-calculate amount when milk quantity and selling price are entered
        milkQuantityInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                calculateAmount();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        sellingPriceInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                calculateAmount();
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
                // TODO: Save income to database
                Toast.makeText(this, "Income saved successfully!", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
    }

    private void setupInputFocusListeners() {
        // Milk quantity - enable focus on click
        milkQuantityInput.setOnClickListener(v -> {
            milkQuantityInput.setFocusableInTouchMode(true);
            milkQuantityInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(milkQuantityInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
        });

        // Selling price - enable focus on click
        sellingPriceInput.setOnClickListener(v -> {
            sellingPriceInput.setFocusableInTouchMode(true);
            sellingPriceInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(sellingPriceInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
        });

        // Amount - enable focus on click
        amountInput.setOnClickListener(v -> {
            // Only allow focus if not auto-calculated (not milk sale)
            String selectedType = incomeTypeSpinner.getText().toString().trim();
            String milkSale = getString(R.string.milk_sale);
            if (!selectedType.equals(milkSale)) {
                amountInput.setFocusableInTouchMode(true);
                amountInput.requestFocus();
                // Show keyboard
                android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
                imm.showSoftInput(amountInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
            }
        });

        // Receipt number - enable focus on click
        receiptNoInput.setOnClickListener(v -> {
            receiptNoInput.setFocusableInTouchMode(true);
            receiptNoInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(receiptNoInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
        });

        // Notes - enable focus on click
        notesInput.setOnClickListener(v -> {
            notesInput.setFocusableInTouchMode(true);
            notesInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(notesInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
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
                String date = String.format("%02d/%02d/%04d", selectedMonth + 1, selectedDay, selectedYear);
                dateInput.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }

    private void updateConditionalFieldsVisibility() {
        String selectedType = incomeTypeSpinner.getText().toString().trim();
        String milkSale = getString(R.string.milk_sale);

        // Hide conditional fields first
        milkQuantityInput.setVisibility(View.GONE);
        sellingPriceInput.setVisibility(View.GONE);

        // Clear fields
        milkQuantityInput.setText("");
        sellingPriceInput.setText("");
        amountInput.setText("");

        // Show relevant fields based on selection
        if (selectedType.equals(milkSale)) {
            // Milk Sale: show milk quantity and selling price
            milkQuantityInput.setVisibility(View.VISIBLE);
            sellingPriceInput.setVisibility(View.VISIBLE);
            // Make amount read-only when auto-calculated
            amountInput.setFocusable(false);
            amountInput.setFocusableInTouchMode(false);
            amountInput.setClickable(false);
        } else {
            // For other income types, allow manual entry but don't auto-focus
            amountInput.setFocusable(true);
            amountInput.setFocusableInTouchMode(false); // Will be enabled on click
            amountInput.setClickable(true);
        }
    }

    private void calculateAmount() {
        String selectedType = incomeTypeSpinner.getText().toString().trim();
        String milkSale = getString(R.string.milk_sale);

        if (selectedType.equals(milkSale)) {
            try {
                String quantityStr = milkQuantityInput.getText().toString().trim();
                String priceStr = sellingPriceInput.getText().toString().trim();

                if (!quantityStr.isEmpty() && !priceStr.isEmpty()) {
                    double quantity = Double.parseDouble(quantityStr);
                    double price = Double.parseDouble(priceStr);
                    double total = quantity * price;
                    amountInput.setText(String.valueOf(total));
                } else {
                    amountInput.setText("");
                }
            } catch (NumberFormatException e) {
                // Invalid input, leave amount empty
            }
        }
    }

    private boolean validateForm() {
        if (dateInput.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select date", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (incomeTypeSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select income type", Toast.LENGTH_SHORT).show();
            return false;
        }

        String selectedType = incomeTypeSpinner.getText().toString().trim();
        String milkSale = getString(R.string.milk_sale);

        // Validate conditional fields for Milk Sale
        if (selectedType.equals(milkSale)) {
            if (milkQuantityInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter milk quantity sold", Toast.LENGTH_SHORT).show();
                return false;
            }
            if (sellingPriceInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter selling price per liter", Toast.LENGTH_SHORT).show();
                return false;
            }
        }

        if (amountInput.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please enter amount", Toast.LENGTH_SHORT).show();
            return false;
        }

        return true;
    }
}

