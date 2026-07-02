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

public class CattleBreedsActivity extends BaseActivity {

    private RecyclerView categoryRecyclerView;
    private CategoryAdapter categoryAdapter;
    private List<String> breedList;

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
        headerTitle.setText(getString(R.string.cattle_breeds));

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Initialize breed list
        breedList = new ArrayList<>();
        // TODO: Load actual data from database/API
        // Sample data
        breedList.add("Holstein");
        breedList.add("Jersey");
        breedList.add("Angus");
        breedList.add("Guernsey");

        // Setup RecyclerView
        categoryRecyclerView = findViewById(R.id.category_recycler_view);
        categoryAdapter = new CategoryAdapter(breedList);
        categoryRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        categoryRecyclerView.setAdapter(categoryAdapter);

        // Add button
        findViewById(R.id.add_button).setOnClickListener(v -> {
            showAddBreedDialog();
        });
    }

    private void showAddBreedDialog() {
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

        dialogTitle.setText(getString(R.string.add_cattle_breed));
        inputLabel.setText(getString(R.string.cattle_breed_name));
        categoryInput.setHint(getString(R.string.enter_cattle_breed_name));

        cancelButton.setOnClickListener(v -> dialog.dismiss());

        saveButton.setOnClickListener(v -> {
            String breedName = categoryInput.getText().toString().trim();
            if (breedName.isEmpty()) {
                Toast.makeText(this, "Please enter breed name", Toast.LENGTH_SHORT).show();
                return;
            }
            // TODO: Save to database/API
            categoryAdapter.addCategory(breedName);
            Toast.makeText(this, "Breed added successfully!", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });

        dialog.show();
    }
}

