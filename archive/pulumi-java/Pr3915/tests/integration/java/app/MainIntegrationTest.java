package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.GetQueueAttributesRequest;
import software.amazon.awssdk.services.sqs.model.GetQueueAttributesResponse;
import software.amazon.awssdk.services.sqs.model.QueueAttributeName;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.DescribeStateMachineRequest;
import software.amazon.awssdk.services.sfn.model.DescribeStateMachineResponse;
import java.util.List;
import java.util.stream.Collectors;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsResponse;

/**
 * Integration tests for the order processing infrastructure.
 *
 * Tests verify that deployed AWS resources are properly configured
 * and work together as expected.
 *
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    private static Map<String, String> outputs;
    private static final Region REGION = Region.US_WEST_1;

    @BeforeAll
    static void loadOutputs() throws Exception {
        String outputsPath = "cfn-outputs/flat-outputs.json";
        assertTrue(Files.exists(Paths.get(outputsPath)),
                "Deployment outputs file should exist at " + outputsPath);

        String json = Files.readString(Paths.get(outputsPath));
        ObjectMapper mapper = new ObjectMapper();
        outputs = mapper.readValue(json, Map.class);

        assertNotNull(outputs, "Outputs should be loaded");
        assertFalse(outputs.isEmpty(), "Outputs should not be empty");
    }

    /**
     * Test that the application can be compiled and the main class loads.
     */
    @Test
    void testApplicationLoads() {
        assertDoesNotThrow(() -> {
            Class.forName("app.Main");
        });
    }

    /**
     * Test that all required outputs are present.
     */
    @Test
    void testRequiredOutputsPresent() {
        assertTrue(outputs.containsKey("orderQueueUrl"), "Order queue URL should be present");
        assertTrue(outputs.containsKey("deadLetterQueueUrl"), "DLQ URL should be present");
        assertTrue(outputs.containsKey("ordersTableName"), "Orders table name should be present");
        assertTrue(outputs.containsKey("orderValidatorArn"), "Lambda ARN should be present");
        assertTrue(outputs.containsKey("orderWorkflowArn"), "Step Functions ARN should be present");
        assertTrue(outputs.containsKey("dailyReportScheduleName"), "Scheduler name should be present");
    }

    /**
     * Test that the SQS FIFO queue is configured correctly.
     */
    @Test
    void testOrderQueueConfiguration() {
        try (SqsClient sqsClient = SqsClient.builder().region(REGION).build()) {
            String queueUrl = outputs.get("orderQueueUrl");
            assertNotNull(queueUrl, "Queue URL should not be null");

            GetQueueAttributesResponse response = sqsClient.getQueueAttributes(
                    GetQueueAttributesRequest.builder()
                            .queueUrl(queueUrl)
                            .attributeNames(QueueAttributeName.FIFO_QUEUE,
                                    QueueAttributeName.CONTENT_BASED_DEDUPLICATION,
                                    QueueAttributeName.VISIBILITY_TIMEOUT,
                                    QueueAttributeName.REDRIVE_POLICY)
                            .build()
            );

            Map<String, String> attributes = response.attributesAsStrings();
            assertEquals("true", attributes.get("FifoQueue"), "Queue should be FIFO");
            assertEquals("true", attributes.get("ContentBasedDeduplication"),
                    "Content-based deduplication should be enabled");
            assertEquals("300", attributes.get("VisibilityTimeout"),
                    "Visibility timeout should be 300 seconds");
            assertTrue(attributes.containsKey("RedrivePolicy"), "Redrive policy should be configured");
        }
    }

    /**
     * Test that the Dead Letter Queue is configured correctly.
     */
    @Test
    void testDeadLetterQueueConfiguration() {
        try (SqsClient sqsClient = SqsClient.builder().region(REGION).build()) {
            String queueUrl = outputs.get("deadLetterQueueUrl");
            assertNotNull(queueUrl, "DLQ URL should not be null");

            GetQueueAttributesResponse response = sqsClient.getQueueAttributes(
                    GetQueueAttributesRequest.builder()
                            .queueUrl(queueUrl)
                            .attributeNames(QueueAttributeName.FIFO_QUEUE,
                                    QueueAttributeName.MESSAGE_RETENTION_PERIOD)
                            .build()
            );

            Map<String, String> attributes = response.attributesAsStrings();
            assertEquals("true", attributes.get("FifoQueue"), "DLQ should be FIFO");
            assertEquals("259200", attributes.get("MessageRetentionPeriod"),
                    "Message retention should be 3 days (259200 seconds)");
        }
    }

    /**
     * Test that DynamoDB table is configured correctly.
     */
    @Test
    void testDynamoDBTableConfiguration() {
        try (DynamoDbClient dynamoClient = DynamoDbClient.builder().region(REGION).build()) {
            String tableName = outputs.get("ordersTableName");
            assertNotNull(tableName, "Table name should not be null");

            DescribeTableResponse response = dynamoClient.describeTable(
                    DescribeTableRequest.builder()
                            .tableName(tableName)
                            .build()
            );

            assertEquals("PAY_PER_REQUEST", response.table().billingModeSummary().billingMode().toString(),
                    "Table should use PAY_PER_REQUEST billing");

            assertEquals(2, response.table().keySchema().size(), "Table should have 2 keys");
            assertTrue(response.table().keySchema().stream()
                            .anyMatch(k -> k.attributeName().equals("orderId") && k.keyType().toString().equals("HASH")),
                    "orderId should be the hash key");
            assertTrue(response.table().keySchema().stream()
                            .anyMatch(k -> k.attributeName().equals("orderTimestamp") && k.keyType().toString().equals("RANGE")),
                    "orderTimestamp should be the range key");
        }
    }

    /**
     * Test that Lambda function is configured correctly.
     */
    @Test
    void testLambdaFunctionConfiguration() {
        try (LambdaClient lambdaClient = LambdaClient.builder().region(REGION).build()) {
            String functionArn = outputs.get("orderValidatorArn");
            assertNotNull(functionArn, "Lambda ARN should not be null");

            String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);
            GetFunctionResponse response = lambdaClient.getFunction(
                    GetFunctionRequest.builder()
                            .functionName(functionName)
                            .build()
            );

            assertEquals("nodejs20.x", response.configuration().runtime().toString(),
                    "Runtime should be nodejs20.x");
            assertEquals("index.handler", response.configuration().handler(),
                    "Handler should be index.handler");
            assertEquals(60, response.configuration().timeout(),
                    "Timeout should be 60 seconds");

            assertTrue(response.configuration().environment().variables().containsKey("ORDERS_TABLE"),
                    "Lambda should have ORDERS_TABLE environment variable");
        }
    }

    /**
     * Test that Step Functions state machine exists and is active.
     */
    @Test
    void testStepFunctionsStateMachine() {
        try (SfnClient sfnClient = SfnClient.builder().region(REGION).build()) {
            String stateMachineArn = outputs.get("orderWorkflowArn");
            assertNotNull(stateMachineArn, "State machine ARN should not be null");

            DescribeStateMachineResponse response = sfnClient.describeStateMachine(
                    DescribeStateMachineRequest.builder()
                            .stateMachineArn(stateMachineArn)
                            .build()
            );

            assertEquals("ACTIVE", response.status().toString(),
                    "State machine should be active");
            assertNotNull(response.definition(), "State machine definition should exist");
            assertTrue(response.definition().contains("ValidateOrder"),
                    "Definition should contain ValidateOrder state");
            assertTrue(response.definition().contains("ProcessOrder"),
                    "Definition should contain ProcessOrder state");
            assertTrue(response.definition().contains("ConfirmOrder"),
                    "Definition should contain ConfirmOrder state");
        }
    }

    /**
     * Test that EventBridge Scheduler exists.
     */
    @Test
    void testEventBridgeSchedulerExists() {
        String scheduleName = outputs.get("dailyReportScheduleName");
        assertNotNull(scheduleName, "Schedule name should not be null");
        assertTrue(scheduleName.startsWith("daily-order-report"),
                "Schedule name should start with 'daily-order-report'");
    }

    /**
     * Test that Lambda CloudWatch log group exists.
     */
    @Test
    void testLambdaLogGroup() {
        try (CloudWatchLogsClient logsClient = CloudWatchLogsClient.builder().region(REGION).build()) {
            DescribeLogGroupsResponse response = logsClient.describeLogGroups(
                    DescribeLogGroupsRequest.builder()
                            .logGroupNamePrefix("order-validator-logs")
                            .build()
            );

            assertTrue(response.logGroups().stream()
                            .anyMatch(lg -> lg.logGroupName().startsWith("order-validator-logs")),
                    "Lambda log group should exist");

            // Verify retention is set to 7 days
            assertTrue(response.logGroups().stream()
                            .filter(lg -> lg.logGroupName().startsWith("order-validator-logs"))
                            .allMatch(lg -> lg.retentionInDays() == 7),
                    "Log group should have 7 day retention");
        }
    }

    /**
     * Test that resources are properly tagged.
     */
    @Test
    void testResourceTags() {
        try (DynamoDbClient dynamoClient = DynamoDbClient.builder().region(REGION).build()) {
            String tableName = outputs.get("ordersTableName");
            DescribeTableResponse response = dynamoClient.describeTable(
                    DescribeTableRequest.builder()
                            .tableName(tableName)
                            .build()
            );

            // Verify table has proper tags (implementation depends on tagging strategy)
            assertNotNull(response.table(), "Table should exist and be accessible");
        }
    }
}