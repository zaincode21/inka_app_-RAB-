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

public class CattleGroupsActivity extends BaseActivity {

    private RecyclerView categoryRecyclerView;
    private CategoryAdapter categoryAdapter;
    private List<String> groupList;

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
        headerTitle.setText(getString(R.string.cattle_groups));

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Initialize group list
        groupList = new ArrayList<>();
        // TODO: Load actual data from database/API
        // Sample data
        groupList.add("Milking Cows");
        groupList.add("Dry Cows");
        groupList.add("Calves");
        groupList.add("Bulls");

        // Setup RecyclerView
        categoryRecyclerView = findViewById(R.id.category_recycler_view);
        categoryAdapter = new CategoryAdapter(groupList);
        categoryRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        categoryRecyclerView.setAdapter(categoryAdapter);

        // Add button
        findViewById(R.id.add_button).setOnClickListener(v -> {
            showAddGroupDialog();
        });
    }

    private void showAddGroupDialog() {
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

        dialogTitle.setText(getString(R.string.add_cattle_group));
        inputLabel.setText(getString(R.string.cattle_group_name));
        categoryInput.setHint(getString(R.string.enter_cattle_group_name));

        cancelButton.setOnClickListener(v -> dialog.dismiss());

        saveButton.setOnClickListener(v -> {
            String groupName = categoryInput.getText().toString().trim();
            if (groupName.isEmpty()) {
                Toast.makeText(this, "Please enter group name", Toast.LENGTH_SHORT).show();
                return;
            }
            // TODO: Save to database/API
            categoryAdapter.addCategory(groupName);
            Toast.makeText(this, "Group added successfully!", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });

        dialog.show();
    }
}

