package com.banking.models;

import java.util.ArrayList;
import java.util.List;

/**
 * Model representing fraud check result from fraud detection Lambda
 */
public class FraudCheckResult {
    private String transactionId;
    private double fraudScore;
    private String riskLevel;
    private boolean approved;
    private boolean requiresManualReview;
    private List<String> reasons;
    
    public FraudCheckResult() {
        this.reasons = new ArrayList<>();
    }
    
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
}
