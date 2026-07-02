package com.example.inka_app_v01;

import android.content.Intent;
import android.os.Bundle;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MilkRecordsListActivity extends BaseActivity {

    private RecyclerView milkRecordsRecyclerView;
    private MilkRecordAdapter milkRecordAdapter;
    private List<MilkRecord> milkRecordList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_milk_records_list);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Back button
        findViewById(R.id.back_button).setOnClickListener(v -> {
            finish();
        });

        // Initialize milk records list
        milkRecordList = new ArrayList<>();
        // TODO: Load actual milk records from database/API
        // Sample data for now
        milkRecordList.add(new MilkRecord("2024-01-15", "Whole Milk", "12.5", "8.3", "10.2", "31.0", "5.0"));
        milkRecordList.add(new MilkRecord("2024-01-14", "Whole Milk", "11.8", "7.9", "9.8", "29.5", "4.5"));
        milkRecordList.add(new MilkRecord("2024-01-13", "Skimmed Milk", "10.5", "6.5", "8.5", "25.5", "3.0"));
        milkRecordList.add(new MilkRecord("2024-01-12", "Whole Milk", "13.2", "9.1", "11.0", "33.3", "6.0"));
        milkRecordList.add(new MilkRecord("2024-01-11", "Whole Milk", "12.0", "8.0", "9.5", "29.5", "4.0"));

        // Setup RecyclerView
        milkRecordsRecyclerView = findViewById(R.id.milk_records_recycler_view);
        milkRecordsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        milkRecordAdapter = new MilkRecordAdapter(milkRecordList);
        milkRecordsRecyclerView.setAdapter(milkRecordAdapter);

        // Add Milk Record button
        findViewById(R.id.add_milk_record_button).setOnClickListener(v -> {
            Intent intent = new Intent(MilkRecordsListActivity.this, NewMilkRecordActivity.class);
            startActivity(intent);
        });
    }

    // Milk Record data model
    public static class MilkRecord {
        private String date;
        private String milkType;
        private String amTotal;
        private String noonTotal;
        private String pmTotal;
        private String totalProduced;
        private String totalUsed;

        public MilkRecord(String date, String milkType, String amTotal, String noonTotal, 
                         String pmTotal, String totalProduced, String totalUsed) {
            this.date = date;
            this.milkType = milkType;
            this.amTotal = amTotal;
            this.noonTotal = noonTotal;
            this.pmTotal = pmTotal;
            this.totalProduced = totalProduced;
            this.totalUsed = totalUsed;
        }

        public String getDate() { return date; }
        public String getMilkType() { return milkType; }
        public String getAmTotal() { return amTotal; }
        public String getNoonTotal() { return noonTotal; }
        public String getPmTotal() { return pmTotal; }
        public String getTotalProduced() { return totalProduced; }
        public String getTotalUsed() { return totalUsed; }
    }
}

