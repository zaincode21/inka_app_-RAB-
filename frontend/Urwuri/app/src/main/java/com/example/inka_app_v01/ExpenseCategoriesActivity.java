package com.example.inka_app_v01;

import android.app.Dialog;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ExpenseCategoriesActivity extends BaseActivity {

    private RecyclerView categoryRecyclerView;
    private CategoryAdapter categoryAdapter;
    private List<String> categoryList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_category_list);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Set header title
        TextView headerTitle = findViewById(R.id.header_title);
        headerTitle.setText(getString(R.string.expense_categories));

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Initialize category list
        categoryList = new ArrayList<>();
        // TODO: Load actual data from database/API
        // Sample data
        categoryList.add("Feed");
        categoryList.add("Veterinary");
        categoryList.add("Equipment");

        // Setup RecyclerView
        categoryRecyclerView = findViewById(R.id.category_recycler_view);
        categoryAdapter = new CategoryAdapter(categoryList);
        categoryRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        categoryRecyclerView.setAdapter(categoryAdapter);

        // Add button
        findViewById(R.id.add_button).setOnClickListener(v -> {
            showAddCategoryDialog();
        });
    }

    private void showAddCategoryDialog() {
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
        EditText categoryInput = dialog.findViewById(R.id.category_input);
        Button cancelButton = dialog.findViewById(R.id.cancel_button);
        Button saveButton = dialog.findViewById(R.id.save_button);

        dialogTitle.setText(getString(R.string.add_expense_category));
        inputLabel.setText(getString(R.string.expense_category_name));
        categoryInput.setHint(getString(R.string.enter_expense_category_name));

        cancelButton.setOnClickListener(v -> dialog.dismiss());

        saveButton.setOnClickListener(v -> {
            String categoryName = categoryInput.getText().toString().trim();
            if (categoryName.isEmpty()) {
                Toast.makeText(this, "Please enter category name", Toast.LENGTH_SHORT).show();
                return;
            }
            // TODO: Save to database/API
            categoryAdapter.addCategory(categoryName);
            Toast.makeText(this, "Category added successfully!", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });

        dialog.show();
    }
}

