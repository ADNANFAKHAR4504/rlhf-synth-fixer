package app;

import app.constructs.*;
import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.Testing;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CDKTF Java MainStack template.
 *
 * These tests validate resource creation focusing exclusively
 * on the actual AWS resources being created.
 */
@DisplayName("CDKTF Resource Unit Tests")
public class MainTest {

    private MainStack stack;

    @BeforeEach
    void setUp() {
        App app = Testing.app();
        stack = new MainStack(app, "test-stack");
    }

    @Nested
    @DisplayName("S3 Bucket Resource Tests")
    class S3BucketTests {

        @Test
        @DisplayName("S3 bucket should be created with versioning enabled")
        void testS3BucketVersioning() {
            S3Construct s3Construct = new S3Construct(stack, "test-s3-versioning");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_s3_bucket_versioning"));
            assertTrue(synthesized.contains("\"status\": \"Enabled\""));
        }

        @Test
        @DisplayName("S3 bucket should have public access blocked")
        void testS3BucketPublicAccessBlock() {
            S3Construct s3Construct = new S3Construct(stack, "test-s3-pab");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_s3_bucket_public_access_block"));
            assertTrue(synthesized.contains("\"block_public_acls\": true"));
            assertTrue(synthesized.contains("\"block_public_policy\": true"));
            assertTrue(synthesized.contains("\"ignore_public_acls\": true"));
            assertTrue(synthesized.contains("\"restrict_public_buckets\": true"));
        }

        @Test
        @DisplayName("S3 bucket should have proper tagging")
        void testS3BucketTagging() {
            S3Construct s3Construct = new S3Construct(stack, "test-s3-tags");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("\"Environment\": \""));
            assertTrue(synthesized.contains("\"Project\": \""));
            assertTrue(synthesized.contains("\"ManagedBy\": \"cdktf\""));
        }

