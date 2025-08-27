package com.serverless;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import java.util.Map;
import java.util.HashMap;

public class Handler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);
        
        String environment = System.getenv("ENVIRONMENT");
        if (environment == null) {
            environment = "unknown";
        }
        
        response.put("body", "{\"message\":\"Hello from serverless backend!\",\"environment\":\"" + environment + "\"}");
        
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        response.put("headers", headers);
        
        return response;
    }
}