package com.social.platform.websocket;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;

/**
 * WebSocket Disconnect Handler
 * Cleans up connection information when clients disconnect
 */
public class DisconnectHandler implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {

    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        context.getLogger().log("WebSocket disconnection: " + connectionId);

        // Remove connection from DynamoDB
        removeConnection(connectionId);

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("{\"message\":\"Disconnected\"}");

        return response;
    }

    private void removeConnection(String connectionId) {
        // TODO: Implement DynamoDB logic to remove connection
        // Query by connectionId and delete the record
    }
}
