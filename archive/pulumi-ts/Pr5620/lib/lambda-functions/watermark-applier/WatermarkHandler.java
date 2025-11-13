package com.example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import java.util.Map;
import java.util.HashMap;

public class WatermarkHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        context.getLogger().log("Watermark application started: " + event.toString());

        String inputBucket = System.getenv("INPUT_BUCKET");
        String outputBucket = System.getenv("OUTPUT_BUCKET");

        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);

        Map<String, String> body = new HashMap<>();
        body.put("message", "Watermark applied successfully");
        body.put("inputBucket", inputBucket);
        body.put("outputBucket", outputBucket);
        body.put("architecture", "arm64");
        body.put("memorySize", "512MB");
        body.put("snapStart", "enabled");

        response.put("body", body.toString());

        return response;
    }
}
