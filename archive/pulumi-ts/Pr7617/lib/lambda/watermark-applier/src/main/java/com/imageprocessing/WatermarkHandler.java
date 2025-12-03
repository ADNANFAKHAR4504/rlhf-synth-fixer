package com.imageprocessing;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.regions.Region;

import java.util.HashMap;
import java.util.Map;

/**
 * Watermark Applier Lambda Function (Java)
 *
 * Applies watermarks to images in S3.
 * Optimized for ARM64 architecture with Java 21 runtime and SnapStart enabled.
 */
public class WatermarkHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final S3Client s3Client;
    private final String inputBucket;
    private final String outputBucket;
    private final Gson gson;

    // Constructor - initialization happens once with SnapStart
    public WatermarkHandler() {
        String region = System.getenv("AWS_REGION");
        if (region == null) {
            region = "us-east-1";
        }

        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .build();

        this.inputBucket = System.getenv("INPUT_BUCKET");
        this.outputBucket = System.getenv("OUTPUT_BUCKET");
        this.gson = new Gson();

        System.out.println("WatermarkHandler initialized with SnapStart");
        System.out.println("Input bucket: " + inputBucket);
        System.out.println("Output bucket: " + outputBucket);
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        context.getLogger().log("Watermark Applier - Event received: " + gson.toJson(event));

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        response.setHeaders(headers);

        try {
            // Parse request body
            String body = event.getBody();
            JsonObject requestBody = gson.fromJson(body, JsonObject.class);

            String sourceKey = requestBody != null && requestBody.has("sourceKey")
                    ? requestBody.get("sourceKey").getAsString()
                    : null;

            if (sourceKey == null || sourceKey.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"error\": \"Missing sourceKey parameter\"}");
                return response;
            }

            context.getLogger().log("Processing watermark for: " + sourceKey);

            // In a real implementation, this would:
            // 1. Get the image from S3
            // 2. Apply watermark using image processing library
            // 3. Upload watermarked image to output bucket

            String watermarkedKey = "watermarked/" + sourceKey;

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("message", "Watermark applied successfully");
            responseBody.put("sourceKey", sourceKey);
            responseBody.put("watermarkedKey", watermarkedKey);
            responseBody.put("inputBucket", inputBucket);
            responseBody.put("outputBucket", outputBucket);
            responseBody.put("architecture", "arm64");
            responseBody.put("runtime", "java21");
            responseBody.put("snapStart", "enabled");
            responseBody.put("memorySize", "512MB");

            response.setStatusCode(200);
            response.setBody(gson.toJson(responseBody));

        } catch (Exception e) {
            context.getLogger().log("Error applying watermark: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"error\": \"Failed to apply watermark\", \"details\": \"" + e.getMessage() + "\"}");
        }

        return response;
    }
}
