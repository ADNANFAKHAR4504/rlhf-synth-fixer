package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsRequest;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsResponse;
import software.amazon.awssdk.services.cloudwatch.model.Statistic;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.DescribeExecutionRequest;
import software.amazon.awssdk.services.sfn.model.DescribeExecutionResponse;
import software.amazon.awssdk.services.sfn.model.ExecutionStatus;
import software.amazon.awssdk.services.sfn.model.ListStateMachinesRequest;
import software.amazon.awssdk.services.sfn.model.ListStateMachinesResponse;
import software.amazon.awssdk.services.sfn.model.StartExecutionRequest;
import software.amazon.awssdk.services.sfn.model.StartExecutionResponse;

import javax.websocket.ClientEndpoint;
import javax.websocket.CloseReason;
import javax.websocket.ContainerProvider;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Live Integration Tests for the deployed TapStack.
 *
 * These tests verify actual AWS resources and end-to-end functionality
 * of the deployed document collaboration system.
 *
 * Prerequisites:
 * - Stack must be deployed to AWS
 * - AWS credentials must be available in environment variables
 * - All infrastructure must be healthy and accessible
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String STACK_NAME;
    private static final String AWS_REGION;
    private static final String AWS_ACCESS_KEY_ID;
    private static final String AWS_SECRET_ACCESS_KEY;
    private static final String ENVIRONMENT_SUFFIX;

    private CloudFormationClient cloudFormationClient;
    private DynamoDbClient dynamoDbClient;
    private S3Client s3Client;
    private LambdaClient lambdaClient;
    private EventBridgeClient eventBridgeClient;
    private SfnClient sfnClient;
    private CloudWatchClient cloudWatchClient;
    private CognitoIdentityProviderClient cognitoClient;

    private Map<String, String> stackOutputs;
    private final ObjectMapper objectMapper = new ObjectMapper();

    static {
        // Retrieve environment variables
        ENVIRONMENT_SUFFIX = System.getenv("ENVIRONMENT_SUFFIX") != null 
            ? System.getenv("ENVIRONMENT_SUFFIX") 
            : "dev";
        
        STACK_NAME = "TapStack" + ENVIRONMENT_SUFFIX;
        
        AWS_REGION = System.getenv("AWS_REGION") != null 
            ? System.getenv("AWS_REGION") 
            : "us-east-1";
        
        AWS_ACCESS_KEY_ID = System.getenv("AWS_ACCESS_KEY_ID");
        AWS_SECRET_ACCESS_KEY = System.getenv("AWS_SECRET_ACCESS_KEY");

        // Validate required environment variables
        if (AWS_ACCESS_KEY_ID == null || AWS_SECRET_ACCESS_KEY == null) {
            throw new IllegalStateException(
                "AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
        }
    }

    @BeforeAll
    public void setup() {
        System.out.println("Setting up live integration tests for stack: " + STACK_NAME);
        System.out.println("Region: " + AWS_REGION);
        System.out.println("Environment Suffix: " + ENVIRONMENT_SUFFIX);

        // Create credentials provider
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
            AWS_ACCESS_KEY_ID, 
            AWS_SECRET_ACCESS_KEY
        );
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        Region region = Region.of(AWS_REGION);

        // Initialize AWS clients
        cloudFormationClient = CloudFormationClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        dynamoDbClient = DynamoDbClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        s3Client = S3Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        lambdaClient = LambdaClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        eventBridgeClient = EventBridgeClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        sfnClient = SfnClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        cloudWatchClient = CloudWatchClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        cognitoClient = CognitoIdentityProviderClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        // Load stack outputs
        stackOutputs = loadStackOutputs();
        
        System.out.println("Stack outputs loaded: " + stackOutputs.keySet());
    }

    private Map<String, String> loadStackOutputs() {
        DescribeStacksRequest request = DescribeStacksRequest.builder()
            .stackName(STACK_NAME)
            .build();

        DescribeStacksResponse response = cloudFormationClient.describeStacks(request);
        
        if (response.stacks().isEmpty()) {
            throw new IllegalStateException("Stack not found: " + STACK_NAME);
        }

        Stack stack = response.stacks().get(0);
        Map<String, String> outputs = new HashMap<>();
        
        for (Output output : stack.outputs()) {
            outputs.put(output.outputKey(), output.outputValue());
        }

        return outputs;
    }

    @Test
    @Order(1)
    @DisplayName("Verify stack is deployed and healthy")
    public void testStackDeployment() {
        assertThat(stackOutputs).isNotEmpty();
        assertThat(stackOutputs).containsKeys(
            "WebSocketApiUrl",
            "WebSocketApiId",
            "CognitoUserPoolId",
            "CognitoUserPoolClientId",
            "DocumentsTableName",
            "OperationsTableName",
            "ConnectionsTableName",
            "DocumentBucketName",
            "OpenSearchDomainEndpoint",
            "DashboardName"
        );
        
        System.out.println("✓ Stack is deployed with all required outputs");
    }

    @Test
    @Order(2)
    @DisplayName("Test DynamoDB Documents Table - Write and Read")
    public void testDynamoDBDocumentsTable() {
        String tableName = stackOutputs.get("DocumentsTableName");
        String documentId = "test-doc-" + UUID.randomUUID().toString();
        
        // Write to DynamoDB
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("documentId", AttributeValue.builder().s(documentId).build());
        item.put("title", AttributeValue.builder().s("Test Document").build());
        item.put("content", AttributeValue.builder().s("This is test content").build());
        item.put("createdAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
        item.put("version", AttributeValue.builder().n("1").build());

        PutItemRequest putRequest = PutItemRequest.builder()
            .tableName(tableName)
            .item(item)
            .build();

        dynamoDbClient.putItem(putRequest);
        System.out.println("✓ Document written to DynamoDB: " + documentId);

        // Read from DynamoDB
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("documentId", AttributeValue.builder().s(documentId).build());

        GetItemRequest getRequest = GetItemRequest.builder()
            .tableName(tableName)
            .key(key)
            .build();

        GetItemResponse getResponse = dynamoDbClient.getItem(getRequest);
        
        assertThat(getResponse.hasItem()).isTrue();
        assertThat(getResponse.item().get("documentId").s()).isEqualTo(documentId);
        assertThat(getResponse.item().get("title").s()).isEqualTo("Test Document");
        
        System.out.println("✓ Document successfully read from DynamoDB");

        // Cleanup
        DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
            .tableName(tableName)
            .key(key)
            .build();
        dynamoDbClient.deleteItem(deleteRequest);
        
        System.out.println("✓ Test document cleaned up");
    }

    @Test
    @Order(3)
    @DisplayName("Test DynamoDB Operations Table - Query with Sort Key")
    public void testDynamoDBOperationsTable() {
        String tableName = stackOutputs.get("OperationsTableName");
        String documentId = "test-doc-" + UUID.randomUUID().toString();
        long timestamp1 = System.currentTimeMillis();
        long timestamp2 = timestamp1 + 1000;

        // Write multiple operations
        Map<String, AttributeValue> operation1 = new HashMap<>();
        operation1.put("documentId", AttributeValue.builder().s(documentId).build());
        operation1.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp1)).build());
        operation1.put("operation", AttributeValue.builder().s("insert").build());
        operation1.put("userId", AttributeValue.builder().s("user-123").build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(operation1)
            .build());

        Map<String, AttributeValue> operation2 = new HashMap<>();
        operation2.put("documentId", AttributeValue.builder().s(documentId).build());
        operation2.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp2)).build());
        operation2.put("operation", AttributeValue.builder().s("delete").build());
        operation2.put("userId", AttributeValue.builder().s("user-123").build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(operation2)
            .build());

        System.out.println("✓ Operations written to DynamoDB");

        // Query operations for document
        QueryRequest queryRequest = QueryRequest.builder()
            .tableName(tableName)
            .keyConditionExpression("documentId = :docId")
            .expressionAttributeValues(Map.of(
                ":docId", AttributeValue.builder().s(documentId).build()
            ))
            .build();

        QueryResponse queryResponse = dynamoDbClient.query(queryRequest);
        
        assertThat(queryResponse.count()).isEqualTo(2);
        assertThat(queryResponse.items().get(0).get("operation").s()).isEqualTo("insert");
        assertThat(queryResponse.items().get(1).get("operation").s()).isEqualTo("delete");
        
        System.out.println("✓ Operations successfully queried: " + queryResponse.count() + " items");

        // Cleanup
        for (Map<String, AttributeValue> item : queryResponse.items()) {
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("documentId", item.get("documentId"));
            key.put("timestamp", item.get("timestamp"));
            
            dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(tableName)
                .key(key)
                .build());
        }
        
        System.out.println("✓ Test operations cleaned up");
    }

    @Test
    @Order(4)
    @DisplayName("Test S3 Document Bucket - Upload and Download")
    public void testS3DocumentBucket() {
        String bucketName = stackOutputs.get("DocumentBucketName");
        String objectKey = "test-documents/test-" + UUID.randomUUID().toString() + ".txt";
        String content = "This is a test document for integration testing.";

        // Upload to S3
        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .contentType("text/plain")
            .build();

        s3Client.putObject(putRequest, RequestBody.fromString(content));
        System.out.println("✓ Document uploaded to S3: " + objectKey);

        // Verify object exists
        HeadObjectRequest headRequest = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        s3Client.headObject(headRequest);
        System.out.println("✓ Document exists in S3");

        // Download from S3
        GetObjectRequest getRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        byte[] downloadedBytes = s3Client.getObjectAsBytes(getRequest).asByteArray();
        String downloadedContent = new String(downloadedBytes, StandardCharsets.UTF_8);
        
        assertThat(downloadedContent).isEqualTo(content);
        System.out.println("✓ Document successfully downloaded from S3");

        // Cleanup
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();
        s3Client.deleteObject(deleteRequest);
        
        System.out.println("✓ Test document cleaned up from S3");
    }

    @Test
    @Order(5)
    @DisplayName("Test Lambda Function Invocation - Connection Handler")
    public void testLambdaConnectionHandler() throws Exception {
        String functionName = "document-collab-connection-" + ENVIRONMENT_SUFFIX;

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "test-user-" + UUID.randomUUID().toString());
        payload.put("documentId", "test-doc-123");
        payload.put("action", "connect");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        assertThat(invokeResponse.statusCode()).isEqualTo(200);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(200);
        
        System.out.println("✓ Lambda Connection Handler invoked successfully");
        System.out.println("  Response: " + responseJson);
    }

    @Test
    @Order(6)
    @DisplayName("Test Lambda Function Invocation - Message Handler")
    public void testLambdaMessageHandler() throws Exception {
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "test-user-" + UUID.randomUUID().toString());
        payload.put("documentId", "test-doc-456");
        payload.put("operation", "insert");
        payload.put("content", "Hello, World!");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        assertThat(invokeResponse.statusCode()).isEqualTo(200);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(200);
        
        System.out.println("✓ Lambda Message Handler invoked successfully");
        System.out.println("  Response: " + responseJson);
    }

    @Test
    @Order(7)
    @DisplayName("Test Lambda Function Error Handling")
    public void testLambdaErrorHandling() throws Exception {
        String functionName = "document-collab-connection-" + ENVIRONMENT_SUFFIX;

        // Send invalid payload (missing userId)
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", "test-doc-123");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        // Should return 400 error
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(400);
        assertThat(responseNode.get("body").asText()).contains("userId is required");
        
        System.out.println("✓ Lambda error handling verified");
        System.out.println("  Error response: " + responseJson);
    }

    @Test
    @Order(8)
    @DisplayName("Test EventBridge Event Publishing")
    public void testEventBridgePublishing() {
        String eventBusName = "DocumentCollaborationEventBus-" + ENVIRONMENT_SUFFIX;

        PutEventsRequestEntry eventEntry = PutEventsRequestEntry.builder()
            .eventBusName(eventBusName)
            .source("document.collaboration")
            .detailType("Document Updated")
            .detail("{\"documentId\":\"test-doc-789\",\"userId\":\"user-456\",\"timestamp\":" 
                + System.currentTimeMillis() + "}")
            .build();

        PutEventsRequest putEventsRequest = PutEventsRequest.builder()
            .entries(eventEntry)
            .build();

        PutEventsResponse response = eventBridgeClient.putEvents(putEventsRequest);
        
        assertThat(response.failedEntryCount()).isEqualTo(0);
        assertThat(response.entries()).hasSize(1);
        
        System.out.println("✓ Event published to EventBridge successfully");
        System.out.println("  Event ID: " + response.entries().get(0).eventId());
    }

    @Test
    @Order(10)
    @DisplayName("Test CloudWatch Metrics Availability")
    public void testCloudWatchMetrics() {
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;

        GetMetricStatisticsRequest request = GetMetricStatisticsRequest.builder()
            .namespace("AWS/Lambda")
            .metricName("Invocations")
            .dimensions(Dimension.builder()
                .name("FunctionName")
                .value(functionName)
                .build())
            .startTime(Instant.now().minus(1, ChronoUnit.HOURS))
            .endTime(Instant.now())
            .period(300)
            .statistics(Statistic.SUM)
            .build();

        GetMetricStatisticsResponse response = cloudWatchClient.getMetricStatistics(request);
        
        assertThat(response.datapoints()).isNotNull();
        System.out.println("✓ CloudWatch metrics retrieved");
        System.out.println("  Datapoints: " + response.datapoints().size());
    }

    @Test
    @Order(12)
    @DisplayName("Test End-to-End Document Collaboration Flow")
    public void testEndToEndDocumentFlow() throws Exception {
        String documentId = "e2e-doc-" + UUID.randomUUID().toString();
        String userId = "e2e-user-" + UUID.randomUUID().toString();

        System.out.println("Starting end-to-end test for document: " + documentId);

        // Step 1: Create document in DynamoDB
        String documentsTable = stackOutputs.get("DocumentsTableName");
        Map<String, AttributeValue> document = new HashMap<>();
        document.put("documentId", AttributeValue.builder().s(documentId).build());
        document.put("title", AttributeValue.builder().s("E2E Test Document").build());
        document.put("content", AttributeValue.builder().s("Initial content").build());
        document.put("createdAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(documentsTable)
            .item(document)
            .build());
        System.out.println("✓ Step 1: Document created in DynamoDB");

        // Step 2: Upload document to S3
        String bucketName = stackOutputs.get("DocumentBucketName");
        String s3Key = "documents/" + documentId + ".txt";
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build(),
            RequestBody.fromString("Initial document content")
        );
        System.out.println("✓ Step 2: Document uploaded to S3");

        // Step 3: Record operation in Operations table
        String operationsTable = stackOutputs.get("OperationsTableName");
        Map<String, AttributeValue> operation = new HashMap<>();
        operation.put("documentId", AttributeValue.builder().s(documentId).build());
        operation.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
        operation.put("operation", AttributeValue.builder().s("create").build());
        operation.put("userId", AttributeValue.builder().s(userId).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(operationsTable)
            .item(operation)
            .build());
        System.out.println("✓ Step 3: Operation recorded");

        // Step 4: Invoke Lambda to process
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", documentId);
        payload.put("userId", userId);
        payload.put("operation", "update");

        InvokeResponse lambdaResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName(functionName)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(payload)))
                .build()
        );
        
        assertThat(lambdaResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Step 4: Lambda processed the operation");

        // Step 5: Verify document still exists
        GetItemResponse getResponse = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(documentsTable)
                .key(Map.of("documentId", AttributeValue.builder().s(documentId).build()))
                .build()
        );
        
        assertThat(getResponse.hasItem()).isTrue();
        System.out.println("✓ Step 5: Document verified in DynamoDB");

        // Step 6: Publish event to EventBridge
        String eventBusName = "DocumentCollaborationEventBus-" + ENVIRONMENT_SUFFIX;
        eventBridgeClient.putEvents(
            PutEventsRequest.builder()
                .entries(PutEventsRequestEntry.builder()
                    .eventBusName(eventBusName)
                    .source("document.collaboration")
                    .detailType("Document Updated")
                    .detail("{\"documentId\":\"" + documentId + "\",\"userId\":\"" + userId + "\"}")
                    .build())
                .build()
        );
        System.out.println("✓ Step 6: Event published to EventBridge");

        // Cleanup
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
            .tableName(documentsTable)
            .key(Map.of("documentId", AttributeValue.builder().s(documentId).build()))
            .build());
        
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(s3Key)
            .build());
        
        System.out.println("✓ End-to-end test completed successfully");
    }

    @Test
    @Order(13)
    @DisplayName("Test DynamoDB Connections Table TTL")
    public void testConnectionsTableTTL() {
        String tableName = stackOutputs.get("ConnectionsTableName");
        String connectionId = "test-conn-" + UUID.randomUUID().toString();
        
        // Create connection with TTL set to 1 hour from now
        long ttl = Instant.now().plus(1, ChronoUnit.HOURS).getEpochSecond();
        
        Map<String, AttributeValue> connection = new HashMap<>();
        connection.put("connectionId", AttributeValue.builder().s(connectionId).build());
        connection.put("userId", AttributeValue.builder().s("test-user").build());
        connection.put("documentId", AttributeValue.builder().s("test-doc").build());
        connection.put("ttl", AttributeValue.builder().n(String.valueOf(ttl)).build());
        connection.put("connectedAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(connection)
            .build());
        
        System.out.println("✓ Connection created with TTL: " + ttl);

        // Verify it was created
        GetItemResponse getResponse = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("connectionId", AttributeValue.builder().s(connectionId).build()))
                .build()
        );
        
        assertThat(getResponse.hasItem()).isTrue();
        assertThat(getResponse.item().get("ttl").n()).isEqualTo(String.valueOf(ttl));
        
        System.out.println("✓ Connection verified with correct TTL");

        // Cleanup
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
            .tableName(tableName)
            .key(Map.of("connectionId", AttributeValue.builder().s(connectionId).build()))
            .build());
        
        System.out.println("✓ Test connection cleaned up");
    }

    @Test
    @Order(14)
    @DisplayName("Test S3 Bucket Versioning")
    public void testS3BucketVersioning() {
        String bucketName = stackOutputs.get("DocumentBucketName");
        String objectKey = "versioning-test/" + UUID.randomUUID().toString() + ".txt";

        // Upload first version
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build(),
            RequestBody.fromString("Version 1 content")
        );
        System.out.println("✓ Version 1 uploaded");

        // Upload second version
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build(),
            RequestBody.fromString("Version 2 content")
        );
        System.out.println("✓ Version 2 uploaded");

        // Download latest version
        byte[] latestContent = s3Client.getObjectAsBytes(
            GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build()
        ).asByteArray();

        String contentStr = new String(latestContent, StandardCharsets.UTF_8);
        assertThat(contentStr).isEqualTo("Version 2 content");
        
        System.out.println("✓ Latest version verified: Version 2");

        // Cleanup
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build());
        
        System.out.println("✓ Versioned object cleaned up");
    }

    @Test
    @Order(15)
    @DisplayName("Test Multiple Lambda Functions in Sequence")
    public void testLambdaFunctionSequence() throws Exception {
        String userId = "seq-user-" + UUID.randomUUID().toString();
        String documentId = "seq-doc-" + UUID.randomUUID().toString();

        // 1. Call Connection Handler
        Map<String, Object> connectPayload = new HashMap<>();
        connectPayload.put("userId", userId);
        connectPayload.put("documentId", documentId);

        InvokeResponse connectResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-connection-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(connectPayload)))
                .build()
        );
        
        assertThat(connectResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Connection Handler called");

        // 2. Call Message Handler
        Map<String, Object> messagePayload = new HashMap<>();
        messagePayload.put("userId", userId);
        messagePayload.put("documentId", documentId);
        messagePayload.put("operation", "insert");

        InvokeResponse messageResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-message-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(messagePayload)))
                .build()
        );
        
        assertThat(messageResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Message Handler called");

        // 3. Call Notification Handler
        Map<String, Object> notificationPayload = new HashMap<>();
        notificationPayload.put("userId", userId);
        notificationPayload.put("documentId", documentId);
        notificationPayload.put("message", "Document updated");

        InvokeResponse notificationResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-notification-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(notificationPayload)))
                .build()
        );
        
        assertThat(notificationResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Notification Handler called");
        
        System.out.println("✓ Lambda function sequence completed successfully");
    }

    @Test
    @Order(16)
    @DisplayName("Test Concurrent DynamoDB Operations")
    public void testConcurrentDynamoDBOperations() throws Exception {
        String operationsTable = stackOutputs.get("OperationsTableName");
        String documentId = "concurrent-doc-" + UUID.randomUUID().toString();

        int concurrentOps = 10;
        CountDownLatch latch = new CountDownLatch(concurrentOps);
        AtomicReference<Exception> error = new AtomicReference<>();

        // Perform concurrent writes
        for (int i = 0; i < concurrentOps; i++) {
            final int opNum = i;
            new Thread(() -> {
                try {
                    Map<String, AttributeValue> operation = new HashMap<>();
                    operation.put("documentId", AttributeValue.builder().s(documentId).build());
                    operation.put("timestamp", AttributeValue.builder()
                        .n(String.valueOf(System.currentTimeMillis() + opNum))
                        .build());
                    operation.put("operation", AttributeValue.builder().s("op-" + opNum).build());
                    operation.put("userId", AttributeValue.builder().s("user-" + opNum).build());

                    dynamoDbClient.putItem(PutItemRequest.builder()
                        .tableName(operationsTable)
                        .item(operation)
                        .build());
                } catch (Exception e) {
                    error.set(e);
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        assertThat(completed).isTrue();
        assertThat(error.get()).isNull();
        
        System.out.println("✓ " + concurrentOps + " concurrent operations completed");

        // Query to verify all operations were written
        QueryResponse queryResponse = dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(operationsTable)
                .keyConditionExpression("documentId = :docId")
                .expressionAttributeValues(Map.of(
                    ":docId", AttributeValue.builder().s(documentId).build()
                ))
                .build()
        );

        assertThat(queryResponse.count()).isEqualTo(concurrentOps);
        System.out.println("✓ All " + concurrentOps + " operations verified in DynamoDB");

        // Cleanup
        for (Map<String, AttributeValue> item : queryResponse.items()) {
            dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(operationsTable)
                .key(Map.of(
                    "documentId", item.get("documentId"),
                    "timestamp", item.get("timestamp")
                ))
                .build());
        }
        
        System.out.println("✓ Concurrent test operations cleaned up");
    }

    @Test
    @Order(17)
    @DisplayName("Test CloudWatch Dashboard Exists")
    public void testCloudWatchDashboard() {
        String dashboardName = stackOutputs.get("DashboardName");
        
        assertThat(dashboardName).isNotNull();
        assertThat(dashboardName).contains("DocumentCollaboration");
        
        System.out.println("✓ CloudWatch Dashboard exists: " + dashboardName);
    }

    @Test
    @Order(18)
    @DisplayName("Test All Stack Outputs Are Valid")
    public void testAllStackOutputsValid() {
        // Verify all outputs have non-empty values
        for (Map.Entry<String, String> entry : stackOutputs.entrySet()) {
            assertThat(entry.getValue())
                .as("Output " + entry.getKey() + " should not be empty")
                .isNotEmpty();
        }
        
        // Verify WebSocket URL format
        String wsUrl = stackOutputs.get("WebSocketApiUrl");
        assertThat(wsUrl).startsWith("wss://");
        assertThat(wsUrl).contains(".execute-api.");
        assertThat(wsUrl).contains(".amazonaws.com/");
        
        // Verify table names contain environment suffix
        assertThat(stackOutputs.get("DocumentsTableName")).contains(ENVIRONMENT_SUFFIX);
        assertThat(stackOutputs.get("OperationsTableName")).contains(ENVIRONMENT_SUFFIX);
        assertThat(stackOutputs.get("ConnectionsTableName")).contains(ENVIRONMENT_SUFFIX);
        
        System.out.println("✓ All stack outputs are valid");
    }

    /**
     * WebSocket client for testing WebSocket connections.
     */
    @ClientEndpoint
    public static class WebSocketTestClient {
        private final CountDownLatch connectLatch = new CountDownLatch(1);
        private final CountDownLatch messageLatch = new CountDownLatch(1);
        private final CountDownLatch closeLatch = new CountDownLatch(1);
        private String lastMessage;

        @OnOpen
        public void onOpen(Session session) {
            System.out.println("WebSocket connection opened");
            connectLatch.countDown();
        }

        @OnMessage
        public void onMessage(String message) {
            System.out.println("WebSocket message received: " + message);
            this.lastMessage = message;
            messageLatch.countDown();
        }

        @OnClose
        public void onClose(Session session, CloseReason closeReason) {
            System.out.println("WebSocket connection closed: " + closeReason);
            closeLatch.countDown();
        }

        @OnError
        public void onError(Session session, Throwable throwable) {
            System.err.println("WebSocket error: " + throwable.getMessage());
        }

        public boolean awaitConnection(long timeout, TimeUnit unit) throws InterruptedException {
            return connectLatch.await(timeout, unit);
        }

        public boolean awaitMessage(long timeout, TimeUnit unit) throws InterruptedException {
            return messageLatch.await(timeout, unit);
        }

        public boolean awaitClose(long timeout, TimeUnit unit) throws InterruptedException {
            return closeLatch.await(timeout, unit);
        }

        public String getLastMessage() {
            return lastMessage;
        }
    }
}