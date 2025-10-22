package com.banking.models;

import java.util.List;

/**
 * Model representing a transaction response
 */
public class TransactionResponse {
    private String transactionId;
    private String status; // APPROVED, REJECTED, PENDING_REVIEW
    private String message;
    private double amount;
    private String currency;
    private double fraudScore;
    private List<String> reasons;
    private String timestamp;
    private long processingTimeMs;
    private String estimatedReviewTime;
    
    // Getters and Setters
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
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
    
    public double getFraudScore() {
        return fraudScore;
    }
    
    public void setFraudScore(double fraudScore) {
        this.fraudScore = fraudScore;
    }
    
    public List<String> getReasons() {
        return reasons;
    }
    
    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public long getProcessingTimeMs() {
        return processingTimeMs;
    }
    
    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
    
    public String getEstimatedReviewTime() {
        return estimatedReviewTime;
    }
    
    public void setEstimatedReviewTime(String estimatedReviewTime) {
        this.estimatedReviewTime = estimatedReviewTime;
    }
}
