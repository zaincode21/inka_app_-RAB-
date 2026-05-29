package com.example.inka_app_v01;

public class Transaction {
    private String description;
    private String date;
    private double amount;
    private boolean isIncome;
    private int iconResId;

    public Transaction(String description, String date, double amount, boolean isIncome, int iconResId) {
        this.description = description;
        this.date = date;
        this.amount = amount;
        this.isIncome = isIncome;
        this.iconResId = iconResId;
    }

    public String getDescription() {
        return description;
    }

    public String getDate() {
        return date;
    }

    public double getAmount() {
        return amount;
    }

    public boolean isIncome() {
        return isIncome;
    }

    public int getIconResId() {
        return iconResId;
    }
}

