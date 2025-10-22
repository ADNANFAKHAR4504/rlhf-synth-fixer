package com.banking.services;

import com.amazonaws.xray.AWSXRay;
import com.banking.models.Transaction;
import com.banking.models.FraudCheckResult;
import com.google.gson.Gson;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.kinesis.KinesisClient;
import software.amazon.awssdk.services.kinesis.model.PutRecordRequest;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.core.SdkBytes;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for transaction data persistence and messaging
 */
public class TransactionService {
    
    private final DynamoDbClient dynamoDbClient;
    private final KinesisClient kinesisClient;
    private final SqsClient sqsClient;
    private final Gson gson;
    private final String tableName;
    private final String streamName;
    private final String queueUrl;
    
    public TransactionService() {
        this.dynamoDbClient = DynamoDbClient.builder().build();
        this.kinesisClient = KinesisClient.builder().build();
        this.sqsClient = SqsClient.builder().build();
        this.gson = new Gson();
        
        String env = System.getenv("ENVIRONMENT");
        this.tableName = System.getenv().getOrDefault("DYNAMODB_TABLE", "transactions-" + env);
        this.streamName = System.getenv().getOrDefault("KINESIS_STREAM", "transactions-stream-" + env);
        this.queueUrl = System.getenv().getOrDefault("SQS_QUEUE_URL", 
            "https://sqs.us-east-1.amazonaws.com/123456789012/transactions-" + env);
    }
    
    /**
     * Save transaction to DynamoDB
     */
    public void saveTransaction(Transaction transaction) {
        var subsegment = AWSXRay.beginSubsegment("SaveTransaction");
        
        try {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("transactionId", AttributeValue.builder().s(transaction.getTransactionId()).build());
            item.put("customerId", AttributeValue.builder().s(transaction.getCustomerId()).build());
            item.put("amount", AttributeValue.builder().n(String.valueOf(transaction.getAmount())).build());
            item.put("currency", AttributeValue.builder().s(transaction.getCurrency()).build());
            item.put("type", AttributeValue.builder().s(transaction.getType()).build());
            item.put("status", AttributeValue.builder().s(transaction.getStatus()).build());
            item.put("timestamp", AttributeValue.builder().n(String.valueOf(transaction.getTimestamp())).build());
            item.put("fraudScore", AttributeValue.builder().n(String.valueOf(transaction.getFraudScore())).build());
            item.put("fraudRiskLevel", AttributeValue.builder().s(transaction.getFraudRiskLevel()).build());
            item.put("createdAt", AttributeValue.builder().s(transaction.getCreatedAt()).build());
            
            if (transaction.getMerchantId() != null) {
                item.put("merchantId", AttributeValue.builder().s(transaction.getMerchantId()).build());
            }
            if (transaction.getSourceCountry() != null) {
                item.put("sourceCountry", AttributeValue.builder().s(transaction.getSourceCountry()).build());
            }
            
            PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build();
            
            dynamoDbClient.putItem(request);
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Publish transaction to Kinesis stream
     */
    public void publishToKinesis(Transaction transaction) {
        var subsegment = AWSXRay.beginSubsegment("PublishToKinesis");
        
        try {
            String data = gson.toJson(transaction);
            
            PutRecordRequest request = PutRecordRequest.builder()
                .streamName(streamName)
                .partitionKey(transaction.getCustomerId())
                .data(SdkBytes.fromUtf8String(data))
                .build();
            
            kinesisClient.putRecord(request);
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Send transaction to SQS queue
     */
    public void sendToQueue(Transaction transaction) {
        var subsegment = AWSXRay.beginSubsegment("SendToQueue");
        
        try {
            String message = gson.toJson(transaction);
            
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(message)
                .build();
            
            sqsClient.sendMessage(request);
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Send transaction to manual review queue
     */
    public void sendToReviewQueue(Transaction transaction, FraudCheckResult fraudResult) {
        // Send to review queue (implementation similar to sendToQueue)
        String reviewQueueUrl = queueUrl.replace("transactions-", "manual-review-");
        
        Map<String, Object> reviewItem = new HashMap<>();
        reviewItem.put("transaction", transaction);
        reviewItem.put("fraudResult", fraudResult);
        
        String message = gson.toJson(reviewItem);
        
        SendMessageRequest request = SendMessageRequest.builder()
            .queueUrl(reviewQueueUrl)
            .messageBody(message)
            .build();
        
        sqsClient.sendMessage(request);
    }
    
    /**
     * Publish fraud alert
     */
    public void publishFraudAlert(Transaction transaction, FraudCheckResult fraudResult) {
        // Publish to fraud alerts queue
        String alertQueueUrl = queueUrl.replace("transactions-", "fraud-alerts-");
        
        Map<String, Object> alert = new HashMap<>();
        alert.put("transaction", transaction);
        alert.put("fraudResult", fraudResult);
        alert.put("alertTime", System.currentTimeMillis());
        
        String message = gson.toJson(alert);
        
        try {
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(alertQueueUrl)
                .messageBody(message)
                .build();
            
            sqsClient.sendMessage(request);
        } catch (Exception e) {
            System.err.println("Failed to send fraud alert: " + e.getMessage());
        }
    }
}
