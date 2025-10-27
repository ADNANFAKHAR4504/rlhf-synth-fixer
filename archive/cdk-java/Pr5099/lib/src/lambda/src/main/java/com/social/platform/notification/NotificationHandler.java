package com.social.platform.notification;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import software.amazon.awssdk.core.SdkBytes;

import java.net.URI;
import java.util.Map;

/**
 * Notification Handler
 * Processes DynamoDB streams and sends real-time notifications via WebSocket
 * Triggers: New posts, likes, comments, friend requests
 */
public class NotificationHandler implements RequestHandler<DynamodbEvent, String> {

    @Override
    public String handleRequest(DynamodbEvent event, Context context) {
        context.getLogger().log("Processing " + event.getRecords().size() + " DynamoDB records");

        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            String eventName = record.getEventName();
            context.getLogger().log("Event: " + eventName);

            if ("INSERT".equals(eventName)) {
                processNewRecord(record, context);
            } else if ("MODIFY".equals(eventName)) {
                processUpdatedRecord(record, context);
            }
        }

        return "Processed " + event.getRecords().size() + " records";
    }

    private void processNewRecord(DynamodbEvent.DynamodbStreamRecord record, Context context) {
        Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
        
        // Extract notification details
        String postId = newImage.get("postId") != null ? newImage.get("postId").getS() : null;
        String userId = newImage.get("userId") != null ? newImage.get("userId").getS() : null;
        String notificationType = determineNotificationType(newImage);

        context.getLogger().log("New record - Type: " + notificationType + ", User: " + userId);

        // Create notification message
        String notificationMessage = createNotificationMessage(notificationType, newImage);

        // Get user's connections and send notifications
        sendNotificationToUser(userId, notificationMessage, context);
    }

    private void processUpdatedRecord(DynamodbEvent.DynamodbStreamRecord record, Context context) {
        Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
        Map<String, AttributeValue> oldImage = record.getDynamodb().getOldImage();

        // Check for significant changes (e.g., like count increased)
        if (hasSignificantChange(oldImage, newImage)) {
            String postId = newImage.get("postId") != null ? newImage.get("postId").getS() : null;
            String notificationMessage = createUpdateNotification(newImage);
            
            // Broadcast update to relevant users
            broadcastUpdate(postId, notificationMessage, context);
        }
    }

    private String determineNotificationType(Map<String, AttributeValue> record) {
        // Determine notification type based on record attributes
        if (record.containsKey("postId") && record.containsKey("timestamp")) {
            return "NEW_POST";
        } else if (record.containsKey("likeCount")) {
            return "NEW_LIKE";
        } else if (record.containsKey("commentId")) {
            return "NEW_COMMENT";
        }
        return "UNKNOWN";
    }

    private String createNotificationMessage(String type, Map<String, AttributeValue> record) {
        // Create JSON notification message
        StringBuilder message = new StringBuilder("{");
        message.append("\"type\":\"").append(type).append("\",");
        message.append("\"timestamp\":").append(System.currentTimeMillis()).append(",");
        message.append("\"data\":{");
        
        // Add relevant fields based on type
        if ("NEW_POST".equals(type)) {
            String postId = record.get("postId") != null ? record.get("postId").getS() : "";
            String userId = record.get("userId") != null ? record.get("userId").getS() : "";
            message.append("\"postId\":\"").append(postId).append("\",");
            message.append("\"userId\":\"").append(userId).append("\"");
        }
        
        message.append("}}");
        return message.toString();
    }

    private String createUpdateNotification(Map<String, AttributeValue> record) {
        // Create update notification for changed records
        return "{\"type\":\"UPDATE\",\"timestamp\":" + System.currentTimeMillis() + "}";
    }

    private boolean hasSignificantChange(Map<String, AttributeValue> oldImage, 
                                        Map<String, AttributeValue> newImage) {
        // Check if the change is significant enough to notify
        // For example: like count changed, viral score increased, etc.
        return true; // Implement actual logic
    }

    private void sendNotificationToUser(String userId, String message, Context context) {
        // TODO: Query DynamoDB for user's active WebSocket connections
        // TODO: Send notification to each active connection
        context.getLogger().log("Sending notification to user: " + userId);
    }

    private void broadcastUpdate(String postId, String message, Context context) {
        // TODO: Get all users who should receive this update
        // TODO: Send to their WebSocket connections
        context.getLogger().log("Broadcasting update for post: " + postId);
    }

    private void sendWebSocketMessage(String connectionId, String message, String endpoint) {
        try {
            ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                    .endpointOverride(URI.create(endpoint))
                    .build();

            PostToConnectionRequest request = PostToConnectionRequest.builder()
                    .connectionId(connectionId)
                    .data(SdkBytes.fromUtf8String(message))
                    .build();

            client.postToConnection(request);
        } catch (Exception e) {
            // Handle stale connections (remove from database)
            System.err.println("Error sending to connection " + connectionId + ": " + e.getMessage());
        }
    }
}
