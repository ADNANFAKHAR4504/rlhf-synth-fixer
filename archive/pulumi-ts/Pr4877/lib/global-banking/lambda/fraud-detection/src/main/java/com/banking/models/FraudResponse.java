package com.banking.models;

import java.util.ArrayList;
import java.util.List;

/**
 * Model representing the fraud detection response
 */
public class FraudResponse {
    private String transactionId;
    private double fraudScore;
    private double mlScore;
    private String riskLevel; // LOW, MEDIUM, HIGH
    private boolean approved;
    private boolean requiresManualReview;
    private List<String> reasons;
    private RiskFactors riskFactors;
    private String timestamp;
    private long processingTimeMs;
    
    public FraudResponse() {
        this.reasons = new ArrayList<>();
        this.requiresManualReview = false;
    }
    
    // Getters and Setters
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public double getFraudScore() {
        return fraudScore;
    }
    
    public void setFraudScore(double fraudScore) {
        this.fraudScore = fraudScore;
    }
    
    public double getMlScore() {
        return mlScore;
    }
    
    public void setMlScore(double mlScore) {
        this.mlScore = mlScore;
    }
    
    public String getRiskLevel() {
        return riskLevel;
    }
    
    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
    
    public boolean isApproved() {
        return approved;
    }
    
    public void setApproved(boolean approved) {
        this.approved = approved;
    }
    
    public boolean isRequiresManualReview() {
        return requiresManualReview;
    }
    
    public void setRequiresManualReview(boolean requiresManualReview) {
        this.requiresManualReview = requiresManualReview;
    }
    
    public List<String> getReasons() {
        return reasons;
    }
    
    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }
    
    public void addReason(String reason) {
        this.reasons.add(reason);
    }
    
    public RiskFactors getRiskFactors() {
        return riskFactors;
    }
    
    public void setRiskFactors(RiskFactors riskFactors) {
        this.riskFactors = riskFactors;
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
    
    @Override
    public String toString() {
        return "FraudResponse{" +
                "transactionId='" + transactionId + '\'' +
                ", fraudScore=" + fraudScore +
                ", riskLevel='" + riskLevel + '\'' +
                ", approved=" + approved +
                ", requiresManualReview=" + requiresManualReview +
                ", reasons=" + reasons +
                ", processingTimeMs=" + processingTimeMs +
                '}';
    }
}
