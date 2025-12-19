package com.banking;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.banking.models.TransactionEvent;
import com.banking.models.FraudResponse;
import com.banking.models.RiskFactors;
import com.banking.services.FraudDetectorService;
import com.banking.services.RiskAnalysisService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.MetricDatum;
import software.amazon.awssdk.services.cloudwatch.model.StandardUnit;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

/**
 * AWS Lambda handler for real-time fraud detection in global banking transactions.
 * 
 * This handler processes payment transactions and performs multi-layered fraud analysis including:
 * - AWS Fraud Detector ML model predictions
 * - Velocity checks (transaction frequency)
 * - Geographic anomaly detection
 * - Amount anomaly detection
 * - Device fingerprinting
 * - Historical behavior analysis
 * 
 * @author Banking Platform Team
 * @version 1.0.0
 */
public class FraudDetectionHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static final String ENVIRONMENT = System.getenv("ENVIRONMENT");
    private static final String FRAUD_DETECTOR_NAME = System.getenv("FRAUD_DETECTOR_NAME");
    
    // Fraud thresholds
    private static final double HIGH_RISK_THRESHOLD = 0.75;
    private static final double MEDIUM_RISK_THRESHOLD = 0.45;
    private static final int MAX_TRANSACTIONS_PER_HOUR = 10;
    private static final double AMOUNT_ANOMALY_MULTIPLIER = 5.0;
    
    private final FraudDetectorService fraudDetectorService;
    private final RiskAnalysisService riskAnalysisService;
    private final DynamoDbClient dynamoDbClient;
    private final CloudWatchClient cloudWatchClient;
    
    /**
     * Default constructor - initializes AWS service clients
     */
    public FraudDetectionHandler() {
        this.fraudDetectorService = new FraudDetectorService(FRAUD_DETECTOR_NAME);
        this.riskAnalysisService = new RiskAnalysisService();
        this.dynamoDbClient = DynamoDbClient.builder().build();
        this.cloudWatchClient = CloudWatchClient.builder().build();
    }
    
    /**
     * Constructor for dependency injection (testing)
     */
    public FraudDetectionHandler(FraudDetectorService fraudDetectorService,
                                  RiskAnalysisService riskAnalysisService,
                                  DynamoDbClient dynamoDbClient,
                                  CloudWatchClient cloudWatchClient) {
        this.fraudDetectorService = fraudDetectorService;
        this.riskAnalysisService = riskAnalysisService;
        this.dynamoDbClient = dynamoDbClient;
        this.cloudWatchClient = cloudWatchClient;
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        LambdaLogger logger = context.getLogger();
        String requestId = context.getRequestId();
        
        logger.log("Starting fraud detection - RequestId: " + requestId);
        
        Subsegment subsegment = AWSXRay.beginSubsegment("FraudDetection");
        
        try {
            // Parse transaction event
            TransactionEvent transaction = parseTransactionEvent(input, logger);
            subsegment.putMetadata("transaction", transaction);
            
            logger.log("Processing transaction: " + transaction.getTransactionId() + 
                      " | Amount: " + transaction.getAmount() + " " + transaction.getCurrency() +
                      " | Customer: " + transaction.getCustomerId());
            
            // Perform fraud analysis
            FraudResponse fraudResponse = analyzeFraud(transaction, logger);
            
            // Log metrics to CloudWatch
            publishMetrics(fraudResponse, transaction);
            
            // Store fraud decision in DynamoDB
            storeFraudDecision(transaction, fraudResponse);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("statusCode", 200);
            response.put("transactionId", transaction.getTransactionId());
            response.put("fraudScore", fraudResponse.getFraudScore());
            response.put("riskLevel", fraudResponse.getRiskLevel());
            response.put("approved", fraudResponse.isApproved());
            response.put("reasons", fraudResponse.getReasons());
            response.put("requiresManualReview", fraudResponse.isRequiresManualReview());
            response.put("processingTimeMs", fraudResponse.getProcessingTimeMs());
            
            logger.log("Fraud detection completed - Score: " + fraudResponse.getFraudScore() + 
                      " | Approved: " + fraudResponse.isApproved());
            
            subsegment.putMetadata("response", response);
            return response;
            
        } catch (Exception e) {
            logger.log("ERROR in fraud detection: " + e.getMessage());
            subsegment.addException(e);
            
            // Return error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("statusCode", 500);
            errorResponse.put("error", "Fraud detection failed");
            errorResponse.put("message", e.getMessage());
            
            return errorResponse;
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Parse and validate the transaction event from input
     */
    private TransactionEvent parseTransactionEvent(Map<String, Object> input, LambdaLogger logger) {
        try {
            // Handle API Gateway proxy integration format
            if (input.containsKey("body")) {
                String body = (String) input.get("body");
                return gson.fromJson(body, TransactionEvent.class);
            } else {
                // Direct invocation format
                return gson.fromJson(gson.toJson(input), TransactionEvent.class);
            }
        } catch (Exception e) {
            logger.log("ERROR parsing transaction: " + e.getMessage());
            throw new IllegalArgumentException("Invalid transaction format", e);
        }
    }
    
    /**
     * Perform comprehensive fraud analysis on the transaction
     */
    private FraudResponse analyzeFraud(TransactionEvent transaction, LambdaLogger logger) {
        long startTime = System.currentTimeMillis();
        
        FraudResponse response = new FraudResponse();
        response.setTransactionId(transaction.getTransactionId());
        response.setTimestamp(Instant.now().toString());
        
        try {
            // 1. Get ML-based prediction from AWS Fraud Detector
            Subsegment mlSubsegment = AWSXRay.beginSubsegment("MLPrediction");
            double mlFraudScore = fraudDetectorService.getPrediction(transaction);
            mlSubsegment.putMetadata("mlScore", mlFraudScore);
            AWSXRay.endSubsegment();
            
            logger.log("ML Fraud Score: " + mlFraudScore);
            
            // 2. Perform rule-based risk analysis
            Subsegment riskSubsegment = AWSXRay.beginSubsegment("RiskAnalysis");
            RiskFactors riskFactors = riskAnalysisService.analyzeRisk(transaction, dynamoDbClient);
            AWSXRay.endSubsegment();
            
            logger.log("Risk Factors - Velocity: " + riskFactors.getVelocityRisk() + 
                      " | Geo: " + riskFactors.getGeoRisk() +
                      " | Amount: " + riskFactors.getAmountRisk());
            
            // 3. Calculate composite fraud score
            double compositeFraudScore = calculateCompositeFraudScore(
                mlFraudScore, 
                riskFactors
            );
            
            response.setFraudScore(compositeFraudScore);
            response.setMlScore(mlFraudScore);
            response.setRiskFactors(riskFactors);
            
            // 4. Determine risk level and approval
            String riskLevel;
            boolean approved;
            boolean requiresManualReview = false;
            
            if (compositeFraudScore >= HIGH_RISK_THRESHOLD) {
                riskLevel = "HIGH";
                approved = false;
                response.addReason("High fraud score detected (" + 
                                  String.format("%.2f", compositeFraudScore) + ")");
            } else if (compositeFraudScore >= MEDIUM_RISK_THRESHOLD) {
                riskLevel = "MEDIUM";
                approved = false;
                requiresManualReview = true;
                response.addReason("Medium fraud score - manual review required (" + 
                                  String.format("%.2f", compositeFraudScore) + ")");
            } else {
                riskLevel = "LOW";
                approved = true;
            }
            
            // 5. Add specific risk factor reasons
            if (riskFactors.getVelocityRisk() > 0.5) {
                response.addReason("Unusual transaction velocity detected");
            }
            if (riskFactors.getGeoRisk() > 0.5) {
                response.addReason("Geographic anomaly detected");
            }
            if (riskFactors.getAmountRisk() > 0.5) {
                response.addReason("Transaction amount anomaly detected");
            }
            if (riskFactors.isNewDevice()) {
                response.addReason("New device detected");
            }
            if (riskFactors.isHighRiskCountry()) {
                response.addReason("Transaction from high-risk country");
            }
            
            response.setRiskLevel(riskLevel);
            response.setApproved(approved);
            response.setRequiresManualReview(requiresManualReview);
            
            long endTime = System.currentTimeMillis();
            response.setProcessingTimeMs(endTime - startTime);
            
            return response;
            
        } catch (Exception e) {
            logger.log("ERROR in fraud analysis: " + e.getMessage());
            
            // Fail-open strategy for production availability
            response.setFraudScore(0.5);
            response.setRiskLevel("MEDIUM");
            response.setApproved(false);
            response.setRequiresManualReview(true);
            response.addReason("Fraud detection service error - manual review required");
            
            long endTime = System.currentTimeMillis();
            response.setProcessingTimeMs(endTime - startTime);
            
            return response;
        }
    }
    
    /**
     * Calculate composite fraud score from ML prediction and rule-based risk factors
     */
    private double calculateCompositeFraudScore(double mlScore, RiskFactors riskFactors) {
        // Weighted scoring model
        double mlWeight = 0.50;          // 50% ML model
        double velocityWeight = 0.20;    // 20% velocity risk
        double geoWeight = 0.15;         // 15% geographic risk
        double amountWeight = 0.10;      // 10% amount risk
        double deviceWeight = 0.05;      // 5% device risk
        
        double compositeScore = 
            (mlScore * mlWeight) +
            (riskFactors.getVelocityRisk() * velocityWeight) +
            (riskFactors.getGeoRisk() * geoWeight) +
            (riskFactors.getAmountRisk() * amountWeight) +
            (riskFactors.getDeviceRisk() * deviceWeight);
        
        // Apply multipliers for high-risk indicators
        if (riskFactors.isHighRiskCountry()) {
            compositeScore = Math.min(1.0, compositeScore * 1.3);
        }
        
        if (riskFactors.isVpnDetected()) {
            compositeScore = Math.min(1.0, compositeScore * 1.2);
        }
        
        return Math.min(1.0, Math.max(0.0, compositeScore));
    }
    
    /**
     * Store fraud decision in DynamoDB for audit trail
     */
    private void storeFraudDecision(TransactionEvent transaction, FraudResponse response) {
        try {
            Subsegment subsegment = AWSXRay.beginSubsegment("StoreFraudDecision");
            
            Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> item = new HashMap<>();
            item.put("transactionId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .s(transaction.getTransactionId()).build());
            item.put("customerId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .s(transaction.getCustomerId()).build());
            item.put("timestamp", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .s(response.getTimestamp()).build());
            item.put("fraudScore", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .n(String.valueOf(response.getFraudScore())).build());
            item.put("riskLevel", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .s(response.getRiskLevel()).build());
            item.put("approved", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .bool(response.isApproved()).build());
            item.put("amount", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder()
                .n(String.valueOf(transaction.getAmount())).build());
            
            dynamoDbClient.putItem(builder -> builder
                .tableName("fraud-decisions-" + ENVIRONMENT)
                .item(item)
            );
            
            AWSXRay.endSubsegment();
        } catch (Exception e) {
            // Log but don't fail - fraud decision is still returned
            System.err.println("Failed to store fraud decision: " + e.getMessage());
        }
    }
    
    /**
     * Publish fraud detection metrics to CloudWatch
     */
    private void publishMetrics(FraudResponse response, TransactionEvent transaction) {
        try {
            cloudWatchClient.putMetricData(PutMetricDataRequest.builder()
                .namespace("Banking/FraudDetection")
                .metricData(
                    MetricDatum.builder()
                        .metricName("FraudScore")
                        .value(response.getFraudScore())
                        .unit(StandardUnit.NONE)
                        .timestamp(Instant.now())
                        .build(),
                    MetricDatum.builder()
                        .metricName("ProcessingTime")
                        .value((double) response.getProcessingTimeMs())
                        .unit(StandardUnit.MILLISECONDS)
                        .timestamp(Instant.now())
                        .build(),
                    MetricDatum.builder()
                        .metricName(response.isApproved() ? "ApprovedTransactions" : "BlockedTransactions")
                        .value(1.0)
                        .unit(StandardUnit.COUNT)
                        .timestamp(Instant.now())
                        .build()
                )
                .build()
            );
        } catch (Exception e) {
            // Log but don't fail
            System.err.println("Failed to publish metrics: " + e.getMessage());
        }
    }
}
