package app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.hashicorp.cdktf.Testing;
import com.hashicorp.cdktf.App;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import app.stacks.*;

import java.util.Iterator;
import java.util.Map;

/**
 * Unit tests for AWS serverless infrastructure stacks focusing on resource creation validation.
 */
@DisplayName("AWS Serverless Infrastructure Unit Tests")
public class MainTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Helper method to find a resource by name pattern in the synthesized configuration.
     */
    private JsonNode findResourceByNamePattern(JsonNode resources, String resourceType, String namePattern) {
        JsonNode resourceGroup = resources.get(resourceType);
        if (resourceGroup == null) {
            return null;
        }

        Iterator<Map.Entry<String, JsonNode>> fields = resourceGroup.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String resourceName = entry.getKey();
            JsonNode resource = entry.getValue();
            if (resourceName.contains(namePattern)) {
                return resource;
            }
        }
        return null;
    }

    @Nested
    @DisplayName("Main Stack Resource Tests")
    class MainStackTests {

        @Test
        @DisplayName("Should synthesize complete infrastructure without errors")
        void shouldSynthesizeCompleteInfrastructureWithoutErrors() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");

            // Then - Should not throw any exceptions during synthesis
            assertDoesNotThrow(() -> {
                String synthesized = Testing.synth(mainStack);
                JsonNode config = MAPPER.readTree(synthesized);
                assertThat(config).isNotNull();
            });
        }

        @Test
        @DisplayName("Should create all required resource types")
        void shouldCreateAllRequiredResourceTypes() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // Then - Verify all resource types exist
            JsonNode resources = config.get("resource");
            assertThat(resources).isNotNull();

            // Network resources
            assertThat(resources.get("aws_vpc")).isNotNull();
            assertThat(resources.get("aws_subnet")).isNotNull();
            assertThat(resources.get("aws_security_group")).isNotNull();
            assertThat(resources.get("aws_vpc_endpoint")).isNotNull();

            // Storage resources
            assertThat(resources.get("aws_s3_bucket")).isNotNull();
            assertThat(resources.get("aws_dynamodb_table")).isNotNull();
            assertThat(resources.get("aws_kms_key")).isNotNull();

            // Compute resources
            assertThat(resources.get("aws_lambda_function")).isNotNull();
            assertThat(resources.get("aws_iam_role")).isNotNull();

            // API resources
            assertThat(resources.get("aws_api_gateway_rest_api")).isNotNull();
            assertThat(resources.get("aws_api_gateway_stage")).isNotNull();

            // Monitoring resources
            assertThat(resources.get("aws_sns_topic")).isNotNull();
            assertThat(resources.get("aws_cloudwatch_log_group")).isNotNull();
            assertThat(resources.get("aws_sqs_queue")).isNotNull();
        }

        @Test
        @DisplayName("Should create comprehensive terraform outputs")
        void shouldCreateComprehensiveTerraformOutputs() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // Then
            JsonNode outputs = config.get("output");
            assertThat(outputs).isNotNull();

            // Verify key outputs exist
            assertThat(outputs.get("vpcId")).isNotNull();
            assertThat(outputs.get("s3BucketName")).isNotNull();
            assertThat(outputs.get("dynamoTableName")).isNotNull();
            assertThat(outputs.get("lambdaFunctionName")).isNotNull();
            assertThat(outputs.get("apiGatewayId")).isNotNull();
            assertThat(outputs.get("snsTopicArn")).isNotNull();
        }
    }

    @Nested
    @DisplayName("Network Stack Resource Tests")
    class NetworkStackTests {

        @Test
        @DisplayName("Should create VPC with proper configuration")
        void shouldCreateVpcWithProperConfiguration() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode vpcResource = findResourceByNamePattern(resources, "aws_vpc", "vpc");

            // Then
            assertThat(vpcResource).isNotNull();
            assertThat(vpcResource.get("cidr_block").asText()).isEqualTo("10.0.0.0/16");
            assertThat(vpcResource.get("enable_dns_hostnames").asBoolean()).isTrue();
            assertThat(vpcResource.get("enable_dns_support").asBoolean()).isTrue();
        }

        @Test
        @DisplayName("Should create private subnets in multiple AZs")
        void shouldCreatePrivateSubnetsInMultipleAzs() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode subnetA = findResourceByNamePattern(resources, "aws_subnet", "private-subnet-a");
            JsonNode subnetB = findResourceByNamePattern(resources, "aws_subnet", "private-subnet-b");

            // Then
            assertThat(subnetA).isNotNull();
            assertThat(subnetB).isNotNull();
            assertThat(subnetA.get("cidr_block").asText()).isEqualTo("10.0.1.0/24");
            assertThat(subnetB.get("cidr_block").asText()).isEqualTo("10.0.2.0/24");
            assertThat(subnetA.get("availability_zone").asText()).isEqualTo("us-west-2a");
            assertThat(subnetB.get("availability_zone").asText()).isEqualTo("us-west-2b");
        }

        @Test
        @DisplayName("Should create S3 VPC endpoint for private connectivity")
        void shouldCreateS3VpcEndpointForPrivateConnectivity() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode vpcEndpoint = findResourceByNamePattern(resources, "aws_vpc_endpoint", "s3-endpoint");

            // Then
            assertThat(vpcEndpoint).isNotNull();
            assertThat(vpcEndpoint.get("service_name").asText()).isEqualTo("com.amazonaws.us-west-2.s3");
            assertThat(vpcEndpoint.get("vpc_endpoint_type").asText()).isEqualTo("Gateway");
        }

        @Test
        @DisplayName("Should create Lambda security group with proper configuration")
        void shouldCreateLambdaSecurityGroupWithProperConfiguration() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode securityGroup = findResourceByNamePattern(resources, "aws_security_group", "lambda-sg");

            // Then
            assertThat(securityGroup).isNotNull();
            assertThat(securityGroup.get("name").asText()).isEqualTo("lambda-security-group");
            assertThat(securityGroup.get("description").asText()).isEqualTo("Security group for Lambda function");
        }
    }

    @Nested
    @DisplayName("Storage Stack Resource Tests")
    class StorageStackTests {

        @Test
        @DisplayName("Should create S3 bucket with encryption and versioning")
        void shouldCreateS3BucketWithEncryptionAndVersioning() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode s3Bucket = findResourceByNamePattern(resources, "aws_s3_bucket", "data-bucket");
            JsonNode s3Encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration");
            JsonNode s3Versioning = resources.get("aws_s3_bucket_versioning");

            // Then
            assertThat(s3Bucket).isNotNull();
            assertThat(s3Bucket.get("bucket").asText()).startsWith("serverless-data-bucket-");
            assertThat(s3Encryption).isNotNull();
            assertThat(s3Versioning).isNotNull();
        }

        @Test
        @DisplayName("Should create DynamoDB table with encryption and point-in-time recovery")
        void shouldCreateDynamoDbTableWithEncryptionAndPointInTimeRecovery() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode dynamoTable = findResourceByNamePattern(resources, "aws_dynamodb_table", "data-table");

            // Then
            assertThat(dynamoTable).isNotNull();
            assertThat(dynamoTable.get("name").asText()).isEqualTo("serverless-data-table");
            assertThat(dynamoTable.get("billing_mode").asText()).isEqualTo("PROVISIONED");
            assertThat(dynamoTable.get("hash_key").asText()).isEqualTo("pk");
            assertThat(dynamoTable.get("range_key").asText()).isEqualTo("sk");

            // Check encryption is configured
            JsonNode encryption = dynamoTable.get("server_side_encryption");
            assertThat(encryption).isNotNull();
            if (encryption.isArray() && !encryption.isEmpty() && encryption.get(0) != null) {
                assertThat(encryption.get(0).get("enabled").asBoolean()).isTrue();
            }

            // Check point-in-time recovery
            JsonNode pitr = dynamoTable.get("point_in_time_recovery");
            assertThat(pitr).isNotNull();
            if (pitr.isArray() && !pitr.isEmpty() && pitr.get(0) != null) {
                assertThat(pitr.get(0).get("enabled").asBoolean()).isTrue();
            }
        }

        @Test
        @DisplayName("Should create KMS keys with rotation enabled")
        void shouldCreateKmsKeysWithRotationEnabled() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode s3KmsKey = findResourceByNamePattern(resources, "aws_kms_key", "s3-kms-key");
            JsonNode dynamoKmsKey = findResourceByNamePattern(resources, "aws_kms_key", "dynamo-kms-key");

            // Then
            assertThat(s3KmsKey).isNotNull();
            assertThat(dynamoKmsKey).isNotNull();
            assertThat(s3KmsKey.get("enable_key_rotation").asBoolean()).isTrue();
            assertThat(dynamoKmsKey.get("enable_key_rotation").asBoolean()).isTrue();
        }
    }

    @Nested
    @DisplayName("Compute Stack Resource Tests")
    class ComputeStackTests {

        @Test
        @DisplayName("Should create Lambda function with proper configuration")
        void shouldCreateLambdaFunctionWithProperConfiguration() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode lambdaFunction = findResourceByNamePattern(resources, "aws_lambda_function", "function");

            // Then
            assertThat(lambdaFunction).isNotNull();
            assertThat(lambdaFunction.get("function_name").asText()).isEqualTo("serverless-processor");
            assertThat(lambdaFunction.get("runtime").asText()).isEqualTo("python3.8");
            assertThat(lambdaFunction.get("handler").asText()).isEqualTo("handler.lambda_handler");
        }

        @Test
        @DisplayName("Should create IAM role with proper policies")
        void shouldCreateIamRoleWithProperPolicies() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode iamRole = findResourceByNamePattern(resources, "aws_iam_role", "lambda-role");

            // Then
            assertThat(iamRole).isNotNull();
            assertThat(iamRole.get("name").asText()).isEqualTo("serverless-lambda-role");
        }

        @Test
        @DisplayName("Should create EventBridge rule for scheduled execution")
        void shouldCreateEventBridgeRuleForScheduledExecution() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode eventBridgeRule = findResourceByNamePattern(resources, "aws_cloudwatch_event_rule", "scheduled-rule");

            // Then
            assertThat(eventBridgeRule).isNotNull();
            assertThat(eventBridgeRule.get("schedule_expression").asText()).isEqualTo("rate(24 hours)");
        }
    }

    @Nested
    @DisplayName("API Stack Resource Tests")
    class ApiStackTests {

        @Test
        @DisplayName("Should create API Gateway with proper configuration")
        void shouldCreateApiGatewayWithProperConfiguration() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode apiGateway = findResourceByNamePattern(resources, "aws_api_gateway_rest_api", "api");

            // Then
            assertThat(apiGateway).isNotNull();
            assertThat(apiGateway.get("name").asText()).isEqualTo("serverless-api");
        }

        @Test
        @DisplayName("Should create API Gateway deployment with proper settings")
        void shouldCreateApiGatewayDeploymentWithProperSettings() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode apiStage = findResourceByNamePattern(resources, "aws_api_gateway_stage", "stage");

            // Then
            assertThat(apiStage).isNotNull();
            assertThat(apiStage.get("stage_name").asText()).isEqualTo("prod");
        }
    }

    @Nested
    @DisplayName("Monitoring Stack Resource Tests")
    class MonitoringStackTests {

        @Test
        @DisplayName("Should create SNS topic with KMS encryption")
        void shouldCreateSnsTopicWithKmsEncryption() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode snsTopic = findResourceByNamePattern(resources, "aws_sns_topic", "error-topic");

            // Then
            assertThat(snsTopic).isNotNull();
            assertThat(snsTopic.get("name").asText()).isEqualTo("serverless-error-notifications");
        }

        @Test
        @DisplayName("Should create CloudWatch log groups with retention policy")
        void shouldCreateCloudWatchLogGroupsWithRetentionPolicy() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode lambdaLogGroup = findResourceByNamePattern(resources, "aws_cloudwatch_log_group", "lambda-logs");
            JsonNode apiLogGroup = findResourceByNamePattern(resources, "aws_cloudwatch_log_group", "api-logs");

            // Then
            assertThat(lambdaLogGroup).isNotNull();
            assertThat(apiLogGroup).isNotNull();
            assertThat(lambdaLogGroup.get("retention_in_days").asInt()).isEqualTo(30);
            assertThat(apiLogGroup.get("retention_in_days").asInt()).isEqualTo(30);
        }

        @Test
        @DisplayName("Should create SQS dead letter queue with encryption")
        void shouldCreateSqsDeadLetterQueueWithEncryption() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode sqsQueue = findResourceByNamePattern(resources, "aws_sqs_queue", "dlq");

            // Then
            assertThat(sqsQueue).isNotNull();
            assertThat(sqsQueue.get("name").asText()).isEqualTo("serverless-dlq");
            assertThat(sqsQueue.get("message_retention_seconds").asInt()).isEqualTo(1209600);
        }

        @Test
        @DisplayName("Should create CloudWatch alarms for monitoring")
        void shouldCreateCloudWatchAlarmsForMonitoring() throws Exception {
            // Given & When
            MainStack mainStack = new MainStack(Testing.app(), "main-test");
            String synthesized = Testing.synth(mainStack);
            JsonNode config = MAPPER.readTree(synthesized);

            // When
            JsonNode resources = config.get("resource");
            JsonNode lambdaErrorAlarm = findResourceByNamePattern(resources, "aws_cloudwatch_metric_alarm", "lambda-error-alarm");
            JsonNode apiErrorAlarm = findResourceByNamePattern(resources, "aws_cloudwatch_metric_alarm", "api-4xx-alarm");

            // Then
            assertThat(lambdaErrorAlarm).isNotNull();
            assertThat(apiErrorAlarm).isNotNull();
            assertThat(lambdaErrorAlarm.get("alarm_name").asText()).isEqualTo("lambda-high-error-rate");
            assertThat(apiErrorAlarm.get("alarm_name").asText()).isEqualTo("api-high-4xx-rate");
        }
    }
}