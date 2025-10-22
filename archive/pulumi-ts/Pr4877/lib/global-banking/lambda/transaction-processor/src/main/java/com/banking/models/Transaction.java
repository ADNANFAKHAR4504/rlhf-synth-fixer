package com.banking.models;

/**
 * Model representing a transaction record (for DynamoDB storage)
 */
public class Transaction {
    private String transactionId;
    private String customerId;
    private double amount;
    private String currency;
    private String type;
    private String status;
    private String description;
    private String merchantId;
    private String merchantName;
    private String fromAccountId;
    private String toAccountId;
    private String sourceCountry;
    private String ipAddress;
    private String deviceId;
    private double fraudScore;
    private String fraudRiskLevel;
    private long timestamp;
    private String createdAt;
    private String updatedAt;
    
    // Getters and Setters
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public double getAmount() {
        return amount;
    }
    
    public void setAmount(double amount) {
        this.amount = amount;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getMerchantId() {
        return merchantId;
    }
    
    public void setMerchantId(String merchantId) {
        this.merchantId = merchantId;
    }
    
    public String getMerchantName() {
        return merchantName;
    }
    
    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }
    
    public String getFromAccountId() {
        return fromAccountId;
    }
    
    public void setFromAccountId(String fromAccountId) {
        this.fromAccountId = fromAccountId;
    }
    
    public String getToAccountId() {
        return toAccountId;
    }
    
    public void setToAccountId(String toAccountId) {
        this.toAccountId = toAccountId;
    }
    
    public String getSourceCountry() {
        return sourceCountry;
    }
    
    public void setSourceCountry(String sourceCountry) {
        this.sourceCountry = sourceCountry;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public double getFraudScore() {
        return fraudScore;
    }
    
    public void setFraudScore(double fraudScore) {
        this.fraudScore = fraudScore;
    }
    
    public String getFraudRiskLevel() {
        return fraudRiskLevel;
    }
    
    public void setFraudRiskLevel(String fraudRiskLevel) {
        this.fraudRiskLevel = fraudRiskLevel;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
