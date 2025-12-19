package com.social.platform.websocket;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket Connect Handler
 * Manages new WebSocket connections and stores connection information
 */
public class ConnectHandler implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {

    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        context.getLogger().log("New WebSocket connection: " + connectionId);

        // Store connection information in DynamoDB
        // Format: userId -> connectionId mapping
        Map<String, String> queryParams = event.getQueryStringParameters();
        String userId = queryParams != null ? queryParams.get("userId") : null;

        if (userId != null) {
            storeConnection(connectionId, userId);
            context.getLogger().log("Connection stored for user: " + userId);
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("{\"message\":\"Connected\",\"connectionId\":\"" + connectionId + "\"}");

        return response;
    }

    private void storeConnection(String connectionId, String userId) {
        // TODO: Implement DynamoDB logic to store connection
        // Table: WebSocketConnections
        // PK: userId, SK: connectionId
        // Attributes: connectionTime, lastActivityTime
    }
}
