package com.banking.services;

import com.banking.models.TransactionResponse;
import com.google.gson.Gson;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for handling idempotent transaction requests
 */
public class IdempotencyService {
    
    private final DynamoDbClient dynamoDbClient;
    private final Gson gson;
    private final String tableName;
    private static final int TTL_HOURS = 24; // Cache responses for 24 hours
    
    public IdempotencyService() {
        this.dynamoDbClient = DynamoDbClient.builder().build();
        this.gson = new Gson();
        String env = System.getenv("ENVIRONMENT");
        this.tableName = "idempotency-" + env;
    }
    
    /**
     * Check if request with this idempotency key was already processed
     */
    public TransactionResponse checkIdempotency(String idempotencyKey) {
        try {
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("idempotencyKey", AttributeValue.builder().s(idempotencyKey).build());
            
            GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(key)
                .build();
            
            GetItemResponse response = dynamoDbClient.getItem(request);
            
            if (response.hasItem() && !response.item().isEmpty()) {
                // Found cached response
                String responseJson = response.item().get("response").s();
                return gson.fromJson(responseJson, TransactionResponse.class);
            }
            
            return null; // No cached response
            
        } catch (ResourceNotFoundException e) {
            // Table doesn't exist - continue without idempotency check
            System.err.println("Idempotency table not found: " + tableName);
            return null;
        } catch (Exception e) {
            System.err.println("Error checking idempotency: " + e.getMessage());
            return null; // On error, allow request to proceed
        }
    }
    
    /**
     * Cache response for this idempotency key
     */
    public void cacheResponse(String idempotencyKey, TransactionResponse response) {
        try {
            long ttl = Instant.now().getEpochSecond() + (TTL_HOURS * 3600);
            
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("idempotencyKey", AttributeValue.builder().s(idempotencyKey).build());
            item.put("response", AttributeValue.builder().s(gson.toJson(response)).build());
            item.put("ttl", AttributeValue.builder().n(String.valueOf(ttl)).build());
            item.put("createdAt", AttributeValue.builder().s(Instant.now().toString()).build());
            
            PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build();
            
            dynamoDbClient.putItem(request);
            
        } catch (Exception e) {
            // Don't fail transaction if caching fails
            System.err.println("Failed to cache idempotency response: " + e.getMessage());
        }
    }
}
