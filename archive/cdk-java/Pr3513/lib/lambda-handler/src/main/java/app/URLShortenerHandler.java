package app;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;

public class URLShortenerHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbClient dynamoDb;
    private final S3Client s3;
    private final String tableName;
    private final String bucketName;
    private final ObjectMapper objectMapper;

    public URLShortenerHandler() {
        this.dynamoDb = DynamoDbClient.create();
        this.s3 = S3Client.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.bucketName = System.getenv("ANALYTICS_BUCKET");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(Map.of(
            "Content-Type", "application/json",
            "Access-Control-Allow-Origin", "*"
        ));

        try {
            String httpMethod = request.getHttpMethod();

            if ("POST".equals(httpMethod)) {
                return handleCreateShortUrl(request, context);
            } else if ("GET".equals(httpMethod)) {
                return handleRedirect(request, context);
            } else {
                response.setStatusCode(405);
                response.setBody("{\"error\":\"Method not allowed\"}");
            }
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"error\":\"Internal server error\"}");
        }

        return response;
    }

    private APIGatewayProxyResponseEvent handleCreateShortUrl(APIGatewayProxyRequestEvent request, Context context) throws Exception {
        Subsegment subsegment = AWSXRay.beginSubsegment("CreateShortUrl");
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(Map.of(
            "Content-Type", "application/json",
            "Access-Control-Allow-Origin", "*"
        ));

        try {
            JsonNode body = objectMapper.readTree(request.getBody());
            String longUrl = body.get("url").asText();

            if (longUrl == null || longUrl.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"error\":\"URL is required\"}");
                return response;
            }

            String shortId = generateShortId(longUrl);
            long expiresAt = Instant.now().plus(30, ChronoUnit.DAYS).getEpochSecond();

            Map<String, AttributeValue> item = new HashMap<>();
            item.put("shortId", AttributeValue.builder().s(shortId).build());
            item.put("longUrl", AttributeValue.builder().s(longUrl).build());
            item.put("createdAt", AttributeValue.builder().n(String.valueOf(Instant.now().getEpochSecond())).build());
            item.put("expiresAt", AttributeValue.builder().n(String.valueOf(expiresAt)).build());
            item.put("clicks", AttributeValue.builder().n("0").build());

            PutItemRequest putRequest = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .conditionExpression("attribute_not_exists(shortId)")
                .build();

            try {
                dynamoDb.putItem(putRequest);
            } catch (ConditionalCheckFailedException e) {
                // Short ID already exists, use existing
            }

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("shortId", shortId);
            responseBody.put("shortUrl", "https://" + request.getHeaders().get("Host") + "/" + shortId);

            response.setStatusCode(200);
            response.setBody(objectMapper.writeValueAsString(responseBody));

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private APIGatewayProxyResponseEvent handleRedirect(APIGatewayProxyRequestEvent request, Context context) throws Exception {
        Subsegment subsegment = AWSXRay.beginSubsegment("HandleRedirect");
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            String shortId = request.getPathParameters().get("shortId");

            if (shortId == null || shortId.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"error\":\"Short ID is required\"}");
                return response;
            }

            GetItemRequest getRequest = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                .build();

            GetItemResponse getResponse = dynamoDb.getItem(getRequest);

            if (!getResponse.hasItem()) {
                response.setStatusCode(404);
                response.setBody("{\"error\":\"URL not found\"}");
                return response;
            }

            String longUrl = getResponse.item().get("longUrl").s();

            // Update click count
            UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                .updateExpression("ADD clicks :inc")
                .expressionAttributeValues(Map.of(":inc", AttributeValue.builder().n("1").build()))
                .build();

            dynamoDb.updateItem(updateRequest);

            // Log analytics
            logAnalytics(shortId, request);

            response.setStatusCode(301);
            response.setHeaders(Map.of(
                "Location", longUrl,
                "Cache-Control", "public, max-age=3600"
            ));

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private String generateShortId(String url) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(url.getBytes(StandardCharsets.UTF_8));
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        return encoded.substring(0, 8);
    }

    private void logAnalytics(String shortId, APIGatewayProxyRequestEvent request) {
        try {
            Map<String, Object> analytics = new HashMap<>();
            analytics.put("shortId", shortId);
            analytics.put("timestamp", Instant.now().toString());
            analytics.put("userAgent", request.getHeaders().get("User-Agent"));
            analytics.put("ip", request.getRequestContext().getIdentity().getSourceIp());

            String key = "analytics/" + Instant.now().toString().substring(0, 10) + "/" + shortId + "-" + System.currentTimeMillis() + ".json";

            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/json")
                .build();

            s3.putObject(putRequest, RequestBody.fromString(objectMapper.writeValueAsString(analytics)));
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to log analytics: " + e.getMessage());
        }
    }
}