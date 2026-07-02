package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class LoginActivity extends BaseActivity {

    private EditText emailEditText;
    private EditText passwordEditText;
    private ImageView passwordToggle;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom);
            return insets;
        });

        emailEditText = findViewById(R.id.email_edit_text);
        passwordEditText = findViewById(R.id.password_edit_text);
        passwordToggle = findViewById(R.id.password_toggle);

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

        // Login button click
        findViewById(R.id.login_button).setOnClickListener(v -> {
            String email = emailEditText.getText().toString().trim();
            String password = passwordEditText.getText().toString().trim();
            
            if (email.isEmpty()) {
                Toast.makeText(this, "Please enter your email or username", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (password.isEmpty()) {
                Toast.makeText(this, "Please enter your password", Toast.LENGTH_SHORT).show();
                return;
            }
            
            // TODO: Implement actual login logic
            Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show();
            // Navigate to Dashboard
            Intent intent = new Intent(LoginActivity.this, DashboardActivity.class);
            startActivity(intent);
            finish();
        });

        // Forgot password click
        findViewById(R.id.forgot_password).setOnClickListener(v -> {
            Toast.makeText(this, "Forgot Password clicked", Toast.LENGTH_SHORT).show();
            // TODO: Implement forgot password logic
        });

        // Sign up click
        findViewById(R.id.sign_up_link).setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, SignUpActivity.class);
            startActivity(intent);
            finish();
        });
    }
}

