package com.example.inka_app_v01;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class CattleAdapter extends RecyclerView.Adapter<CattleAdapter.CattleViewHolder> {

    private List<CattleListActivity.Cattle> cattleList;

    public CattleAdapter(List<CattleListActivity.Cattle> cattleList) {
        this.cattleList = cattleList;
    }

    @NonNull
    @Override
    public CattleViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_cattle, parent, false);
        return new CattleViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CattleViewHolder holder, int position) {
        CattleListActivity.Cattle cattle = cattleList.get(position);
        holder.idText.setText(cattle.getId());
        holder.nameText.setText(cattle.getName());
        holder.typeText.setText(cattle.getType());
        holder.breedText.setText(cattle.getBreed());
        holder.statusText.setText(cattle.getStatus());
        holder.dateOfBirthText.setText(cattle.getDateOfBirth());
    }

    @Override
    public int getItemCount() {
        return cattleList.size();
    }

    static class CattleViewHolder extends RecyclerView.ViewHolder {
        TextView idText;
        TextView nameText;
        TextView typeText;
        TextView breedText;
        TextView statusText;
        TextView dateOfBirthText;

        public CattleViewHolder(@NonNull View itemView) {
            super(itemView);
            idText = itemView.findViewById(R.id.cattle_id);
            nameText = itemView.findViewById(R.id.cattle_name);
            typeText = itemView.findViewById(R.id.cattle_type);
            breedText = itemView.findViewById(R.id.cattle_breed);
            statusText = itemView.findViewById(R.id.cattle_status);
            dateOfBirthText = itemView.findViewById(R.id.cattle_date_of_birth);
        }
    }
}

