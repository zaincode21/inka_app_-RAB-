package com.example.inka_app_v01;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class MilkRecordAdapter extends RecyclerView.Adapter<MilkRecordAdapter.MilkRecordViewHolder> {

    private List<MilkRecordsListActivity.MilkRecord> milkRecordList;

    public MilkRecordAdapter(List<MilkRecordsListActivity.MilkRecord> milkRecordList) {
        this.milkRecordList = milkRecordList;
    }

    @NonNull
    @Override
    public MilkRecordViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_milk_record, parent, false);
        return new MilkRecordViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MilkRecordViewHolder holder, int position) {
        MilkRecordsListActivity.MilkRecord record = milkRecordList.get(position);
        holder.dateText.setText(record.getDate());
        holder.milkTypeText.setText(record.getMilkType());
        holder.amTotalText.setText(record.getAmTotal() + " L");
        holder.noonTotalText.setText(record.getNoonTotal() + " L");
        holder.pmTotalText.setText(record.getPmTotal() + " L");
        holder.totalProducedText.setText(record.getTotalProduced() + " L");
        holder.totalUsedText.setText(record.getTotalUsed() + " L");
    }

    @Override
    public int getItemCount() {
        return milkRecordList.size();
    }

    static class MilkRecordViewHolder extends RecyclerView.ViewHolder {
        TextView dateText;
        TextView milkTypeText;
        TextView amTotalText;
        TextView noonTotalText;
        TextView pmTotalText;
        TextView totalProducedText;
        TextView totalUsedText;

        public MilkRecordViewHolder(@NonNull View itemView) {
            super(itemView);
            dateText = itemView.findViewById(R.id.record_date);
            milkTypeText = itemView.findViewById(R.id.milk_type);
            amTotalText = itemView.findViewById(R.id.am_total);
            noonTotalText = itemView.findViewById(R.id.noon_total);
            pmTotalText = itemView.findViewById(R.id.pm_total);
            totalProducedText = itemView.findViewById(R.id.total_produced);
            totalUsedText = itemView.findViewById(R.id.total_used);
        }
    }
}

