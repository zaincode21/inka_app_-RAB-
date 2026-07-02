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

public class AddExpenseActivity extends BaseActivity {

    private EditText dateInput;
    private AutoCompleteTextView expenseTypeSpinner;
    private EditText expenseNameInput;
    private EditText amountInput;
    private EditText receiptNoInput;
    private EditText notesInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_expense);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Prevent keyboard from opening automatically
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN);

        // Initialize views
        dateInput = findViewById(R.id.date_input);
        expenseTypeSpinner = findViewById(R.id.expense_type);
        expenseNameInput = findViewById(R.id.expense_name_input);
        amountInput = findViewById(R.id.amount_input);
        receiptNoInput = findViewById(R.id.receipt_no_input);
        notesInput = findViewById(R.id.notes_input);

        // Prevent auto-focus on any input
        dateInput.setFocusableInTouchMode(false);
        expenseTypeSpinner.setFocusableInTouchMode(false);
        expenseNameInput.setFocusableInTouchMode(false);
        amountInput.setFocusableInTouchMode(false);
        receiptNoInput.setFocusableInTouchMode(false);
        notesInput.setFocusableInTouchMode(false);

        // Set focus on main layout to prevent auto-focus on inputs
        findViewById(R.id.main).requestFocus();

        // Set up click listeners to enable focus and show keyboard when clicked
        setupInputFocusListeners();

        // Setup date picker
        dateInput.setOnClickListener(v -> showDatePicker());

        // Setup expense type spinner
        ArrayAdapter<String> expenseTypeAdapter = new ArrayAdapter<>(this,
            android.R.layout.simple_dropdown_item_1line,
            new String[]{
                getString(R.string.category_expense),
                getString(R.string.other_expense)
            });
        expenseTypeSpinner.setAdapter(expenseTypeAdapter);
        expenseTypeSpinner.setThreshold(0);
        expenseTypeSpinner.setOnClickListener(v -> {
            expenseTypeSpinner.showDropDown();
        });
        expenseTypeSpinner.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                expenseTypeSpinner.showDropDown();
            }
        });

        // Listen to expense type changes to show/hide conditional fields
        expenseTypeSpinner.addTextChangedListener(new TextWatcher() {
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
                // TODO: Save expense to database
                Toast.makeText(this, "Expense saved successfully!", Toast.LENGTH_SHORT).show();
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
                String date = String.format("%02d/%02d/%04d", selectedMonth + 1, selectedDay, selectedYear);
                dateInput.setText(date);
            },
            year, month, day
        );
        datePickerDialog.show();
    }

    private void updateConditionalFieldsVisibility() {
        String selectedType = expenseTypeSpinner.getText().toString().trim();
        String otherExpense = getString(R.string.other_expense);

        // Hide conditional field first
        expenseNameInput.setVisibility(View.GONE);

        // Clear field
        expenseNameInput.setText("");

        // Show relevant field based on selection
        if (selectedType.equals(otherExpense)) {
            // Other Expense: show name of expense input
            expenseNameInput.setVisibility(View.VISIBLE);
        }
    }

    private void setupInputFocusListeners() {
        // Expense name - enable focus on click
        expenseNameInput.setOnClickListener(v -> {
            expenseNameInput.setFocusableInTouchMode(true);
            expenseNameInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(expenseNameInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
        });

        // Amount - enable focus on click
        amountInput.setOnClickListener(v -> {
            amountInput.setFocusableInTouchMode(true);
            amountInput.requestFocus();
            // Show keyboard
            android.view.inputmethod.InputMethodManager imm = (android.view.inputmethod.InputMethodManager) getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(amountInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
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

    private boolean validateForm() {
        if (dateInput.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select date", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (expenseTypeSpinner.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Please select expense type", Toast.LENGTH_SHORT).show();
            return false;
        }

        String selectedType = expenseTypeSpinner.getText().toString().trim();
        String otherExpense = getString(R.string.other_expense);

        // Validate conditional field for Other Expense
        if (selectedType.equals(otherExpense)) {
            if (expenseNameInput.getText().toString().trim().isEmpty()) {
                Toast.makeText(this, "Please enter name of expense", Toast.LENGTH_SHORT).show();
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

