package com.banking.services;

import com.banking.models.Transaction;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for sending customer notifications
 */
public class NotificationService {
    
    private final SqsClient sqsClient;
    private final Gson gson;
    private final String notificationQueueUrl;
    
    public NotificationService() {
        this.sqsClient = SqsClient.builder().build();
        this.gson = new Gson();
        String env = System.getenv("ENVIRONMENT");
        this.notificationQueueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/notifications-" + env;
    }
    
    /**
     * Send transaction notification to customer
     */
    public void sendTransactionNotification(Transaction transaction, String status) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TRANSACTION_" + status);
            notification.put("customerId", transaction.getCustomerId());
            notification.put("transactionId", transaction.getTransactionId());
            notification.put("amount", transaction.getAmount());
            notification.put("currency", transaction.getCurrency());
            notification.put("status", status);
            notification.put("timestamp", System.currentTimeMillis());
            
            // Add status-specific message
            String message;
            switch (status) {
                case "APPROVED":
                    message = String.format("Your %s transaction of %.2f %s was approved.", 
                        transaction.getType(), transaction.getAmount(), transaction.getCurrency());
                    break;
                case "REJECTED":
                    message = String.format("Your %s transaction of %.2f %s was declined for security reasons.", 
                        transaction.getType(), transaction.getAmount(), transaction.getCurrency());
                    break;
                case "PENDING_REVIEW":
                    message = String.format("Your %s transaction of %.2f %s is under review. You'll be notified within 24 hours.", 
                        transaction.getType(), transaction.getAmount(), transaction.getCurrency());
                    break;
                default:
                    message = "Transaction status updated";
            }
            
            notification.put("message", message);
            
            String notificationJson = gson.toJson(notification);
            
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(notificationQueueUrl)
                .messageBody(notificationJson)
                .build();
            
            sqsClient.sendMessage(request);
            
        } catch (Exception e) {
            // Don't fail transaction if notification fails
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }
}
