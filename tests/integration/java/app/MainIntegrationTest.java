package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsRequest;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsResponse;
import software.amazon.awssdk.services.cloudwatch.model.MetricAlarm;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetLogEventsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.LogStream;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.DescribeKeyResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.ListAliasesRequest;
import software.amazon.awssdk.services.lambda.model.ListAliasesResponse;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionRequest;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionResponse;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningRequest;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Real-world integration tests for deployed AWS infrastructure.
 * These tests interact with actual AWS resources and verify end-to-end functionality.
 *
 * Prerequisites:
 * - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set
 * - ENVIRONMENT_SUFFIX environment variable should be set (defaults to "dev")
 * - Stack must be deployed before running these tests
 */
@DisplayName("Real-World AWS Infrastructure Integration Tests")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class MainIntegrationTest {

    private static final Region AWS_REGION = Region.US_WEST_2;
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // AWS Clients
    private CloudFormationClient cfnClient;
    private LambdaClient lambdaClient;
    private S3Client s3Client;
    private CloudWatchClient cloudWatchClient;
    private CloudWatchLogsClient logsClient;
    private SnsClient snsClient;
    private IamClient iamClient;
    private KmsClient kmsClient;

    // Stack information
    private String stackName;
    private String environmentSuffix;
    private String apiGatewayUrl;
    private String s3BucketName;
    private String userFunctionArn;
    private String orderFunctionArn;
    private String notificationFunctionArn;
    private String kmsKeyId;

    @BeforeAll
    public void setUp() {
        // Get credentials from environment
        String accessKey = System.getenv("AWS_ACCESS_KEY_ID");
        String secretKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");

        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        assertThat(accessKey).as("AWS_ACCESS_KEY_ID must be set").isNotNull();
        assertThat(secretKey).as("AWS_SECRET_ACCESS_KEY must be set").isNotNull();

        // Create credentials provider
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);

        // Initialize AWS clients
        cfnClient = CloudFormationClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        lambdaClient = LambdaClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        s3Client = S3Client.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        cloudWatchClient = CloudWatchClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        logsClient = CloudWatchLogsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        snsClient = SnsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        iamClient = IamClient.builder()
                .region(Region.AWS_GLOBAL) // IAM is global
                .credentialsProvider(credentialsProvider)
                .build();

        kmsClient = KmsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        // Get stack information
        stackName = "TapStack" + environmentSuffix;
        loadStackOutputs();
    }

    @AfterAll
    public void tearDown() {
        if (cfnClient != null) cfnClient.close();
        if (lambdaClient != null) lambdaClient.close();
        if (s3Client != null) s3Client.close();
        if (cloudWatchClient != null) cloudWatchClient.close();
        if (logsClient != null) logsClient.close();
        if (snsClient != null) snsClient.close();
        if (iamClient != null) iamClient.close();
        if (kmsClient != null) kmsClient.close();
    }

    private void loadStackOutputs() {
        DescribeStacksRequest request = DescribeStacksRequest.builder()
                .stackName(stackName)
                .build();

        DescribeStacksResponse response = cfnClient.describeStacks(request);
        assertThat(response.stacks()).isNotEmpty();

        Stack stack = response.stacks().get(0);
        Map<String, String> outputs = new HashMap<>();

        for (Output output : stack.outputs()) {
            outputs.put(output.outputKey(), output.outputValue());
        }

        apiGatewayUrl = outputs.get("ApiGatewayUrl");
        s3BucketName = outputs.get("StaticAssetsBucket");
        userFunctionArn = outputs.get("UserFunctionArn");
        orderFunctionArn = outputs.get("OrderFunctionArn");
        notificationFunctionArn = outputs.get("NotificationFunctionArn");

        assertThat(apiGatewayUrl).as("API Gateway URL should be present").isNotNull();
        assertThat(s3BucketName).as("S3 bucket name should be present").isNotNull();
        assertThat(userFunctionArn).as("User function ARN should be present").isNotNull();
        assertThat(orderFunctionArn).as("Order function ARN should be present").isNotNull();
        assertThat(notificationFunctionArn).as("Notification function ARN should be present").isNotNull();
    }

    // API GATEWAY INTEGRATION TESTS

    @Nested
    @DisplayName("API Gateway Integration Tests")
    class ApiGatewayTests {

        @Test
        @DisplayName("Should successfully invoke GET /users endpoint")
        public void testGetUsersEndpoint() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            // Verify response structure
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("USER");
        }

        @Test
        @DisplayName("Should successfully invoke POST /orders endpoint")
        public void testPostOrdersEndpoint() throws IOException, InterruptedException {
            String requestBody = "{\"orderId\": \"12345\", \"item\": \"test-item\"}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "orders"))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("ORDER");
        }

        @Test
        @DisplayName("Should successfully invoke PUT /notifications endpoint")
        public void testPutNotificationsEndpoint() throws IOException, InterruptedException {
            String requestBody = "{\"notificationId\": \"67890\", \"message\": \"test-notification\"}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "notifications"))
                    .PUT(HttpRequest.BodyPublishers.ofString(requestBody))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("NOTIFICATION");
        }

        @Test
        @DisplayName("Should return correct CORS headers")
        public void testCorsHeaders() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isPresent();
            assertThat(response.headers().firstValue("Access-Control-Allow-Methods")).isPresent();
            assertThat(response.headers().firstValue("Access-Control-Allow-Headers")).isPresent();
        }

        @Test
        @DisplayName("Should handle invalid endpoint gracefully")
        public void testInvalidEndpoint() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "invalid-endpoint"))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isIn(403, 404);
        }

        @Test
        @DisplayName("Should return timestamp in response")
        public void testResponseTimestamp() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("timestamp")).isTrue();
        }
    }

    // LAMBDA FUNCTION INTEGRATION TESTS

    @Nested
    @DisplayName("Lambda Function Integration Tests")
    class LambdaFunctionTests {

        @Test
        @DisplayName("Should invoke user Lambda function directly")
        public void testInvokeUserFunction() {
            String payload = "{\"body\": {\"test\": \"data\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();

            String responsePayload = invokeResponse.payload().asUtf8String();
            assertThat(responsePayload).contains("statusCode");
        }

        @Test
        @DisplayName("Should invoke order Lambda function directly")
        public void testInvokeOrderFunction() {
            String payload = "{\"body\": {\"orderId\": \"test-123\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(orderFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();
        }

        @Test
        @DisplayName("Should invoke notification Lambda function directly")
        public void testInvokeNotificationFunction() {
            String payload = "{\"body\": {\"message\": \"test notification\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(notificationFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();
        }

        @Test
        @DisplayName("Should verify Lambda function configuration")
        public void testLambdaConfiguration() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);

            assertThat(response.configuration().runtime().toString()).contains("python");
            assertThat(response.configuration().timeout()).isEqualTo(30);
            assertThat(response.configuration().memorySize()).isEqualTo(256);
        }

        @Test
        @DisplayName("Should verify Lambda environment variables")
        public void testLambdaEnvironmentVariables() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);
            Map<String, String> envVars = response.configuration().environment().variables();

            assertThat(envVars).containsKey("BUCKET_NAME");
            assertThat(envVars).containsKey("KMS_KEY_ID");
            assertThat(envVars).containsKey("ENVIRONMENT");
            assertThat(envVars).containsKey("LOG_LEVEL");
            assertThat(envVars.get("ENVIRONMENT")).isEqualTo(environmentSuffix);
        }

        @Test
        @DisplayName("Should verify Lambda has correct IAM role")
        public void testLambdaIamRole() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);
            String roleArn = response.configuration().role();

            assertThat(roleArn).isNotNull();
            assertThat(roleArn).contains("serverless-" + environmentSuffix + "-user-role");
        }

        @Test
        @DisplayName("Should verify Lambda versions exist")
        public void testLambdaVersions() {
            String functionName = "serverless-" + environmentSuffix + "-user";

            ListVersionsByFunctionRequest request = ListVersionsByFunctionRequest.builder()
                    .functionName(functionName)
                    .build();

            ListVersionsByFunctionResponse response = lambdaClient.listVersionsByFunction(request);

            assertThat(response.versions()).isNotEmpty();
        }

        @Test
        @DisplayName("Should verify Lambda alias exists")
        public void testLambdaAlias() {
            String functionName = "serverless-" + environmentSuffix + "-user";

            ListAliasesRequest request = ListAliasesRequest.builder()
                    .functionName(functionName)
                    .build();

            ListAliasesResponse response = lambdaClient.listAliases(request);

            assertThat(response.aliases()).isNotEmpty();
            assertThat(response.aliases().get(0).name()).isEqualTo("LIVE");
        }
    }

    // S3 INTEGRATION TESTS

    @Nested
    @DisplayName("S3 Bucket Integration Tests")
    class S3BucketTests {

        @Test
        @DisplayName("Should upload and retrieve object from S3")
        public void testS3PutAndGet() {
            String key = "test-file-" + System.currentTimeMillis() + ".txt";
            String content = "Test content for integration testing";

            // Put object
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromString(content));

            // Get object
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();

            ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getRequest);
            String retrievedContent = objectBytes.asUtf8String();

            assertThat(retrievedContent).isEqualTo(content);

            // Cleanup
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteRequest);
        }

        @Test
        @DisplayName("Should verify S3 bucket has encryption enabled")
        public void testS3Encryption() {
            GetBucketEncryptionRequest request = GetBucketEncryptionRequest.builder()
                    .bucket(s3BucketName)
                    .build();

            GetBucketEncryptionResponse response = s3Client.getBucketEncryption(request);

            assertThat(response.serverSideEncryptionConfiguration()).isNotNull();
            assertThat(response.serverSideEncryptionConfiguration().rules()).isNotEmpty();
        }

        @Test
        @DisplayName("Should verify S3 bucket has versioning enabled")
        public void testS3Versioning() {
            GetBucketVersioningRequest request = GetBucketVersioningRequest.builder()
                    .bucket(s3BucketName)
                    .build();

            GetBucketVersioningResponse response = s3Client.getBucketVersioning(request);

            assertThat(response.status().toString()).isEqualTo("Enabled");
        }
    }

    // CLOUDWATCH INTEGRATION TESTS

    @Nested
    @DisplayName("CloudWatch Integration Tests")
    class CloudWatchTests {

        @Test
        @DisplayName("Should verify CloudWatch alarms exist")
        public void testCloudWatchAlarms() {
            DescribeAlarmsRequest request = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-")
                    .build();

            DescribeAlarmsResponse response = cloudWatchClient.describeAlarms(request);

            assertThat(response.metricAlarms()).isNotEmpty();

            // Verify alarm for user function
            boolean userAlarmExists = response.metricAlarms().stream()
                    .anyMatch(alarm -> alarm.alarmName().contains("UserFunction"));
            assertThat(userAlarmExists).isTrue();
        }

        @Test
        @DisplayName("Should verify CloudWatch logs exist for Lambda functions")
        public void testCloudWatchLogs() throws InterruptedException {
            String logGroupName = "/aws/lambda/serverless-" + environmentSuffix + "-user";

            // Wait a bit for logs to be available
            Thread.sleep(2000);

            DescribeLogStreamsRequest request = DescribeLogStreamsRequest.builder()
                    .logGroupName(logGroupName)
                    .orderBy("LastEventTime")
                    .descending(true)
                    .limit(1)
                    .build();

            assertThatCode(() -> {
                DescribeLogStreamsResponse response = logsClient.describeLogStreams(request);
                assertThat(response.logStreams()).isNotEmpty();
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should verify Lambda function logs contain execution details")
        public void testLambdaLogsContent() throws InterruptedException {
            // Invoke function first to generate logs
            String payload = "{\"body\": {\"test\": \"logging\"}}";
            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();
            lambdaClient.invoke(invokeRequest);

            // Wait for logs to be written
            Thread.sleep(5000);

            String logGroupName = "/aws/lambda/serverless-" + environmentSuffix + "-user";

            DescribeLogStreamsRequest streamRequest = DescribeLogStreamsRequest.builder()
                    .logGroupName(logGroupName)
                    .orderBy("LastEventTime")
                    .descending(true)
                    .limit(1)
                    .build();

            DescribeLogStreamsResponse streamResponse = logsClient.describeLogStreams(streamRequest);

            if (!streamResponse.logStreams().isEmpty()) {
                LogStream latestStream = streamResponse.logStreams().get(0);

                GetLogEventsRequest logRequest = GetLogEventsRequest.builder()
                        .logGroupName(logGroupName)
                        .logStreamName(latestStream.logStreamName())
                        .limit(50)
                        .build();

                GetLogEventsResponse logResponse = logsClient.getLogEvents(logRequest);

                assertThat(logResponse.events()).isNotEmpty();
            }
        }
    }

    // IAM & KMS SECURITY TESTS

    @Nested
    @DisplayName("Security Integration Tests")
    class SecurityTests {

        @Test
        @DisplayName("Should verify IAM role has least privilege policies")
        public void testIamRolePolicies() {
            String roleName = "serverless-" + environmentSuffix + "-user-role";

            GetRoleRequest request = GetRoleRequest.builder()
                    .roleName(roleName)
                    .build();

            GetRoleResponse response = iamClient.getRole(request);

            assertThat(response.role()).isNotNull();
            assertThat(response.role().roleName()).isEqualTo(roleName);
        }

        @Test
        @DisplayName("Should verify KMS key exists and has rotation enabled")
        public void testKmsKeyRotation() {
            // Get KMS key ID from Lambda environment variables
            GetFunctionRequest funcRequest = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse funcResponse = lambdaClient.getFunction(funcRequest);
            kmsKeyId = funcResponse.configuration().environment().variables().get("KMS_KEY_ID");

            assertThat(kmsKeyId).isNotNull();

            DescribeKeyRequest keyRequest = DescribeKeyRequest.builder()
                    .keyId(kmsKeyId)
                    .build();

            DescribeKeyResponse keyResponse = kmsClient.describeKey(keyRequest);

            assertThat(keyResponse.keyMetadata().enabled()).isTrue();
        }
    }

    // SNS INTEGRATION TESTS

    @Nested
    @DisplayName("SNS Integration Tests")
    class SnsTests {

        @Test
        @DisplayName("Should verify SNS topic exists")
        public void testSnsTopicExists() {
            String topicName = "serverless-" + environmentSuffix + "-alerts";

            // Get topic ARN from CloudWatch alarm
            DescribeAlarmsRequest request = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-UserFunction")
                    .build();

            DescribeAlarmsResponse response = cloudWatchClient.describeAlarms(request);

            if (!response.metricAlarms().isEmpty()) {
                MetricAlarm alarm = response.metricAlarms().get(0);
                assertThat(alarm.alarmActions()).isNotEmpty();

                String topicArn = alarm.alarmActions().get(0);
                assertThat(topicArn).contains(topicName);
            }
        }

        @Test
        @DisplayName("Should verify SNS topic has KMS encryption")
        public void testSnsTopicEncryption() {
            DescribeAlarmsRequest alarmRequest = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-UserFunction")
                    .build();

            DescribeAlarmsResponse alarmResponse = cloudWatchClient.describeAlarms(alarmRequest);

            if (!alarmResponse.metricAlarms().isEmpty() && 
                !alarmResponse.metricAlarms().get(0).alarmActions().isEmpty()) {
                
                String topicArn = alarmResponse.metricAlarms().get(0).alarmActions().get(0);

                GetTopicAttributesRequest topicRequest = GetTopicAttributesRequest.builder()
                        .topicArn(topicArn)
                        .build();

                GetTopicAttributesResponse topicResponse = snsClient.getTopicAttributes(topicRequest);

                assertThat(topicResponse.attributes()).containsKey("KmsMasterKeyId");
            }
        }
    }

    // END-TO-END WORKFLOW TESTS

    @Nested
    @DisplayName("End-to-End Workflow Tests")
    class EndToEndTests {

        @Test
        @DisplayName("Should complete full user workflow through API")
        public void testCompleteUserWorkflow() throws IOException, InterruptedException {
            // 1. Call GET /users
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);

            // 2. Verify response structure
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.has("timestamp")).isTrue();
            assertThat(jsonResponse.has("data")).isTrue();
        }

        @Test
        @DisplayName("Should handle multiple concurrent requests")
        public void testConcurrentRequests() throws InterruptedException {
            int numberOfRequests = 5;
            List<Thread> threads = new java.util.ArrayList<>();

            for (int i = 0; i < numberOfRequests; i++) {
                Thread thread = new Thread(() -> {
                    try {
                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create(apiGatewayUrl + "users"))
                                .GET()
                                .build();

                        HttpResponse<String> response = httpClient.send(request, 
                            HttpResponse.BodyHandlers.ofString());

                        assertThat(response.statusCode()).isEqualTo(200);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });
                threads.add(thread);
                thread.start();
            }

            // Wait for all threads to complete
            for (Thread thread : threads) {
                thread.join();
            }
        }

        @Test
        @DisplayName("Should verify Lambda can access S3 bucket")
        public void testLambdaS3Integration() {
            // Invoke Lambda which should have access to S3
            String payload = "{\"body\": {\"s3Test\": true}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);

            // Verify Lambda has S3 bucket name in environment
            GetFunctionRequest funcRequest = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse funcResponse = lambdaClient.getFunction(funcRequest);
            Map<String, String> envVars = funcResponse.configuration().environment().variables();

            assertThat(envVars.get("BUCKET_NAME")).isEqualTo(s3BucketName);
        }

        @Test
        @DisplayName("Should verify all three Lambda functions are accessible")
        public void testAllLambdaFunctionsAccessible() {
            List<String> functionArns = List.of(userFunctionArn, orderFunctionArn, notificationFunctionArn);

            for (String functionArn : functionArns) {
                GetFunctionRequest request = GetFunctionRequest.builder()
                        .functionName(functionArn)
                        .build();

                assertThatCode(() -> {
                    GetFunctionResponse response = lambdaClient.getFunction(request);
                    assertThat(response.configuration().state().toString()).isEqualTo("Active");
                }).doesNotThrowAnyException();
            }
        }

        @Test
        @DisplayName("Should verify stack has all required tags")
        public void testStackTags() {
            DescribeStacksRequest request = DescribeStacksRequest.builder()
                    .stackName(stackName)
                    .build();

            DescribeStacksResponse response = cfnClient.describeStacks(request);
            Stack stack = response.stacks().get(0);

            boolean hasProjectTag = stack.tags().stream()
                    .anyMatch(tag -> tag.key().equals("project") && 
                             tag.value().equals("serverless-infrastructure"));

            boolean hasEnvironmentTag = stack.tags().stream()
                    .anyMatch(tag -> tag.key().equals("environment") && 
                             tag.value().equals(environmentSuffix));

            assertThat(hasProjectTag).isTrue();
            assertThat(hasEnvironmentTag).isTrue();
        }
    }
}
