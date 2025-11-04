package com.banking.services;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.banking.models.TransactionEvent;
import software.amazon.awssdk.services.frauddetector.FraudDetectorClient;
import software.amazon.awssdk.services.frauddetector.model.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for interacting with AWS Fraud Detector ML service
 */
public class FraudDetectorService {
    
    private final FraudDetectorClient fraudDetectorClient;
    private final String detectorName;
    
    // High-risk countries based on fraud patterns (example list)
    private static final String[] HIGH_RISK_COUNTRIES = {
        "NG", "GH", "ID", "PK", "BD", "VN", "KE", "MA", "RO", "TR"
    };
    
    public FraudDetectorService(String detectorName) {
        this.fraudDetectorClient = FraudDetectorClient.builder().build();
        this.detectorName = detectorName;
    }
    
    /**
     * Get fraud prediction from AWS Fraud Detector ML model
     * 
     * @param transaction The transaction to analyze
     * @return Fraud score between 0.0 (legitimate) and 1.0 (fraudulent)
     */
    public double getPrediction(TransactionEvent transaction) {
        Subsegment subsegment = AWSXRay.beginSubsegment("FraudDetectorPrediction");
        
        try {
            // Prepare event variables for AWS Fraud Detector
            Map<String, String> eventVariables = prepareEventVariables(transaction);
            
            // Call AWS Fraud Detector
            GetEventPredictionRequest request = GetEventPredictionRequest.builder()
                .detectorId(detectorName)
                .detectorVersionId("1.0")
                .eventId(transaction.getTransactionId())
                .eventTypeName("online_payment_fraud")
                .eventTimestamp(String.valueOf(System.currentTimeMillis()))
                .entities(
                    Entity.builder()
                        .entityType("customer")
                        .entityId(transaction.getCustomerId())
                        .build()
                )
                .eventVariables(eventVariables)
                .build();
            
            GetEventPredictionResponse response = fraudDetectorClient.getEventPrediction(request);
            
            // Extract fraud score from model outputs
            double fraudScore = extractFraudScore(response);
            
            subsegment.putMetadata("fraudScore", fraudScore);
            subsegment.putMetadata("ruleResults", response.ruleResults());
            
            return fraudScore;
            
        } catch (ResourceNotFoundException e) {
            // Fraud Detector not configured - return medium risk
            System.err.println("Fraud Detector not found: " + detectorName + " - using fallback");
            subsegment.addException(e);
            return 0.5;
            
        } catch (Exception e) {
            // On error, return medium risk score (fail-safe)
            System.err.println("Error calling Fraud Detector: " + e.getMessage());
            subsegment.addException(e);
            return 0.5;
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Prepare event variables for AWS Fraud Detector
     */
    private Map<String, String> prepareEventVariables(TransactionEvent transaction) {
        Map<String, String> variables = new HashMap<>();
        
        // Transaction details
        variables.put("transaction_amount", String.valueOf(transaction.getAmount()));
        variables.put("currency", transaction.getCurrency());
        variables.put("payment_method", transaction.getPaymentMethod());
        variables.put("transaction_type", transaction.getTransactionType());
        
        // Customer information
        variables.put("customer_id", transaction.getCustomerId());
        
        // Merchant information
        if (transaction.getMerchantId() != null) {
            variables.put("merchant_id", transaction.getMerchantId());
        }
        if (transaction.getMerchantCategory() != null) {
            variables.put("merchant_category", transaction.getMerchantCategory());
        }
        
        // Geographic information
        if (transaction.getSourceCountry() != null) {
            variables.put("source_country", transaction.getSourceCountry());
            variables.put("is_high_risk_country", 
                String.valueOf(isHighRiskCountry(transaction.getSourceCountry())));
        }
        if (transaction.getDestinationCountry() != null) {
            variables.put("destination_country", transaction.getDestinationCountry());
        }
        
        // Device information
        if (transaction.getIpAddress() != null) {
            variables.put("ip_address", transaction.getIpAddress());
        }
        if (transaction.getDeviceId() != null) {
            variables.put("device_id", transaction.getDeviceId());
        }
        if (transaction.getDeviceFingerprint() != null) {
            variables.put("device_fingerprint", transaction.getDeviceFingerprint());
        }
        if (transaction.getUserAgent() != null) {
            variables.put("user_agent", transaction.getUserAgent());
        }
        
        // Card information
        if (transaction.getCardBin() != null) {
            variables.put("card_bin", transaction.getCardBin());
        }
        if (transaction.getCardLast4() != null) {
            variables.put("card_last4", transaction.getCardLast4());
        }
        
        return variables;
    }
    
    /**
     * Extract fraud score from AWS Fraud Detector response
     */
    private double extractFraudScore(GetEventPredictionResponse response) {
        // Check model scores
        if (response.hasModelScores() && !response.modelScores().isEmpty()) {
            for (ModelScores modelScore : response.modelScores()) {
                if (modelScore.hasScores()) {
                    for (Map.Entry<String, Float> entry : modelScore.scores().entrySet()) {
                        if (entry.getKey().equalsIgnoreCase("fraud_score") || 
                            entry.getKey().equalsIgnoreCase("fraud")) {
                            return entry.getValue().doubleValue();
                        }
                    }
                }
            }
        }
        
        // Fallback: analyze rule results
        if (response.hasRuleResults() && !response.ruleResults().isEmpty()) {
            int highRiskRules = 0;
            int totalRules = response.ruleResults().size();
            
            for (RuleResult ruleResult : response.ruleResults()) {
                if (ruleResult.outcomes() != null && 
                    ruleResult.outcomes().stream().anyMatch(o -> 
                        o.equalsIgnoreCase("block") || o.equalsIgnoreCase("review"))) {
                    highRiskRules++;
                }
            }
            
            return totalRules > 0 ? (double) highRiskRules / totalRules : 0.5;
        }
        
        // Default medium risk if no scores available
        return 0.5;
    }
    
    /**
     * Check if country is considered high-risk
     */
    private boolean isHighRiskCountry(String countryCode) {
        if (countryCode == null) return false;
        
        for (String highRiskCountry : HIGH_RISK_COUNTRIES) {
            if (highRiskCountry.equalsIgnoreCase(countryCode)) {
                return true;
            }
        }
        return false;
    }
}
