package com.banking.models;

/**
 * Model representing detailed risk factors for a transaction
 */
public class RiskFactors {
    private double velocityRisk;           // 0.0 - 1.0
    private double geoRisk;                // 0.0 - 1.0
    private double amountRisk;             // 0.0 - 1.0
    private double deviceRisk;             // 0.0 - 1.0
    private boolean newDevice;
    private boolean highRiskCountry;
    private boolean vpnDetected;
    private boolean proxyDetected;
    private int transactionsLastHour;
    private int transactionsLast24Hours;
    private double avgTransactionAmount;
    private double distanceFromLastTransaction; // in kilometers
    private int daysSinceFirstTransaction;
    private String behaviorPattern;         // NORMAL, SUSPICIOUS, UNUSUAL
    
    // Getters and Setters
    
    public double getVelocityRisk() {
        return velocityRisk;
    }
    
    public void setVelocityRisk(double velocityRisk) {
        this.velocityRisk = velocityRisk;
    }
    
    public double getGeoRisk() {
        return geoRisk;
    }
    
    public void setGeoRisk(double geoRisk) {
        this.geoRisk = geoRisk;
    }
    
    public double getAmountRisk() {
        return amountRisk;
    }
    
    public void setAmountRisk(double amountRisk) {
        this.amountRisk = amountRisk;
    }
    
    public double getDeviceRisk() {
        return deviceRisk;
    }
    
    public void setDeviceRisk(double deviceRisk) {
        this.deviceRisk = deviceRisk;
    }
    
    public boolean isNewDevice() {
        return newDevice;
    }
    
    public void setNewDevice(boolean newDevice) {
        this.newDevice = newDevice;
    }
    
    public boolean isHighRiskCountry() {
        return highRiskCountry;
    }
    
    public void setHighRiskCountry(boolean highRiskCountry) {
        this.highRiskCountry = highRiskCountry;
    }
    
    public boolean isVpnDetected() {
        return vpnDetected;
    }
    
    public void setVpnDetected(boolean vpnDetected) {
        this.vpnDetected = vpnDetected;
    }
    
    public boolean isProxyDetected() {
        return proxyDetected;
    }
    
    public void setProxyDetected(boolean proxyDetected) {
        this.proxyDetected = proxyDetected;
    }
    
    public int getTransactionsLastHour() {
        return transactionsLastHour;
    }
    
    public void setTransactionsLastHour(int transactionsLastHour) {
        this.transactionsLastHour = transactionsLastHour;
    }
    
    public int getTransactionsLast24Hours() {
        return transactionsLast24Hours;
    }
    
    public void setTransactionsLast24Hours(int transactionsLast24Hours) {
        this.transactionsLast24Hours = transactionsLast24Hours;
    }
    
    public double getAvgTransactionAmount() {
        return avgTransactionAmount;
    }
    
    public void setAvgTransactionAmount(double avgTransactionAmount) {
        this.avgTransactionAmount = avgTransactionAmount;
    }
    
    public double getDistanceFromLastTransaction() {
        return distanceFromLastTransaction;
    }
    
    public void setDistanceFromLastTransaction(double distanceFromLastTransaction) {
        this.distanceFromLastTransaction = distanceFromLastTransaction;
    }
    
    public int getDaysSinceFirstTransaction() {
        return daysSinceFirstTransaction;
    }
    
    public void setDaysSinceFirstTransaction(int daysSinceFirstTransaction) {
        this.daysSinceFirstTransaction = daysSinceFirstTransaction;
    }
    
    public String getBehaviorPattern() {
        return behaviorPattern;
    }
    
    public void setBehaviorPattern(String behaviorPattern) {
        this.behaviorPattern = behaviorPattern;
    }
    
    @Override
    public String toString() {
        return "RiskFactors{" +
                "velocityRisk=" + velocityRisk +
                ", geoRisk=" + geoRisk +
                ", amountRisk=" + amountRisk +
                ", deviceRisk=" + deviceRisk +
                ", newDevice=" + newDevice +
                ", highRiskCountry=" + highRiskCountry +
                ", transactionsLastHour=" + transactionsLastHour +
                ", distanceFromLastTransaction=" + distanceFromLastTransaction +
                '}';
    }
}
