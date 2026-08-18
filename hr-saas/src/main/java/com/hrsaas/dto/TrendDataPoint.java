package com.hrsaas.dto;

/**
 * Simple data point for trend charts with a label (usually date) and a value.
 */
public class TrendDataPoint {
    private String label;
    private int value;

    public TrendDataPoint(String label, int value) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }
}