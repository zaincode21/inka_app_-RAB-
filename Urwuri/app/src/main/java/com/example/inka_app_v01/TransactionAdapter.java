package com.example.inka_app_v01;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

public class TransactionAdapter extends RecyclerView.Adapter<TransactionAdapter.TransactionViewHolder> {

    private List<Transaction> transactionList;
    private NumberFormat currencyFormat;

    public TransactionAdapter(List<Transaction> transactionList) {
        this.transactionList = transactionList;
        this.currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);
    }

    @NonNull
    @Override
    public TransactionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_transaction, parent, false);
        return new TransactionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TransactionViewHolder holder, int position) {
        Transaction transaction = transactionList.get(position);
        holder.description.setText(transaction.getDescription());
        holder.date.setText(transaction.getDate());
        holder.icon.setImageResource(transaction.getIconResId());

        // Format amount with + or - sign
        String amountText;
        if (transaction.isIncome()) {
            amountText = "+" + currencyFormat.format(transaction.getAmount());
            holder.amount.setTextColor(holder.itemView.getContext().getResources().getColor(android.R.color.holo_green_dark, null));
        } else {
            amountText = "-" + currencyFormat.format(transaction.getAmount());
            holder.amount.setTextColor(holder.itemView.getContext().getResources().getColor(android.R.color.holo_red_dark, null));
        }
        holder.amount.setText(amountText);
    }

    @Override
    public int getItemCount() {
        return transactionList.size();
    }

    static class TransactionViewHolder extends RecyclerView.ViewHolder {
        ImageView icon;
        TextView description;
        TextView date;
        TextView amount;

        TransactionViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.transaction_icon);
            description = itemView.findViewById(R.id.transaction_description);
            date = itemView.findViewById(R.id.transaction_date);
            amount = itemView.findViewById(R.id.transaction_amount);
        }
    }
}

