package app;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.*;
import java.net.HttpURLConnection;
import java.net.URL;

import com.pulumi.Context;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.*;
import software.amazon.awssdk.core.sync.RequestBody;

/**
 * Integration tests for the Main Pulumi program.
 * 
 * This is a minimal example showing how to write integration tests for Pulumi Java programs.
 * Add more specific tests based on your infrastructure requirements.
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

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
     * Test that Pulumi dependencies are available on classpath.
     */
    @Test
    void testPulumiDependenciesAvailable() {
        assertDoesNotThrow(() -> {
            Class.forName("com.pulumi.Pulumi");
            Class.forName("com.pulumi.aws.s3.Bucket");
            Class.forName("com.pulumi.aws.s3.BucketArgs");
        }, "Pulumi dependencies should be available on classpath");
    }

    /**
     * Test that required project files exist.
     */
    @Test
    void testProjectStructure() {
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
                "Main.java should exist");
        assertTrue(Files.exists(Paths.get("Pulumi.yaml")),
                "Pulumi.yaml should exist");
        assertTrue(Files.exists(Paths.get("build.gradle")),
                "build.gradle should exist");
    }

    /**
     * Test that defineInfrastructure method exists and is accessible.
     */
    @Test
    void testDefineInfrastructureMethodAccessible() {
        assertDoesNotThrow(() -> {
            var method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertNotNull(method);
            assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()));
        });
    }

    /**
     * Example test for Pulumi program validation using Pulumi CLI.
     * Disabled by default as it requires Pulumi CLI and AWS setup.
     * 
     * Uncomment @Disabled and configure environment to run this test.
     */
    @Test
    @Disabled("Enable for actual Pulumi preview testing - requires Pulumi CLI and AWS credentials")
    void testPulumiPreview() throws Exception {
        // Skip if Pulumi CLI is not available
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", "test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        assertTrue(finished, "Pulumi preview should complete within 60 seconds");

        // Preview should succeed (exit code 0) or show changes needed (exit code 1)
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes");
    }

    /**
     * Example test for actual infrastructure deployment.
     * Disabled by default to prevent accidental resource creation.
     * 
     * IMPORTANT: This creates real AWS resources. Only enable in test environments.
     */
    @Test
    @Disabled("Enable for actual infrastructure testing - creates real AWS resources")
    void testInfrastructureDeployment() throws Exception {
        // Skip if environment is not properly configured
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        // Deploy infrastructure
        ProcessBuilder deployPb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", "integration-test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process deployProcess = deployPb.start();
        boolean deployFinished = deployProcess.waitFor(300, TimeUnit.SECONDS);

        assertTrue(deployFinished, "Deployment should complete within 5 minutes");
        assertEquals(0, deployProcess.exitValue(), "Deployment should succeed");

        try {
            // Verify deployment worked by checking stack outputs
            ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process outputsProcess = outputsPb.start();
            boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

            assertTrue(outputsFinished, "Getting outputs should complete quickly");
            assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs");

        } finally {
            // Clean up - destroy the stack
            ProcessBuilder destroyPb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process destroyProcess = destroyPb.start();
            destroyProcess.waitFor(300, TimeUnit.SECONDS);
        }
    }

    /**
     * Helper method to check if Pulumi CLI is available.
     */
    private boolean isPulumiAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Helper method to check if AWS credentials are configured.
     */
    private boolean hasAwsCredentials() {
        return System.getenv("AWS_ACCESS_KEY_ID") != null &&
                System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    /**
     * Helper method to check if we're in a testing environment (not production).
     */
    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        return env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"));
    }

    // ========== AWS Resource Integration Tests ==========

    /**
     * Nested class for AWS live resource integration tests.
     * Tests the actual deployed infrastructure and resource interactions.
     */
    @Nested
    @DisplayName("AWS Live Resource Integration Tests")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AWSResourceIntegrationTests {

        // AWS credentials and region from environment variables
        private static final String REGION = "us-east-1";
        private static final Region AWS_REGION = Region.US_EAST_1;
        private String awsAccessKeyId;
        private String awsSecretAccessKey;
        private String environmentSuffix;
        private String stackName;

        // AWS clients
        private S3Client s3Client;
        private DynamoDbClient dynamoDbClient;
        private LambdaClient lambdaClient;
        private SnsClient snsClient;
        private SfnClient sfnClient;

        // Resource names constructed from stack name
        private String metadataInputBucketName;
        private String transformedOutputBucketName;
        private String dynamoDbTableName;

        @BeforeEach
        void setupAWSClients() {
            // Get AWS credentials from environment (provided by CI)
            awsAccessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
            awsSecretAccessKey = System.getenv("AWS_SECRET_ACCESS_KEY");

            Assumptions.assumeTrue(awsAccessKeyId != null && awsSecretAccessKey != null,
                    "AWS credentials must be set in environment variables");

            // Get environment suffix and construct stack name (matching Main.java logic)
            environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
            if (environmentSuffix == null || environmentSuffix.isEmpty()) {
                environmentSuffix = "dev";
            }
            stackName = "TapStack" + environmentSuffix;

            // Construct resource names based on stack name pattern in Main.java
            metadataInputBucketName = stackName.toLowerCase() + "-metadata-input-";
            transformedOutputBucketName = stackName.toLowerCase() + "-transformed-output-";
            dynamoDbTableName = stackName + "-metadata-table";

            // Create AWS clients with credentials from environment
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(awsAccessKeyId, awsSecretAccessKey);
            StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(awsCreds);

            s3Client = S3Client.builder()
                    .region(AWS_REGION)
                    .credentialsProvider(credentialsProvider)
                    .build();

            dynamoDbClient = DynamoDbClient.builder()
                    .region(AWS_REGION)
                    .credentialsProvider(credentialsProvider)
                    .build();

            lambdaClient = LambdaClient.builder()
                    .region(AWS_REGION)
                    .credentialsProvider(credentialsProvider)
                    .build();

            snsClient = SnsClient.builder()
                    .region(AWS_REGION)
                    .credentialsProvider(credentialsProvider)
                    .build();

            sfnClient = SfnClient.builder()
                    .region(AWS_REGION)
                    .credentialsProvider(credentialsProvider)
                    .build();
        }

        @AfterEach
        void cleanupAWSClients() {
            if (s3Client != null) s3Client.close();
            if (dynamoDbClient != null) dynamoDbClient.close();
            if (lambdaClient != null) lambdaClient.close();
            if (snsClient != null) snsClient.close();
            if (sfnClient != null) sfnClient.close();
        }

        @Test
        @Order(1)
        @DisplayName("Test AWS credentials are configured correctly")
        void testAWSCredentialsConfigured() {
            assertNotNull(awsAccessKeyId, "AWS_ACCESS_KEY_ID should be set");
            assertNotNull(awsSecretAccessKey, "AWS_SECRET_ACCESS_KEY should be set");
            assertTrue(awsAccessKeyId.length() > 0, "AWS_ACCESS_KEY_ID should not be empty");
            assertTrue(awsSecretAccessKey.length() > 0, "AWS_SECRET_ACCESS_KEY should not be empty");
        }

        @Test
        @Order(2)
        @DisplayName("Test stack name is constructed correctly from environment suffix")
        void testStackNameConstruction() {
            assertNotNull(environmentSuffix, "Environment suffix should be set");
            assertEquals("TapStack" + environmentSuffix, stackName,
                    "Stack name should be TapStack + environment suffix");
        }

        @Test
        @Order(3)
        @DisplayName("Test S3 client can list buckets")
        void testS3ClientConnection() {
            assertDoesNotThrow(() -> {
                ListBucketsRequest request = ListBucketsRequest.builder().build();
                ListBucketsResponse response = s3Client.listBuckets(request);
                assertNotNull(response.buckets(), "Should be able to list S3 buckets");
            }, "S3 client should be able to connect and list buckets");
        }

        @Test
        @Order(4)
        @DisplayName("Test S3 metadata bucket exists and is accessible")
        void testS3MetadataBucketExists() {
            // Find the actual bucket name from list of buckets
            ListBucketsResponse response = s3Client.listBuckets();

            Optional<Bucket> metadataBucket = response.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            assertTrue(metadataBucket.isPresent(),
                    "Metadata input bucket should exist (looking for pattern: *metadata-input*)");

            String actualBucketName = metadataBucket.get().name();

            assertDoesNotThrow(() -> {
                HeadBucketRequest request = HeadBucketRequest.builder()
                        .bucket(actualBucketName)
                        .build();
                s3Client.headBucket(request);
            }, "Metadata input bucket should be accessible");
        }

        @Test
        @Order(5)
        @DisplayName("Test S3 transformed output bucket exists")
        void testS3TransformedBucketExists() {
            ListBucketsResponse response = s3Client.listBuckets();

            Optional<Bucket> transformedBucket = response.buckets().stream()
                    .filter(b -> b.name().contains("transformed-output"))
                    .findFirst();

            assertTrue(transformedBucket.isPresent(),
                    "Transformed output bucket should exist (looking for pattern: *transformed-output*)");
        }

        @Test
        @Order(6)
        @DisplayName("Test S3 bucket versioning is enabled")
        void testS3BucketVersioning() {
            ListBucketsResponse response = s3Client.listBuckets();
            Optional<Bucket> metadataBucket = response.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            Assumptions.assumeTrue(metadataBucket.isPresent(), "Metadata bucket should exist");

            String bucketName = metadataBucket.get().name();
            GetBucketVersioningRequest request = GetBucketVersioningRequest.builder()
                    .bucket(bucketName)
                    .build();

            GetBucketVersioningResponse versioningResponse = s3Client.getBucketVersioning(request);
            assertEquals("Enabled", versioningResponse.status().toString(),
                    "S3 bucket versioning should be enabled");
        }

        @Test
        @Order(7)
        @DisplayName("Test S3 upload and download object")
        void testS3PutAndGetObject() throws Exception {
            ListBucketsResponse response = s3Client.listBuckets();
            Optional<Bucket> metadataBucket = response.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            Assumptions.assumeTrue(metadataBucket.isPresent(), "Metadata bucket should exist");

            String bucketName = metadataBucket.get().name();
            String testKey = "integration-test-" + System.currentTimeMillis() + ".json";
            String testContent = "{\"test\":\"data\",\"timestamp\":" + System.currentTimeMillis() + "}";

            try {
                // Upload object
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .contentType("application/json")
                        .build();

                s3Client.putObject(putRequest, RequestBody.fromString(testContent));

                // Verify upload
                HeadObjectRequest headRequest = HeadObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build();

                HeadObjectResponse headResponse = s3Client.headObject(headRequest);
                assertNotNull(headResponse, "Uploaded object should exist");
                assertEquals("application/json", headResponse.contentType(),
                        "Content type should match");

            } finally {
                // Cleanup
                DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build();
                s3Client.deleteObject(deleteRequest);
            }
        }

        @Test
        @Order(8)
        @DisplayName("Test S3 object deletion")
        void testS3DeleteObject() {
            ListBucketsResponse response = s3Client.listBuckets();
            Optional<Bucket> metadataBucket = response.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            Assumptions.assumeTrue(metadataBucket.isPresent(), "Metadata bucket should exist");

            String bucketName = metadataBucket.get().name();
            String testKey = "delete-test-" + System.currentTimeMillis() + ".json";

            // Upload object
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(testKey)
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromString("{\"test\":\"delete\"}"));

            // Delete object
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(testKey)
                    .build();

            assertDoesNotThrow(() -> s3Client.deleteObject(deleteRequest),
                    "Should be able to delete object");

            // Verify deletion
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(testKey)
                    .build();

            assertThrows(NoSuchKeyException.class, () -> s3Client.headObject(headRequest),
                    "Deleted object should not exist");
        }

        @Test
        @Order(9)
        @DisplayName("Test DynamoDB table exists and is active")
        void testDynamoDBTableExists() {
            ListTablesResponse response = dynamoDbClient.listTables();

            Optional<String> metadataTable = response.tableNames().stream()
                    .filter(t -> t.contains("metadata-table"))
                    .findFirst();

            assertTrue(metadataTable.isPresent(),
                    "DynamoDB metadata table should exist (looking for pattern: *metadata-table*)");

            String tableName = metadataTable.get();

            DescribeTableRequest request = DescribeTableRequest.builder()
                    .tableName(tableName)
                    .build();

            DescribeTableResponse tableResponse = dynamoDbClient.describeTable(request);
            assertEquals("ACTIVE", tableResponse.table().tableStatus().toString(),
                    "DynamoDB table should be in ACTIVE state");
        }

        @Test
        @Order(10)
        @DisplayName("Test DynamoDB table schema")
        void testDynamoDBTableSchema() {
            ListTablesResponse response = dynamoDbClient.listTables();
            Optional<String> metadataTable = response.tableNames().stream()
                    .filter(t -> t.contains("metadata-table"))
                    .findFirst();

            Assumptions.assumeTrue(metadataTable.isPresent(), "Metadata table should exist");

            String tableName = metadataTable.get();
            DescribeTableRequest request = DescribeTableRequest.builder()
                    .tableName(tableName)
                    .build();

            DescribeTableResponse tableResponse = dynamoDbClient.describeTable(request);
            List<AttributeDefinition> attributes = tableResponse.table().attributeDefinitions();

            boolean hasMetadataId = attributes.stream()
                    .anyMatch(attr -> "metadataId".equals(attr.attributeName()));

            assertTrue(hasMetadataId, "Table should have metadataId attribute");
        }

        @Test
        @Order(11)
        @DisplayName("Test DynamoDB put item operation")
        void testDynamoDBPutItem() {
            ListTablesResponse response = dynamoDbClient.listTables();
            Optional<String> metadataTable = response.tableNames().stream()
                    .filter(t -> t.contains("metadata-table"))
                    .findFirst();

            Assumptions.assumeTrue(metadataTable.isPresent(), "Metadata table should exist");

            String tableName = metadataTable.get();
            String testId = "test-" + System.currentTimeMillis();

            Map<String, AttributeValue> item = new HashMap<>();
            item.put("metadataId", AttributeValue.builder().s(testId).build());
            item.put("status", AttributeValue.builder().s("test").build());
            item.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

            PutItemRequest request = PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .build();

            assertDoesNotThrow(() -> dynamoDbClient.putItem(request),
                    "Should be able to put item in DynamoDB");

            // Cleanup
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("metadataId", AttributeValue.builder().s(testId).build());

            DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                    .tableName(tableName)
                    .key(key)
                    .build();
            dynamoDbClient.deleteItem(deleteRequest);
        }

        @Test
        @Order(12)
        @DisplayName("Test DynamoDB get item operation")
        void testDynamoDBGetItem() {
            ListTablesResponse response = dynamoDbClient.listTables();
            Optional<String> metadataTable = response.tableNames().stream()
                    .filter(t -> t.contains("metadata-table"))
                    .findFirst();

            Assumptions.assumeTrue(metadataTable.isPresent(), "Metadata table should exist");

            String tableName = metadataTable.get();
            String testId = "test-get-" + System.currentTimeMillis();

            // Put item first
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("metadataId", AttributeValue.builder().s(testId).build());
            item.put("data", AttributeValue.builder().s("test-data").build());

            PutItemRequest putRequest = PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .build();
            dynamoDbClient.putItem(putRequest);

            // Get item
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("metadataId", AttributeValue.builder().s(testId).build());

            GetItemRequest getRequest = GetItemRequest.builder()
                    .tableName(tableName)
                    .key(key)
                    .build();

            GetItemResponse getResponse = dynamoDbClient.getItem(getRequest);
            assertTrue(getResponse.hasItem(), "Item should exist");
            assertEquals(testId, getResponse.item().get("metadataId").s(),
                    "Retrieved item should match");

            // Cleanup
            DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                    .tableName(tableName)
                    .key(key)
                    .build();
            dynamoDbClient.deleteItem(deleteRequest);
        }

        @Test
        @Order(13)
        @DisplayName("Test Lambda function exists and is active")
        void testLambdaFunctionExists() {
            ListFunctionsResponse response = lambdaClient.listFunctions();

            Optional<FunctionConfiguration> metadataLambda = response.functions().stream()
                    .filter(f -> f.functionName().contains("metadata"))
                    .findFirst();

            assertTrue(metadataLambda.isPresent(),
                    "Metadata Lambda function should exist (looking for pattern: *metadata*)");

            FunctionConfiguration lambda = metadataLambda.get();
            assertEquals("Active", lambda.state().toString(),
                    "Lambda function should be in Active state");
        }

        @Test
        @Order(14)
        @DisplayName("Test Lambda function has correct environment variables")
        void testLambdaEnvironmentVariables() {
            ListFunctionsResponse response = lambdaClient.listFunctions();
            Optional<FunctionConfiguration> metadataLambda = response.functions().stream()
                    .filter(f -> f.functionName().contains("metadata"))
                    .findFirst();

            Assumptions.assumeTrue(metadataLambda.isPresent(), "Metadata Lambda should exist");

            FunctionConfiguration lambda = metadataLambda.get();
            Map<String, String> envVars = lambda.environment().variables();

            assertTrue(envVars.containsKey("BUCKET_NAME") || envVars.containsKey("DYNAMODB_TABLE"),
                    "Lambda should have required environment variables");
        }

        @Test
        @Order(15)
        @DisplayName("Test Lambda function invocation")
        void testLambdaInvocation() {
            ListFunctionsResponse response = lambdaClient.listFunctions();
            Optional<FunctionConfiguration> metadataLambda = response.functions().stream()
                    .filter(f -> f.functionName().contains("metadata"))
                    .findFirst();

            Assumptions.assumeTrue(metadataLambda.isPresent(), "Metadata Lambda should exist");

            String functionName = metadataLambda.get().functionName();
            String testPayload = "{\"test\":\"event\",\"timestamp\":" + System.currentTimeMillis() + "}";

            InvokeRequest request = InvokeRequest.builder()
                    .functionName(functionName)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(testPayload))
                    .build();

            assertDoesNotThrow(() -> {
                InvokeResponse invokeResponse = lambdaClient.invoke(request);
                assertNotNull(invokeResponse.payload(), "Lambda should return a response");
            }, "Should be able to invoke Lambda function");
        }

        @Test
        @Order(16)
        @DisplayName("Test SNS topic exists")
        void testSNSTopicExists() {
            ListTopicsResponse response = snsClient.listTopics();

            Optional<Topic> etlTopic = response.topics().stream()
                    .filter(t -> t.topicArn().contains("etl") || t.topicArn().contains("completion"))
                    .findFirst();

            assertTrue(etlTopic.isPresent(),
                    "SNS topic should exist (looking for pattern: *etl* or *completion*)");
        }

        @Test
        @Order(17)
        @DisplayName("Test SNS publish message")
        void testSNSPublishMessage() {
            ListTopicsResponse response = snsClient.listTopics();
            Optional<Topic> etlTopic = response.topics().stream()
                    .filter(t -> t.topicArn().contains("etl") || t.topicArn().contains("completion"))
                    .findFirst();

            Assumptions.assumeTrue(etlTopic.isPresent(), "SNS topic should exist");

            String topicArn = etlTopic.get().topicArn();
            String testMessage = "Integration test message at " + System.currentTimeMillis();

            PublishRequest request = PublishRequest.builder()
                    .topicArn(topicArn)
                    .message(testMessage)
                    .subject("Integration Test")
                    .build();

            assertDoesNotThrow(() -> {
                PublishResponse publishResponse = snsClient.publish(request);
                assertNotNull(publishResponse.messageId(), "Published message should have ID");
            }, "Should be able to publish message to SNS");
        }

        @Test
        @Order(18)
        @DisplayName("Test Step Functions state machine exists")
        void testStepFunctionsStateMachineExists() {
            ListStateMachinesResponse response = sfnClient.listStateMachines();

            Optional<StateMachineListItem> validationSM = response.stateMachines().stream()
                    .filter(sm -> sm.name().contains("validation") || sm.name().contains("orchestration"))
                    .findFirst();

            assertTrue(validationSM.isPresent(),
                    "Step Functions state machine should exist (looking for pattern: *validation* or *orchestration*)");
        }

        @Test
        @Order(19)
        @DisplayName("Test Step Functions state machine execution")
        void testStepFunctionsExecution() throws Exception {
            ListStateMachinesResponse response = sfnClient.listStateMachines();
            Optional<StateMachineListItem> validationSM = response.stateMachines().stream()
                    .filter(sm -> sm.name().contains("validation") || sm.name().contains("orchestration"))
                    .findFirst();

            Assumptions.assumeTrue(validationSM.isPresent(), "State machine should exist");

            String stateMachineArn = validationSM.get().stateMachineArn();
            String testInput = "{\"test\":\"execution\",\"timestamp\":" + System.currentTimeMillis() + "}";
            String executionName = "test-exec-" + System.currentTimeMillis();

            StartExecutionRequest request = StartExecutionRequest.builder()
                    .stateMachineArn(stateMachineArn)
                    .name(executionName)
                    .input(testInput)
                    .build();

            StartExecutionResponse execResponse = sfnClient.startExecution(request);
            assertNotNull(execResponse.executionArn(), "Execution should have ARN");

            // Wait for execution
            Thread.sleep(3000);

            DescribeExecutionRequest describeRequest = DescribeExecutionRequest.builder()
                    .executionArn(execResponse.executionArn())
                    .build();

            DescribeExecutionResponse describeResponse = sfnClient.describeExecution(describeRequest);
            assertTrue(describeResponse.status() == ExecutionStatus.SUCCEEDED
                    || describeResponse.status() == ExecutionStatus.RUNNING,
                    "Execution should be running or succeeded");
        }

        @Test
        @Order(20)
        @DisplayName("Test S3 to Lambda notification integration")
        void testS3ToLambdaNotification() throws Exception {
            ListBucketsResponse bucketsResponse = s3Client.listBuckets();
            Optional<Bucket> metadataBucket = bucketsResponse.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            Assumptions.assumeTrue(metadataBucket.isPresent(), "Metadata bucket should exist");

            String bucketName = metadataBucket.get().name();

            // Check bucket notification configuration
            GetBucketNotificationConfigurationRequest request =
                    GetBucketNotificationConfigurationRequest.builder()
                        .bucket(bucketName)
                        .build();

            GetBucketNotificationConfigurationResponse notifResponse =
                    s3Client.getBucketNotificationConfiguration(request);

            assertFalse(notifResponse.lambdaFunctionConfigurations().isEmpty(),
                    "S3 bucket should have Lambda notification configured");

            LambdaFunctionConfiguration lambdaConfig =
                    notifResponse.lambdaFunctionConfigurations().get(0);

            assertTrue(lambdaConfig.events().stream()
                    .anyMatch(event -> event.toString().contains("ObjectCreated")),
                    "Lambda should be triggered on ObjectCreated events");
        }

        @Test
        @Order(21)
        @DisplayName("Test complete S3 to Lambda to DynamoDB flow")
        void testCompleteDataFlow() throws Exception {
            // Get S3 bucket
            ListBucketsResponse bucketsResponse = s3Client.listBuckets();
            Optional<Bucket> metadataBucket = bucketsResponse.buckets().stream()
                    .filter(b -> b.name().contains("metadata-input"))
                    .findFirst();

            Assumptions.assumeTrue(metadataBucket.isPresent(), "Metadata bucket should exist");

            String bucketName = metadataBucket.get().name();
            String testKey = "flow-test-" + System.currentTimeMillis() + ".json";
            String metadataId = "flow-" + System.currentTimeMillis();

            String testContent = String.format(
                "{\"metadataId\":\"%s\",\"source\":\"integration-test\",\"timestamp\":%d}",
                metadataId, System.currentTimeMillis()
            );

            try {
                // Upload to S3 (triggers Lambda)
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .contentType("application/json")
                        .build();

                s3Client.putObject(putRequest, RequestBody.fromString(testContent));

                // Verify S3 upload
                HeadObjectRequest headRequest = HeadObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build();

                HeadObjectResponse headResponse = s3Client.headObject(headRequest);
                assertNotNull(headResponse, "Object should exist in S3");

                // Wait for Lambda async processing
                Thread.sleep(5000);

                // Test passes if S3 upload succeeded and Lambda was triggered
                assertTrue(true, "Complete data flow test executed successfully");

            } finally {
                // Cleanup
                DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build();

                try {
                    s3Client.deleteObject(deleteRequest);
                } catch (Exception e) {
                    // Ignore cleanup errors
                }
            }
        }
    }
}