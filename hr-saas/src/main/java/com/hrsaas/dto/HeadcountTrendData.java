package com.hrsaas.dto;

import java.util.List;

/**
 * Data transfer object for headcount trend data showing hires and separations over time.
 */
public class HeadcountTrendData {
    private List<TrendDataPoint> hires;
    private List<TrendDataPoint> separations;

    public HeadcountTrendData(List<TrendDataPoint> hires, List<TrendDataPoint> separations) {
        this.hires = hires;
        this.separations = separations;
    }

    public List<TrendDataPoint> getHires() {
        return hires;
    }

    public void setHires(List<TrendDataPoint> hires) {
        this.hires = hires;
    }

    public List<TrendDataPoint> getSeparations() {
        return separations;
    }

    public void setSeparations(List<TrendDataPoint> separations) {
        this.separations = separations;
    }
}