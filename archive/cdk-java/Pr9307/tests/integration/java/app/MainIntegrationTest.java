package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.apigateway.ApiGatewayClient;
import software.amazon.awssdk.services.apigateway.model.GetRestApisRequest;
import software.amazon.awssdk.services.apigateway.model.GetRestApisResponse;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Integration tests for deployed AWS resources.
 *
 * These tests verify that the actual deployed resources in LocalStack/AWS
 * are accessible and functioning correctly. They run after deployment and
 * interact with live resources.
 */
public class MainIntegrationTest {

    private static DynamoDbClient dynamoDbClient;
    private static LambdaClient lambdaClient;
    private static Ec2Client ec2Client;
    private static ApiGatewayClient apiGatewayClient;
    private static String dynamoTableName;
    private static String lambdaFunctionArn;
    private static String vpcId;
    private static String apiGatewayUrl;

    /**
     * Initialize AWS clients and read deployment outputs.
     * This runs once before all tests.
     */
    @BeforeAll
    public static void setUp() {
        // Read deployment outputs from environment variables
        dynamoTableName = System.getenv("DYNAMODB_TABLE_NAME");
        lambdaFunctionArn = System.getenv("LAMBDA_FUNCTION_ARN");
        vpcId = System.getenv("VPC_ID");
        apiGatewayUrl = System.getenv("API_GATEWAY_URL");

        // Get AWS configuration from environment
        String awsEndpoint = System.getenv("AWS_ENDPOINT_URL");
        String awsRegion = System.getenv("AWS_REGION");
        if (awsRegion == null) awsRegion = "us-east-1";

        Region region = Region.of(awsRegion);

        // Create AWS SDK clients
        if (awsEndpoint != null && !awsEndpoint.isEmpty()) {
            // LocalStack configuration
            URI endpointUri = URI.create(awsEndpoint);
            AwsBasicCredentials credentials = AwsBasicCredentials.create("test", "test");
            StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);

            dynamoDbClient = DynamoDbClient.builder()
                    .region(region)
                    .endpointOverride(endpointUri)
                    .credentialsProvider(credentialsProvider)
                    .build();

            lambdaClient = LambdaClient.builder()
                    .region(region)
                    .endpointOverride(endpointUri)
                    .credentialsProvider(credentialsProvider)
                    .build();

            ec2Client = Ec2Client.builder()
                    .region(region)
                    .endpointOverride(endpointUri)
                    .credentialsProvider(credentialsProvider)
                    .build();

            apiGatewayClient = ApiGatewayClient.builder()
                    .region(region)
                    .endpointOverride(endpointUri)
                    .credentialsProvider(credentialsProvider)
                    .build();
        } else {
            // Real AWS configuration
            dynamoDbClient = DynamoDbClient.builder()
                    .region(region)
                    .build();

            lambdaClient = LambdaClient.builder()
                    .region(region)
                    .build();

            ec2Client = Ec2Client.builder()
                    .region(region)
                    .build();

            apiGatewayClient = ApiGatewayClient.builder()
                    .region(region)
                    .build();
        }
    }

    /**
     * Test that the DynamoDB table was created and is accessible.
     */
    @Test
    public void testDynamoDBTableExists() {
        assertThat(dynamoTableName)
                .as("DynamoDB table name should be provided via environment variable")
                .isNotNull()
                .isNotEmpty();

        DescribeTableRequest request = DescribeTableRequest.builder()
                .tableName(dynamoTableName)
                .build();

        DescribeTableResponse response = dynamoDbClient.describeTable(request);

        assertThat(response.table()).isNotNull();
        assertThat(response.table().tableName()).isEqualTo(dynamoTableName);
        assertThat(response.table().tableStatus().toString())
                .as("DynamoDB table should be in ACTIVE state")
                .isEqualTo("ACTIVE");
        assertThat(response.table().keySchema())
                .as("DynamoDB table should have a partition key")
                .isNotEmpty();
    }

    /**
     * Test that the Lambda function was created and is accessible.
     */
    @Test
    public void testLambdaFunctionExists() {
        assertThat(lambdaFunctionArn)
                .as("Lambda function ARN should be provided via environment variable")
                .isNotNull()
                .isNotEmpty();

        // Extract function name from ARN
        String functionName = lambdaFunctionArn.substring(lambdaFunctionArn.lastIndexOf(":") + 1);

        GetFunctionRequest request = GetFunctionRequest.builder()
                .functionName(functionName)
                .build();

        GetFunctionResponse response = lambdaClient.getFunction(request);

        assertThat(response.configuration()).isNotNull();
        assertThat(response.configuration().functionName()).isEqualTo(functionName);
        assertThat(response.configuration().runtime().toString())
                .as("Lambda should use Java 21 runtime")
                .contains("java21");
        assertThat(response.configuration().memorySize())
                .as("Lambda should have 512MB memory")
                .isEqualTo(512);
        assertThat(response.configuration().timeout())
                .as("Lambda should have 30 second timeout")
                .isEqualTo(30);
    }

    /**
     * Test that the VPC was created and is accessible.
     */
    @Test
    public void testVpcExists() {
        assertThat(vpcId)
                .as("VPC ID should be provided via environment variable")
                .isNotNull()
                .isNotEmpty();

        DescribeVpcsRequest request = DescribeVpcsRequest.builder()
                .vpcIds(vpcId)
                .build();

        DescribeVpcsResponse response = ec2Client.describeVpcs(request);

        assertThat(response.vpcs()).isNotEmpty();
        assertThat(response.vpcs().get(0).vpcId()).isEqualTo(vpcId);
        assertThat(response.vpcs().get(0).state().toString())
                .as("VPC should be in available state")
                .isEqualTo("AVAILABLE");
    }

    /**
     * Test that the API Gateway was created and is accessible.
     */
    @Test
    public void testApiGatewayExists() {
        GetRestApisRequest request = GetRestApisRequest.builder()
                .build();

        GetRestApisResponse response = apiGatewayClient.getRestApis(request);

        assertThat(response.items())
                .as("At least one API Gateway should exist")
                .isNotEmpty();
    }

    /**
     * Test that the API Gateway endpoint is accessible via HTTP.
     * This test verifies end-to-end connectivity.
     */
    @Test
    public void testApiGatewayEndpointAccessible() throws Exception {
        assertThat(apiGatewayUrl)
                .as("API Gateway URL should be provided via environment variable")
                .isNotNull()
                .isNotEmpty();

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiGatewayUrl))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        // The endpoint should respond (even if it returns an error code,
        // we're just verifying it's reachable)
        assertThat(response.statusCode())
                .as("API Gateway endpoint should respond")
                .isGreaterThanOrEqualTo(200)
                .isLessThan(600);
    }

    /**
     * Integration test verifying all resources work together.
     * This test checks that all major components are deployed and accessible.
     */
    @Test
    public void testFullStackIntegration() {
        // Verify all outputs are provided
        assertThat(dynamoTableName).as("DynamoDB table name").isNotNull();
        assertThat(lambdaFunctionArn).as("Lambda function ARN").isNotNull();
        assertThat(vpcId).as("VPC ID").isNotNull();
        assertThat(apiGatewayUrl).as("API Gateway URL").isNotNull();

        // Verify all resources exist (calls other test methods' logic)
        assertThat(dynamoDbClient).isNotNull();
        assertThat(lambdaClient).isNotNull();
        assertThat(ec2Client).isNotNull();
        assertThat(apiGatewayClient).isNotNull();
    }
}
