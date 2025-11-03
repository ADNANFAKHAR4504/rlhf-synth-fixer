package com.banking.models;

import java.util.Map;

/**
 * Model representing a banking transaction event for fraud analysis
 */
public class TransactionEvent {
    private String transactionId;
    private String customerId;
    private double amount;
    private String currency;
    private String merchantId;
    private String merchantName;
    private String merchantCategory;
    private String sourceCountry;
    private String destinationCountry;
    private String ipAddress;
    private String deviceId;
    private String deviceFingerprint;
    private String userAgent;
    private String paymentMethod;
    private String cardLast4;
    private String cardBin;
    private long timestamp;
    private String transactionType; // PURCHASE, WITHDRAWAL, TRANSFER
    private Map<String, String> metadata;
    
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
    
    public String getMerchantCategory() {
        return merchantCategory;
    }
    
    public void setMerchantCategory(String merchantCategory) {
        this.merchantCategory = merchantCategory;
    }
    
    public String getSourceCountry() {
        return sourceCountry;
    }
    
    public void setSourceCountry(String sourceCountry) {
        this.sourceCountry = sourceCountry;
    }
    
    public String getDestinationCountry() {
        return destinationCountry;
    }
    
    public void setDestinationCountry(String destinationCountry) {
        this.destinationCountry = destinationCountry;
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
    
    public String getDeviceFingerprint() {
        return deviceFingerprint;
    }
    
    public void setDeviceFingerprint(String deviceFingerprint) {
        this.deviceFingerprint = deviceFingerprint;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getCardLast4() {
        return cardLast4;
    }
    
    public void setCardLast4(String cardLast4) {
        this.cardLast4 = cardLast4;
    }
    
    public String getCardBin() {
        return cardBin;
    }
    
    public void setCardBin(String cardBin) {
        this.cardBin = cardBin;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getTransactionType() {
        return transactionType;
    }
    
    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }
    
    public Map<String, String> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
    
    @Override
    public String toString() {
        return "TransactionEvent{" +
                "transactionId='" + transactionId + '\'' +
                ", customerId='" + customerId + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", merchantId='" + merchantId + '\'' +
                ", sourceCountry='" + sourceCountry + '\'' +
                ", destinationCountry='" + destinationCountry + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
