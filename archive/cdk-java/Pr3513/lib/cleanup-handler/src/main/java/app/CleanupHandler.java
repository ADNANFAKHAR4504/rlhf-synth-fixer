package app;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class CleanupHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final DynamoDbClient dynamoDb;
    private final SnsClient sns;
    private final S3Client s3;
    private final String tableName;
    private final String topicArn;
    private final String bucketName;
    private final ObjectMapper objectMapper;

    public CleanupHandler() {
        this.dynamoDb = DynamoDbClient.create();
        this.sns = SnsClient.create();
        this.s3 = S3Client.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.topicArn = System.getenv("SNS_TOPIC_ARN");
        this.bucketName = System.getenv("ANALYTICS_BUCKET");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Subsegment subsegment = AWSXRay.beginSubsegment("CleanupProcess");
        Map<String, Object> response = new HashMap<>();
        List<String> deletedUrls = new ArrayList<>();
        int totalDeleted = 0;

        try {
            long currentTime = Instant.now().getEpochSecond();

            // Scan for expired URLs
            Map<String, AttributeValue> expressionValues = new HashMap<>();
            expressionValues.put(":now", AttributeValue.builder().n(String.valueOf(currentTime)).build());

            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName(tableName)
                    .filterExpression("expiresAt < :now")
                    .expressionAttributeValues(expressionValues)
                    .projectionExpression("shortId, longUrl, clicks")
                    .build();

            ScanResponse scanResponse;
            String lastEvaluatedKey = null;

            do {
                if (lastEvaluatedKey != null) {
                    scanRequest = scanRequest.toBuilder()
                            .exclusiveStartKey(Map.of("shortId", AttributeValue.builder().s(lastEvaluatedKey).build()))
                            .build();
                }

                scanResponse = dynamoDb.scan(scanRequest);

                for (Map<String, AttributeValue> item : scanResponse.items()) {
                    String shortId = item.get("shortId").s();
                    String longUrl = item.get("longUrl").s();
                    String clicks = item.getOrDefault("clicks", AttributeValue.builder().n("0").build()).n();

                    // Archive analytics before deletion
                    archiveUrlData(shortId, longUrl, clicks);

                    // Delete from DynamoDB
                    DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                            .tableName(tableName)
                            .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                            .build();

                    dynamoDb.deleteItem(deleteRequest);
                    deletedUrls.add(shortId);
                    totalDeleted++;

                    // Send individual notifications for first 5 deletions
                    if (totalDeleted <= 5) {
                        sendExpirationNotification(shortId, longUrl, clicks);
                    }
                }

                lastEvaluatedKey = scanResponse.hasLastEvaluatedKey() ?
                        scanResponse.lastEvaluatedKey().get("shortId").s() : null;

            } while (scanResponse.hasLastEvaluatedKey());

            // Send summary notification if more than 5 URLs deleted
            if (totalDeleted > 5) {
                sendSummaryNotification(totalDeleted, deletedUrls);
            }

            response.put("success", true);
            response.put("deletedCount", totalDeleted);
            response.put("deletedUrls", deletedUrls.stream().limit(10).collect(Collectors.toList()));

        } catch (Exception e) {
            context.getLogger().log("Cleanup error: " + e.getMessage());
            AWSXRay.getCurrentSegment().addException(e);

            response.put("success", false);
            response.put("error", e.getMessage());

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private void archiveUrlData(String shortId, String longUrl, String clicks) {
        try {
            Map<String, Object> archiveData = new HashMap<>();
            archiveData.put("shortId", shortId);
            archiveData.put("longUrl", longUrl);
            archiveData.put("totalClicks", Integer.parseInt(clicks));
            archiveData.put("archivedAt", Instant.now().toString());
            archiveData.put("reason", "expired");

            String key = "archive/" + Instant.now().toString().substring(0, 10) + "/" + shortId + ".json";

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("application/json")
                    .build();

            s3.putObject(putRequest, RequestBody.fromString(objectMapper.writeValueAsString(archiveData)));

        } catch (Exception e) {
            // Log but don't fail the cleanup
            AWSXRay.getCurrentSegment().addException(e);
        }
    }

    private void sendExpirationNotification(String shortId, String longUrl, String clicks) {
        try {
            String message = String.format(
                    "URL Expired and Deleted\n\n" +
                    "Short ID: %s\n" +
                    "Original URL: %s\n" +
                    "Total Clicks: %s\n" +
                    "Deleted at: %s\n\n" +
                    "This URL has been permanently removed from the system and archived.",
                    shortId, longUrl, clicks, Instant.now().toString()
            );

            PublishRequest publishRequest = PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("URL Expiration - " + shortId)
                    .message(message)
                    .build();

            sns.publish(publishRequest);

        } catch (Exception e) {
            // Log but don't fail
            AWSXRay.getCurrentSegment().addException(e);
        }
    }

    private void sendSummaryNotification(int totalDeleted, List<String> deletedUrls) {
        try {
            String urlList = deletedUrls.stream()
                    .limit(20)
                    .collect(Collectors.joining("\n  - ", "  - ", ""));

            String message = String.format(
                    "Bulk URL Cleanup Summary\n\n" +
                    "Total URLs Deleted: %d\n" +
                    "Cleanup Time: %s\n\n" +
                    "First 20 Deleted Short IDs:\n%s\n\n" +
                    "All expired URLs have been archived to S3 and removed from DynamoDB.",
                    totalDeleted, Instant.now().toString(), urlList
            );

            PublishRequest publishRequest = PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("URL Cleanup Summary Report")
                    .message(message)
                    .build();

            sns.publish(publishRequest);

        } catch (Exception e) {
            AWSXRay.getCurrentSegment().addException(e);
        }
    }
}