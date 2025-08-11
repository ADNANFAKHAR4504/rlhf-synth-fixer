package com.example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import java.util.Map;
import java.util.HashMap;
import java.time.Instant;

public class Handler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        System.out.println("SnapStart Java Lambda Handler Started at: " + Instant.now());
        System.out.println("Function Name: " + context.getFunctionName());
        System.out.println("Request ID: " + context.getAwsRequestId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);
        response.put("message", "SnapStart enabled Java Lambda function executed successfully");
        response.put("timestamp", Instant.now().toString());
        response.put("functionName", context.getFunctionName());
        response.put("requestId", context.getAwsRequestId());
        response.put("snapStartEnabled", true);
        response.put("runtime", "java17");
        
        // Simulate some processing
        try {
            Thread.sleep(100); // 100ms processing simulation
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("SnapStart Java Lambda Handler Completed");
        
        return response;
    }
}