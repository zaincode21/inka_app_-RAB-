package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class CattleListActivity extends BaseActivity {

    private RecyclerView cattleRecyclerView;
    private CattleAdapter cattleAdapter;
    private List<Cattle> cattleList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cattle_list);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Initialize cattle list
        cattleList = new ArrayList<>();
        // TODO: Load actual cattle data from database/API
        // Sample data for now
        cattleList.add(new Cattle("C001", "Bella", "Cow", "Holstein", "Active", "2020-03-15"));
        cattleList.add(new Cattle("C002", "Max", "Bull", "Angus", "Active", "2019-05-20"));
        cattleList.add(new Cattle("C003", "Luna", "Cow", "Jersey", "Active", "2021-01-10"));
        cattleList.add(new Cattle("C004", "Charlie", "Calf", "Holstein", "Active", "2023-06-05"));
        cattleList.add(new Cattle("C005", "Daisy", "Cow", "Guernsey", "Active", "2018-09-12"));
        cattleList.add(new Cattle("C006", "Rocky", "Bull", "Hereford", "Active", "2017-11-30"));
        cattleList.add(new Cattle("C007", "Molly", "Cow", "Holstein", "Active", "2020-07-22"));
        cattleList.add(new Cattle("C008", "Buddy", "Calf", "Angus", "Active", "2023-08-15"));

        // Setup RecyclerView
        cattleRecyclerView = findViewById(R.id.cattle_recycler_view);
        cattleRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        cattleAdapter = new CattleAdapter(cattleList);
        cattleRecyclerView.setAdapter(cattleAdapter);

        // Add Cattle button
        findViewById(R.id.add_cattle_button).setOnClickListener(v -> {
            Intent intent = new Intent(CattleListActivity.this, AddCattleActivity.class);
            startActivity(intent);
        });
    }

    // Cattle data model
    public static class Cattle {
        private String id;
        private String name;
        private String type;
        private String breed;
        private String status;
        private String dateOfBirth;

        public Cattle(String id, String name, String type, String breed, String status, String dateOfBirth) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.breed = breed;
            this.status = status;
            this.dateOfBirth = dateOfBirth;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getType() { return type; }
        public String getBreed() { return breed; }
        public String getStatus() { return status; }
        public String getDateOfBirth() { return dateOfBirth; }
    }
}

