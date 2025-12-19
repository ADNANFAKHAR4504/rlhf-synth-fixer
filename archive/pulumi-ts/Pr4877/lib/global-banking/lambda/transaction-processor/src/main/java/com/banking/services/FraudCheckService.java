package com.banking.services;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.banking.models.TransactionRequest;
import com.banking.models.FraudCheckResult;
import com.google.gson.Gson;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for invoking fraud detection Lambda
 */
public class FraudCheckService {
    
    private final LambdaClient lambdaClient;
    private final Gson gson;
    private final String fraudLambdaName;
    
    public FraudCheckService() {
        this.lambdaClient = LambdaClient.builder().build();
        this.gson = new Gson();
        this.fraudLambdaName = "fraud-detection-" + System.getenv("ENVIRONMENT");
    }
    
    /**
     * Call fraud detection Lambda to check transaction
     */
    public FraudCheckResult checkFraud(TransactionRequest request, String transactionId) {
        Subsegment subsegment = AWSXRay.beginSubsegment("InvokeFraudDetection");
        
        try {
            // Prepare payload for fraud detection Lambda
            Map<String, Object> payload = new HashMap<>();
            payload.put("transactionId", transactionId);
            payload.put("customerId", request.getCustomerId());
            payload.put("amount", request.getAmount());
            payload.put("currency", request.getCurrency());
            payload.put("merchantId", request.getMerchantId());
            payload.put("merchantName", request.getMerchantName());
            payload.put("merchantCategory", request.getMerchantCategory());
            payload.put("sourceCountry", request.getSourceCountry());
            payload.put("ipAddress", request.getIpAddress());
            payload.put("deviceId", request.getDeviceId());
            payload.put("deviceFingerprint", request.getDeviceFingerprint());
            payload.put("userAgent", request.getUserAgent());
            payload.put("paymentMethod", request.getPaymentMethod());
            payload.put("timestamp", System.currentTimeMillis());
            payload.put("transactionType", request.getType());
            
            String payloadJson = gson.toJson(payload);
            
            // Invoke fraud detection Lambda
            InvokeRequest invokeRequest = InvokeRequest.builder()
                .functionName(fraudLambdaName)
                .payload(SdkBytes.fromUtf8String(payloadJson))
                .build();
            
            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
            
            // Parse response
            String responseJson = invokeResponse.payload().asUtf8String();
            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = gson.fromJson(responseJson, Map.class);
            
            FraudCheckResult result = new FraudCheckResult();
            result.setTransactionId(transactionId);
            result.setFraudScore(((Number) responseMap.get("fraudScore")).doubleValue());
            result.setRiskLevel((String) responseMap.get("riskLevel"));
            result.setApproved((Boolean) responseMap.get("approved"));
            result.setRequiresManualReview((Boolean) responseMap.getOrDefault("requiresManualReview", false));
            
            @SuppressWarnings("unchecked")
            java.util.List<String> reasons = (java.util.List<String>) responseMap.get("reasons");
            if (reasons != null) {
                result.setReasons(reasons);
            }
            
            subsegment.putMetadata("fraudResult", result);
            
            return result;
            
        } catch (Exception e) {
            System.err.println("Error calling fraud detection: " + e.getMessage());
            subsegment.addException(e);
            
            // Return fail-safe result (requires manual review)
            FraudCheckResult fallbackResult = new FraudCheckResult();
            fallbackResult.setTransactionId(transactionId);
            fallbackResult.setFraudScore(0.5);
            fallbackResult.setRiskLevel("MEDIUM");
            fallbackResult.setApproved(false);
            fallbackResult.setRequiresManualReview(true);
            fallbackResult.getReasons().add("Fraud detection service unavailable - requires manual review");
            
            return fallbackResult;
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
}
