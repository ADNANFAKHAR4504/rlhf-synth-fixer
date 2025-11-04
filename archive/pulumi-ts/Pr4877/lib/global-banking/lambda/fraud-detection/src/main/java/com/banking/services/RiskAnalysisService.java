package com.banking.services;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.banking.models.TransactionEvent;
import com.banking.models.RiskFactors;
import com.banking.utils.GeoUtils;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.*;

/**
 * Service for rule-based risk analysis of transactions
 * Performs velocity checks, geographic analysis, and behavioral pattern detection
 */
public class RiskAnalysisService {
    
    private static final int MAX_TRANSACTIONS_PER_HOUR = 10;
    private static final int MAX_TRANSACTIONS_PER_DAY = 50;
    private static final double AMOUNT_ANOMALY_MULTIPLIER = 5.0;
    private static final double SUSPICIOUS_DISTANCE_KM = 500.0; // 500km in 1 hour is suspicious
    
    // High-risk countries (same as FraudDetectorService for consistency)
    private static final Set<String> HIGH_RISK_COUNTRIES = new HashSet<>(Arrays.asList(
        "NG", "GH", "ID", "PK", "BD", "VN", "KE", "MA", "RO", "TR"
    ));
    
    /**
     * Analyze risk factors for a transaction
     */
    public RiskFactors analyzeRisk(TransactionEvent transaction, DynamoDbClient dynamoDbClient) {
        Subsegment subsegment = AWSXRay.beginSubsegment("RiskAnalysis");
        
        try {
            RiskFactors riskFactors = new RiskFactors();
            
            // Get customer transaction history
            CustomerHistory history = getCustomerHistory(
                transaction.getCustomerId(), 
                dynamoDbClient
            );
            
            // 1. Velocity Risk Analysis
            double velocityRisk = calculateVelocityRisk(transaction, history);
            riskFactors.setVelocityRisk(velocityRisk);
            riskFactors.setTransactionsLastHour(history.getTransactionsLastHour());
            riskFactors.setTransactionsLast24Hours(history.getTransactionsLast24Hours());
            
            // 2. Geographic Risk Analysis
            double geoRisk = calculateGeographicRisk(transaction, history);
            riskFactors.setGeoRisk(geoRisk);
            riskFactors.setDistanceFromLastTransaction(history.getDistanceFromLast());
            
            // 3. Amount Risk Analysis
            double amountRisk = calculateAmountRisk(transaction, history);
            riskFactors.setAmountRisk(amountRisk);
            riskFactors.setAvgTransactionAmount(history.getAvgAmount());
            
            // 4. Device Risk Analysis
            double deviceRisk = calculateDeviceRisk(transaction, history);
            riskFactors.setDeviceRisk(deviceRisk);
            riskFactors.setNewDevice(history.isNewDevice());
            
            // 5. Country Risk
            riskFactors.setHighRiskCountry(
                isHighRiskCountry(transaction.getSourceCountry())
            );
            
            // 6. VPN/Proxy Detection (simplified)
            riskFactors.setVpnDetected(detectVpnProxy(transaction.getIpAddress()));
            
            // 7. Customer Age Analysis
            riskFactors.setDaysSinceFirstTransaction(history.getDaysSinceFirst());
            
            // 8. Behavior Pattern
            String behaviorPattern = determineBehaviorPattern(riskFactors);
            riskFactors.setBehaviorPattern(behaviorPattern);
            
            subsegment.putMetadata("riskFactors", riskFactors);
            
            return riskFactors;
            
        } catch (Exception e) {
            System.err.println("Error in risk analysis: " + e.getMessage());
            subsegment.addException(e);
            
            // Return default medium risk on error
            RiskFactors defaultRisk = new RiskFactors();
            defaultRisk.setVelocityRisk(0.5);
            defaultRisk.setGeoRisk(0.5);
            defaultRisk.setAmountRisk(0.5);
            defaultRisk.setDeviceRisk(0.5);
            return defaultRisk;
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Calculate velocity risk based on transaction frequency
     */
    private double calculateVelocityRisk(TransactionEvent transaction, CustomerHistory history) {
        int txnLastHour = history.getTransactionsLastHour();
        int txnLast24Hours = history.getTransactionsLast24Hours();
        
        double hourlyRisk = Math.min(1.0, (double) txnLastHour / MAX_TRANSACTIONS_PER_HOUR);
        double dailyRisk = Math.min(1.0, (double) txnLast24Hours / MAX_TRANSACTIONS_PER_DAY);
        
        // Weight recent activity more heavily
        return (hourlyRisk * 0.7) + (dailyRisk * 0.3);
    }
    
    /**
     * Calculate geographic risk based on location patterns
     */
    private double calculateGeographicRisk(TransactionEvent transaction, CustomerHistory history) {
        double risk = 0.0;
        
        // Check for high-risk country
        if (isHighRiskCountry(transaction.getSourceCountry())) {
            risk += 0.3;
        }
        
        // Check distance from last transaction
        double distance = history.getDistanceFromLast();
        if (distance > SUSPICIOUS_DISTANCE_KM && history.getMinutesSinceLastTxn() < 60) {
            // Impossible travel: >500km in less than 1 hour
            risk += 0.5;
        } else if (distance > 1000) {
            // Large distance but possible
            risk += 0.2;
        }
        
        // Check if country different from usual
        if (history.getUsualCountry() != null && 
            !history.getUsualCountry().equals(transaction.getSourceCountry())) {
            risk += 0.2;
        }
        
        return Math.min(1.0, risk);
    }
    
    /**
     * Calculate amount risk based on historical patterns
     */
    private double calculateAmountRisk(TransactionEvent transaction, CustomerHistory history) {
        double amount = transaction.getAmount();
        double avgAmount = history.getAvgAmount();
        
        if (avgAmount == 0) {
            // No history - new customer
            if (amount > 1000) {
                return 0.7; // High first transaction is risky
            }
            return 0.3; // Moderate risk for new customer
        }
        
        double ratio = amount / avgAmount;
        
        if (ratio > AMOUNT_ANOMALY_MULTIPLIER) {
            // Transaction is 5x+ the average
            return 0.8;
        } else if (ratio > 3.0) {
            // Transaction is 3x+ the average
            return 0.5;
        } else if (ratio > 2.0) {
            // Transaction is 2x+ the average
            return 0.3;
        }
        
        return 0.1; // Normal amount
    }
    
    /**
     * Calculate device risk
     */
    private double calculateDeviceRisk(TransactionEvent transaction, CustomerHistory history) {
        double risk = 0.0;
        
        if (history.isNewDevice()) {
            risk += 0.4;
        }
        
        if (transaction.getUserAgent() != null && 
            transaction.getUserAgent().toLowerCase().contains("bot")) {
            risk += 0.3;
        }
        
        // Check if device ID is suspicious (null or invalid)
        if (transaction.getDeviceId() == null || transaction.getDeviceId().isEmpty()) {
            risk += 0.2;
        }
        
        return Math.min(1.0, risk);
    }
    
    /**
     * Determine overall behavior pattern
     */
    private String determineBehaviorPattern(RiskFactors factors) {
        double avgRisk = (factors.getVelocityRisk() + 
                         factors.getGeoRisk() + 
                         factors.getAmountRisk() + 
                         factors.getDeviceRisk()) / 4.0;
        
        if (avgRisk > 0.6) {
            return "SUSPICIOUS";
        } else if (avgRisk > 0.4) {
            return "UNUSUAL";
        }
        return "NORMAL";
    }
    
    /**
     * Check if country is high-risk
     */
    private boolean isHighRiskCountry(String countryCode) {
        return countryCode != null && HIGH_RISK_COUNTRIES.contains(countryCode.toUpperCase());
    }
    
    /**
     * Detect VPN or proxy usage (simplified heuristic)
     */
    private boolean detectVpnProxy(String ipAddress) {
        if (ipAddress == null) return false;
        
        // Simple heuristics - in production, use a proper IP intelligence service
        // Check for known VPN/proxy IP ranges (simplified example)
        return ipAddress.startsWith("10.") || 
               ipAddress.startsWith("172.16.") || 
               ipAddress.startsWith("192.168.");
    }
    
    /**
     * Get customer transaction history from DynamoDB
     */
    private CustomerHistory getCustomerHistory(String customerId, DynamoDbClient dynamoDbClient) {
        CustomerHistory history = new CustomerHistory();
        
        try {
            long now = System.currentTimeMillis();
            long oneHourAgo = now - (60 * 60 * 1000);
            long oneDayAgo = now - (24 * 60 * 60 * 1000);
            
            String tableName = "transactions-" + System.getenv("ENVIRONMENT");
            
            // Query recent transactions for this customer
            QueryRequest queryRequest = QueryRequest.builder()
                .tableName(tableName)
                .indexName("customer-timestamp-index")
                .keyConditionExpression("customerId = :customerId AND #ts > :dayAgo")
                .expressionAttributeNames(Map.of("#ts", "timestamp"))
                .expressionAttributeValues(Map.of(
                    ":customerId", AttributeValue.builder().s(customerId).build(),
                    ":dayAgo", AttributeValue.builder().n(String.valueOf(oneDayAgo)).build()
                ))
                .limit(100)
                .build();
            
            QueryResponse response = dynamoDbClient.query(queryRequest);
            
            // Analyze transaction history
            int txnLastHour = 0;
            int txnLast24Hours = response.count();
            double totalAmount = 0.0;
            Set<String> devices = new HashSet<>();
            Map<String, Integer> countries = new HashMap<>();
            String lastCountry = null;
            double lastLat = 0.0;
            double lastLon = 0.0;
            long lastTimestamp = 0;
            long firstTimestamp = Long.MAX_VALUE;
            
            for (Map<String, AttributeValue> item : response.items()) {
                long timestamp = Long.parseLong(item.get("timestamp").n());
                
                if (timestamp > oneHourAgo) {
                    txnLastHour++;
                }
                
                if (item.containsKey("amount")) {
                    totalAmount += Double.parseDouble(item.get("amount").n());
                }
                
                if (item.containsKey("deviceId")) {
                    devices.add(item.get("deviceId").s());
                }
                
                if (item.containsKey("country")) {
                    String country = item.get("country").s();
                    countries.put(country, countries.getOrDefault(country, 0) + 1);
                    
                    if (timestamp > lastTimestamp) {
                        lastCountry = country;
                        lastTimestamp = timestamp;
                        
                        if (item.containsKey("latitude") && item.containsKey("longitude")) {
                            lastLat = Double.parseDouble(item.get("latitude").n());
                            lastLon = Double.parseDouble(item.get("longitude").n());
                        }
                    }
                }
                
                if (timestamp < firstTimestamp) {
                    firstTimestamp = timestamp;
                }
            }
            
            history.setTransactionsLastHour(txnLastHour);
            history.setTransactionsLast24Hours(txnLast24Hours);
            history.setAvgAmount(txnLast24Hours > 0 ? totalAmount / txnLast24Hours : 0.0);
            history.setNewDevice(devices.size() > 5); // Suspicious if many devices
            
            // Find most common country
            String usualCountry = null;
            int maxCount = 0;
            for (Map.Entry<String, Integer> entry : countries.entrySet()) {
                if (entry.getValue() > maxCount) {
                    maxCount = entry.getValue();
                    usualCountry = entry.getKey();
                }
            }
            history.setUsualCountry(usualCountry);
            
            // Calculate time since last transaction
            if (lastTimestamp > 0) {
                long minutesSinceLast = (now - lastTimestamp) / (60 * 1000);
                history.setMinutesSinceLastTxn((int) minutesSinceLast);
            }
            
            // Calculate days since first transaction
            if (firstTimestamp != Long.MAX_VALUE) {
                long daysSinceFirst = (now - firstTimestamp) / (24 * 60 * 60 * 1000);
                history.setDaysSinceFirst((int) daysSinceFirst);
            }
            
            // Calculate distance from last transaction (if coordinates available)
            // In production, you'd get current transaction coordinates and calculate
            history.setDistanceFromLast(0.0); // Placeholder
            
        } catch (Exception e) {
            System.err.println("Error fetching customer history: " + e.getMessage());
            // Return empty history on error
        }
        
        return history;
    }
    
    /**
     * Inner class to hold customer transaction history
     */
    private static class CustomerHistory {
        private int transactionsLastHour = 0;
        private int transactionsLast24Hours = 0;
        private double avgAmount = 0.0;
        private boolean newDevice = false;
        private String usualCountry = null;
        private double distanceFromLast = 0.0;
        private int minutesSinceLastTxn = Integer.MAX_VALUE;
        private int daysSinceFirst = 0;
        
        public int getTransactionsLastHour() { return transactionsLastHour; }
        public void setTransactionsLastHour(int n) { this.transactionsLastHour = n; }
        
        public int getTransactionsLast24Hours() { return transactionsLast24Hours; }
        public void setTransactionsLast24Hours(int n) { this.transactionsLast24Hours = n; }
        
        public double getAvgAmount() { return avgAmount; }
        public void setAvgAmount(double amt) { this.avgAmount = amt; }
        
        public boolean isNewDevice() { return newDevice; }
        public void setNewDevice(boolean b) { this.newDevice = b; }
        
        public String getUsualCountry() { return usualCountry; }
        public void setUsualCountry(String country) { this.usualCountry = country; }
        
        public double getDistanceFromLast() { return distanceFromLast; }
        public void setDistanceFromLast(double dist) { this.distanceFromLast = dist; }
        
        public int getMinutesSinceLastTxn() { return minutesSinceLastTxn; }
        public void setMinutesSinceLastTxn(int mins) { this.minutesSinceLastTxn = mins; }
        
        public int getDaysSinceFirst() { return daysSinceFirst; }
        public void setDaysSinceFirst(int days) { this.daysSinceFirst = days; }
    }
}
