package com.example.inka_app_v01;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class SignUpActivity extends BaseActivity {

    private EditText namesEditText;
    private EditText emailEditText;
    private EditText phoneEditText;
    private EditText passwordEditText;
    private EditText confirmPasswordEditText;
    private ImageView passwordToggle;
    private ImageView confirmPasswordToggle;
    private CheckBox termsCheckBox;
    private boolean isPasswordVisible = false;
    private boolean isConfirmPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom);
            return insets;
        });

        namesEditText = findViewById(R.id.names_edit_text);
        emailEditText = findViewById(R.id.email_edit_text);
        phoneEditText = findViewById(R.id.phone_edit_text);
        passwordEditText = findViewById(R.id.password_edit_text);
        confirmPasswordEditText = findViewById(R.id.confirm_password_edit_text);
        passwordToggle = findViewById(R.id.password_toggle);
        confirmPasswordToggle = findViewById(R.id.confirm_password_toggle);
        termsCheckBox = findViewById(R.id.terms_checkbox);
        
        // Style terms & conditions text - make "terms & conditions" teal and bold
        TextView termsText = findViewById(R.id.terms_text);
        if (termsText != null) {
            String fullText = getString(R.string.terms_conditions);
            SpannableString spannable = new SpannableString(fullText);
            int startIndex = fullText.indexOf("terms & conditions");
            if (startIndex != -1) {
                int endIndex = startIndex + "terms & conditions".length();
                spannable.setSpan(new ForegroundColorSpan(Color.parseColor("#107e7d")), 
                    startIndex, endIndex, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                spannable.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD), 
                    startIndex, endIndex, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                termsText.setText(spannable);
            }
        }

        // Password toggle functionality
        passwordToggle.setOnClickListener(v -> {
            isPasswordVisible = !isPasswordVisible;
            if (isPasswordVisible) {
                passwordEditText.setInputType(InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                passwordToggle.setImageResource(R.drawable.ic_eye_off);
            } else {
                passwordEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                passwordToggle.setImageResource(R.drawable.ic_eye);
            }
            passwordEditText.setSelection(passwordEditText.getText().length());
        });

        // Confirm password toggle functionality
        confirmPasswordToggle.setOnClickListener(v -> {
            isConfirmPasswordVisible = !isConfirmPasswordVisible;
            if (isConfirmPasswordVisible) {
                confirmPasswordEditText.setInputType(InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                confirmPasswordToggle.setImageResource(R.drawable.ic_eye_off);
            } else {
                confirmPasswordEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                confirmPasswordToggle.setImageResource(R.drawable.ic_eye);
            }
            confirmPasswordEditText.setSelection(confirmPasswordEditText.getText().length());
        });

        // Create account button click
        findViewById(R.id.create_account_button).setOnClickListener(v -> {
            String names = namesEditText.getText().toString().trim();
            String email = emailEditText.getText().toString().trim();
            String phone = phoneEditText.getText().toString().trim();
            String password = passwordEditText.getText().toString().trim();
            String confirmPassword = confirmPasswordEditText.getText().toString().trim();
            
            if (names.isEmpty()) {
                Toast.makeText(this, "Please enter your full names", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (email.isEmpty()) {
                Toast.makeText(this, "Please enter your email", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (phone.isEmpty()) {
                Toast.makeText(this, "Please enter your phone number", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (password.isEmpty()) {
                Toast.makeText(this, "Please enter your password", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (confirmPassword.isEmpty()) {
                Toast.makeText(this, "Please confirm your password", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (!password.equals(confirmPassword)) {
                Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (!termsCheckBox.isChecked()) {
                Toast.makeText(this, "Please agree to the terms & conditions", Toast.LENGTH_SHORT).show();
                return;
            }
            
            // TODO: Implement actual sign up logic
            Toast.makeText(this, "Account created successfully!", Toast.LENGTH_SHORT).show();
            // Navigate to login screen after successful signup
            Intent intent = new Intent(SignUpActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });

        // Login link click
        findViewById(R.id.login_link).setOnClickListener(v -> {
            Intent intent = new Intent(SignUpActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });
    }
}