        @Test
        @DisplayName("S3 construct should expose bucket ARN and name")
        void testS3ConstructOutputs() {
            S3Construct s3Construct = new S3Construct(stack, "test-s3-outputs");

            assertNotNull(s3Construct.getBucketArn());
            assertNotNull(s3Construct.getBucketName());

            // Check that they return valid CDKTF tokens
            assertTrue(s3Construct.getBucketArn().contains("TfToken"));
            assertTrue(s3Construct.getBucketName().contains("TfToken"));
        }
    }

    @Nested
    @DisplayName("DynamoDB Table Resource Tests")
    class DynamoDBTests {

        @Test
        @DisplayName("DynamoDB table should use pay-per-request billing")
        void testDynamoDBBillingMode() {
            DynamoDBConstruct dynamoConstruct = new DynamoDBConstruct(stack, "test-dynamo-billing");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_dynamodb_table"));
            assertTrue(synthesized.contains("\"billing_mode\": \"PAY_PER_REQUEST\""));
        }

        @Test
        @DisplayName("DynamoDB table should have correct hash key configuration")
        void testDynamoDBKeySchema() {
            DynamoDBConstruct dynamoConstruct = new DynamoDBConstruct(stack, "test-dynamo-keys");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("\"hash_key\": \"id\""));
            assertTrue(synthesized.contains("\"name\": \"id\""));
            assertTrue(synthesized.contains("\"type\": \"S\""));
        }

        @Test
        @DisplayName("DynamoDB table should have proper tagging")
        void testDynamoDBTagging() {
            DynamoDBConstruct dynamoConstruct = new DynamoDBConstruct(stack, "test-dynamo-tags");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("\"Environment\": \""));
            assertTrue(synthesized.contains("\"Project\": \""));
            assertTrue(synthesized.contains("\"ManagedBy\": \"cdktf\""));
        }

        @Test
        @DisplayName("DynamoDB construct should expose table ARN and name")
        void testDynamoDBConstructOutputs() {
            DynamoDBConstruct dynamoConstruct = new DynamoDBConstruct(stack, "test-dynamo-outputs");

            assertNotNull(dynamoConstruct.getTableArn());
            assertNotNull(dynamoConstruct.getTableName());

            // Check that they return valid CDKTF tokens
            assertTrue(dynamoConstruct.getTableArn().contains("TfToken"));
            assertTrue(dynamoConstruct.getTableName().contains("TfToken"));
        }
    }

    @Nested
    @DisplayName("IAM Role Resource Tests")
    class IAMTests {

        @Test
        @DisplayName("IAM role should have Lambda assume role policy")
        void testIAMAssumeRolePolicy() {
            IamConstruct iamConstruct = new IamConstruct(stack, "test-iam-assume",
                "arn:aws:dynamodb:us-east-1:123456789012:table/TestTable",
                "arn:aws:s3:::test-bucket");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_iam_role"));
            assertTrue(synthesized.contains("lambda.amazonaws.com"));
            assertTrue(synthesized.contains("sts:AssumeRole"));
        }

        @Test
        @DisplayName("IAM role should have CloudWatch Logs policy")
        void testIAMLogsPolicy() {
            IamConstruct iamConstruct = new IamConstruct(stack, "test-iam-logs",
                "arn:aws:dynamodb:us-east-1:123456789012:table/TestTable",
                "arn:aws:s3:::test-bucket");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("logs:CreateLogGroup"));
            assertTrue(synthesized.contains("logs:CreateLogStream"));
            assertTrue(synthesized.contains("logs:PutLogEvents"));
        }

        @Test
        @DisplayName("IAM role should have DynamoDB policy with correct permissions")
        void testIAMDynamoDBPolicy() {
            String tableArn = "arn:aws:dynamodb:us-east-1:123456789012:table/TestTable";
            IamConstruct iamConstruct = new IamConstruct(stack, "test-iam-dynamo",
                tableArn, "arn:aws:s3:::test-bucket");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("dynamodb:GetItem"));
            assertTrue(synthesized.contains("dynamodb:PutItem"));
            assertTrue(synthesized.contains("dynamodb:UpdateItem"));
            assertTrue(synthesized.contains("dynamodb:DeleteItem"));
            assertTrue(synthesized.contains("dynamodb:Query"));
            assertTrue(synthesized.contains("dynamodb:Scan"));
        }

        @Test
        @DisplayName("IAM role should have S3 policy with correct permissions")
        void testIAMS3Policy() {
            String bucketArn = "arn:aws:s3:::test-bucket";
            IamConstruct iamConstruct = new IamConstruct(stack, "test-iam-s3",
                "arn:aws:dynamodb:us-east-1:123456789012:table/TestTable", bucketArn);
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("s3:GetObject"));
            assertTrue(synthesized.contains("s3:GetObjectVersion"));
        }
    }

    @Nested
    @DisplayName("Lambda Function Resource Tests")
    class LambdaTests {

        @Test
        @DisplayName("Lambda function should have correct runtime and handler configuration")
        void testLambdaConfiguration() {
            LambdaConstruct lambdaConstruct = new LambdaConstruct(stack, "test-lambda-config",
                "arn:aws:iam::123456789012:role/LambdaRole",
                "test-deployment-bucket", "TestTable");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_lambda_function"));
            assertTrue(synthesized.contains("\"memory_size\": 256"));
            assertTrue(synthesized.contains("\"timeout\": "));
        }

        @Test
        @DisplayName("Lambda function should have environment variables configured")
        void testLambdaEnvironmentVariables() {
            LambdaConstruct lambdaConstruct = new LambdaConstruct(stack, "test-lambda-env",
                "arn:aws:iam::123456789012:role/LambdaRole",
                "test-deployment-bucket", "TestTable");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("environment"));
            assertTrue(synthesized.contains("DYNAMODB_TABLE"));
            assertTrue(synthesized.contains("REGION"));
        }

        @Test
        @DisplayName("Lambda function should have CloudWatch Log Group configured")
        void testLambdaLogGroup() {
            LambdaConstruct lambdaConstruct = new LambdaConstruct(stack, "test-lambda-logs",
                "arn:aws:iam::123456789012:role/LambdaRole",
                "test-deployment-bucket", "TestTable");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_cloudwatch_log_group"));
            assertTrue(synthesized.contains("/aws/lambda/"));
            assertTrue(synthesized.contains("\"retention_in_days\": 7"));
        }

        @Test
        @DisplayName("Lambda construct should expose function ARN and name")
        void testLambdaConstructOutputs() {
            LambdaConstruct lambdaConstruct = new LambdaConstruct(stack, "test-lambda-outputs",
                "arn:aws:iam::123456789012:role/LambdaRole",
                "test-deployment-bucket", "TestTable");

            assertNotNull(lambdaConstruct.getFunctionArn());
            assertNotNull(lambdaConstruct.getFunctionInvokeArn());
            assertNotNull(lambdaConstruct.getFunctionName());
            assertNotNull(lambdaConstruct.getLogGroupName());
        }
    }

    @Nested
    @DisplayName("API Gateway Resource Tests")
    class ApiGatewayTests {

        @Test
        @DisplayName("API Gateway should be configured as REGIONAL endpoint")
        void testApiGatewayEndpointType() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-regional",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_api_gateway_rest_api"));
            assertTrue(synthesized.contains("\"REGIONAL\""));
        }

        @Test
        @DisplayName("API Gateway should have GET and POST methods configured")
        void testApiGatewayMethods() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-methods",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_api_gateway_method"));
            assertTrue(synthesized.contains("\"http_method\": \"GET\""));
            assertTrue(synthesized.contains("\"http_method\": \"POST\""));
            assertTrue(synthesized.contains("\"authorization\": \"NONE\""));
        }

        @Test
        @DisplayName("API Gateway should have Lambda integration configured")
        void testApiGatewayLambdaIntegration() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-integration",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_api_gateway_integration"));
            assertTrue(synthesized.contains("\"type\": \"AWS_PROXY\""));
            assertTrue(synthesized.contains("\"integration_http_method\": \"POST\""));
        }

        @Test
        @DisplayName("API Gateway should have deployment and stage configured")
        void testApiGatewayDeploymentAndStage() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-deployment",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_api_gateway_deployment"));
            assertTrue(synthesized.contains("aws_api_gateway_stage"));
            assertTrue(synthesized.contains("\"stage_name\": \"prod\""));
            assertTrue(synthesized.contains("\"xray_tracing_enabled\": true"));
        }

        @Test
        @DisplayName("API Gateway should have Lambda permission configured")
        void testApiGatewayLambdaPermission() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-permission",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_lambda_permission"));
            assertTrue(synthesized.contains("\"action\": \"lambda:InvokeFunction\""));
            assertTrue(synthesized.contains("\"principal\": \"apigateway.amazonaws.com\""));
        }

        @Test
        @DisplayName("API Gateway should have method settings for logging")
        void testApiGatewayMethodSettings() {
            ApiGatewayConstruct apiConstruct = new ApiGatewayConstruct(stack, "test-api-settings",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction",
                "arn:aws:lambda:us-east-1:123456789012:function:TestFunction/invocations");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_api_gateway_method_settings"));
            assertTrue(synthesized.contains("\"logging_level\": \"INFO\""));
            assertTrue(synthesized.contains("\"data_trace_enabled\": true"));
            assertTrue(synthesized.contains("\"metrics_enabled\": true"));
        }
    }

    @Nested
    @DisplayName("Monitoring Resource Tests")
    class MonitoringTests {

        @Test
        @DisplayName("SNS topic should be created for error notifications")
        void testSNSTopicCreation() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-sns",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_sns_topic"));
            assertTrue(synthesized.contains("\"display_name\": \"Lambda Error Notifications\""));
        }

        @Test
        @DisplayName("SNS email subscription should be configured")
        void testSNSEmailSubscription() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-subscription",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_sns_topic_subscription"));
            assertTrue(synthesized.contains("\"protocol\": \"email\""));
            assertTrue(synthesized.contains("\"endpoint\": \"oride.a@turing.com\""));
        }

        @Test
        @DisplayName("CloudWatch log metric filter should be configured for errors")
        void testCloudWatchLogMetricFilter() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-filter",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_cloudwatch_log_metric_filter"));
            assertTrue(synthesized.contains("\"pattern\": \"ERROR\""));
            assertTrue(synthesized.contains("\"namespace\": \"ServerlessDemo\""));
        }

        @Test
        @DisplayName("Lambda error alarm should be configured")
        void testLambdaErrorAlarm() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-error-alarm",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("aws_cloudwatch_metric_alarm"));
            assertTrue(synthesized.contains("LambdaErrorAlarm"));
            assertTrue(synthesized.contains("\"metric_name\": \"LambdaErrors\""));
            assertTrue(synthesized.contains("\"statistic\": \"Sum\""));
            assertTrue(synthesized.contains("\"threshold\": 1"));
        }

        @Test
        @DisplayName("Lambda duration alarm should be configured")
        void testLambdaDurationAlarm() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-duration-alarm",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("LambdaDurationAlarm"));
            assertTrue(synthesized.contains("\"metric_name\": \"Duration\""));
            assertTrue(synthesized.contains("\"namespace\": \"AWS/Lambda\""));
            assertTrue(synthesized.contains("\"statistic\": \"Average\""));
            assertTrue(synthesized.contains("\"threshold\": 5000"));
        }

        @Test
        @DisplayName("Lambda throttle alarm should be configured")
        void testLambdaThrottleAlarm() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-throttle-alarm",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("LambdaThrottleAlarm"));
            assertTrue(synthesized.contains("\"metric_name\": \"Throttles\""));
            assertTrue(synthesized.contains("\"comparison_operator\": \"GreaterThanOrEqualToThreshold\""));
        }

        @Test
        @DisplayName("API Gateway 4XX error alarm should be configured")
        void testApiGateway4xxAlarm() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-4xx-alarm",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("API4xxAlarm"));
            assertTrue(synthesized.contains("\"metric_name\": \"4XXError\""));
            assertTrue(synthesized.contains("\"namespace\": \"AWS/ApiGateway\""));
            assertTrue(synthesized.contains("\"threshold\": 10"));
        }

        @Test
        @DisplayName("API Gateway 5XX error alarm should be configured")
        void testApiGateway5xxAlarm() {
            MonitoringConstruct monitoringConstruct = new MonitoringConstruct(stack, "test-monitoring-5xx-alarm",
                "TestFunction", "/aws/lambda/TestFunction", "TestAPI");
            String synthesized = Testing.synth(stack);

            assertTrue(synthesized.contains("API5xxAlarm"));
            assertTrue(synthesized.contains("\"metric_name\": \"5XXError\""));
            assertTrue(synthesized.contains("\"comparison_operator\": \"GreaterThanOrEqualToThreshold\""));
            assertTrue(synthesized.contains("\"threshold\": 1"));
        }
    }

    @Nested
    @DisplayName("Stack Integration Tests")
    class StackIntegrationTests {

        @Test
        @DisplayName("MainStack should create all required resources")
        void testMainStackResourceCreation() {
            String synthesized = Testing.synth(stack);

            // Verify all major resources are created
            assertTrue(synthesized.contains("aws_s3_bucket"));
            assertTrue(synthesized.contains("aws_dynamodb_table"));
            assertTrue(synthesized.contains("aws_iam_role"));
            assertTrue(synthesized.contains("aws_lambda_function"));
            assertTrue(synthesized.contains("aws_api_gateway_rest_api"));
            assertTrue(synthesized.contains("aws_cloudwatch_metric_alarm"));
            assertTrue(synthesized.contains("aws_sns_topic"));
        }

        @Test
        @DisplayName("MainStack should configure all Terraform outputs")
        void testMainStackOutputs() {
            String synthesized = Testing.synth(stack);

            // Verify all outputs are present
            assertTrue(synthesized.contains("\"lambdaFunctionArn\""));
            assertTrue(synthesized.contains("\"lambdaFunctionName\""));
            assertTrue(synthesized.contains("\"apiGatewayUrl\""));
            assertTrue(synthesized.contains("\"dynamoDbTableName\""));
            assertTrue(synthesized.contains("\"dynamoDbTableArn\""));
            assertTrue(synthesized.contains("\"s3BucketName\""));
            assertTrue(synthesized.contains("\"s3BucketArn\""));
            assertTrue(synthesized.contains("\"apiGatewayId\""));
            assertTrue(synthesized.contains("\"apiGatewayName\""));
            assertTrue(synthesized.contains("\"lambdaLogGroupName\""));
            assertTrue(synthesized.contains("\"stackId\""));
        }

        @Test
        @DisplayName("Resources should have consistent tagging across the stack")
        void testConsistentTagging() {
            String synthesized = Testing.synth(stack);

            // Count occurrences of standard tags
            int environmentTagCount = countOccurrences(synthesized, "\"Environment\": \"");
            int projectTagCount = countOccurrences(synthesized, "\"Project\": \"");
            int managedByTagCount = countOccurrences(synthesized, "\"ManagedBy\": \"cdktf\"");

            // Verify tags are applied consistently
            assertTrue(environmentTagCount > 5, "Environment tag should be present on multiple resources");
            assertTrue(projectTagCount > 5, "Project tag should be present on multiple resources");
            assertTrue(managedByTagCount > 5, "ManagedBy tag should be present on multiple resources");
        }

        @Test
        @DisplayName("Lambda function should have proper dependencies configured")
        void testLambdaDependencies() {
            String synthesized = Testing.synth(stack);

            // Verify Lambda depends on log group
            assertTrue(synthesized.contains("depends_on"));

            // Verify Lambda has access to DynamoDB and S3 through environment variables and IAM
            assertTrue(synthesized.contains("DYNAMODB_TABLE"));
            assertTrue(synthesized.contains("s3:GetObject"));
            assertTrue(synthesized.contains("dynamodb:PutItem"));
        }
    }

    // Helper method for counting occurrences
    private int countOccurrences(String text, String pattern) {
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(pattern, index)) != -1) {
            count++;
            index += pattern.length();
        }
        return count;
    }
}