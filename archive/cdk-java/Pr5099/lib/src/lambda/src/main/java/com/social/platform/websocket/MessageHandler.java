package com.social.platform.websocket;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import software.amazon.awssdk.core.SdkBytes;

import java.net.URI;

/**
 * WebSocket Message Handler
 * Processes incoming WebSocket messages and broadcasts updates
 */
public class MessageHandler implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {

    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        String body = event.getBody();
        
        context.getLogger().log("Received message from connection: " + connectionId);
        context.getLogger().log("Message body: " + body);

        // Process the message
        String response = processMessage(body, connectionId, context);

        // Send response back to client
        sendMessageToConnection(connectionId, response, event, context);

        APIGatewayV2WebSocketResponse apiResponse = new APIGatewayV2WebSocketResponse();
        apiResponse.setStatusCode(200);
        apiResponse.setBody("{\"status\":\"processed\"}");

        return apiResponse;
    }

    private String processMessage(String message, String connectionId, Context context) {
        // TODO: Implement message processing logic
        // - Parse message type (like, comment, new post, etc.)
        // - Update database
        // - Broadcast to relevant connections
        // - Return acknowledgment
        
        return "{\"status\":\"success\",\"message\":\"Message processed\"}";
    }

    private void sendMessageToConnection(String connectionId, String message, 
                                        APIGatewayV2WebSocketEvent event, Context context) {
        try {
            // Build API Gateway Management API endpoint
            String domain = event.getRequestContext().getDomainName();
            String stage = event.getRequestContext().getStage();
            String endpoint = String.format("https://%s/%s", domain, stage);

            ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                    .endpointOverride(URI.create(endpoint))
                    .build();

            PostToConnectionRequest request = PostToConnectionRequest.builder()
                    .connectionId(connectionId)
                    .data(SdkBytes.fromUtf8String(message))
                    .build();

            client.postToConnection(request);
            context.getLogger().log("Message sent to connection: " + connectionId);

        } catch (Exception e) {
            context.getLogger().log("Error sending message: " + e.getMessage());
        }
    }
}
