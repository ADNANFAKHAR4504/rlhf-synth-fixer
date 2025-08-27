package app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the
 * TapStack
 * and validate deployment outputs when available.
 */
public class MainIntegrationTest {

  private ObjectMapper mapper;
  private App app;

  @BeforeEach
  public void setUp() {
    mapper = new ObjectMapper();
    System.setProperty("CDK_DEFAULT_REGION", "us-west-2");
    System.setProperty("CDK_DEFAULT_ACCOUNT", "123456789012");
    app = new App();
  }

  /**
   * Integration test for full stack deployment simulation.
   *
   * This test verifies that the complete stack can be synthesized
   * with all its components working together.
   */
  @Test
  public void testFullStackDeployment() {
    // Create stack with production-like configuration
    TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
        .environmentSuffix("prod")
        .build());

    // Create template and verify it can be synthesized
    Template template = Template.fromStack(stack);

    // Verify stack configuration
    assertThat(stack).isNotNull();
    assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
    assertThat(template).isNotNull();

    // Verify all major components are present
    template.hasResourceProperties("AWS::EC2::VPC", Map.of());
    template.hasResourceProperties("AWS::Lambda::Function", Map.of());
    template.hasResourceProperties("AWS::DynamoDB::GlobalTable", Map.of());
    template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of());
    template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of());
    // Application Insights temporarily disabled due to Resource Group dependency
    // template.hasResourceProperties("AWS::ApplicationInsights::Application",
    // Map.of());
  }

  /**
   * Integration test for multiple environment configurations.
   *
   * This test verifies that the stack can be configured for different
   * environments (dev, staging, prod) with appropriate settings.
   */
  @Test
  public void testMultiEnvironmentConfiguration() {
    // Test different environment configurations
    String[] environments = { "dev", "staging", "prod" };

    for (String env : environments) {
      // Create a new app for each environment to avoid synthesis conflicts
      App envApp = new App();
      TapStack stack = new TapStack(envApp, "TapStack" + env, TapStackProps.builder()
          .environmentSuffix(env)
          .build());

      // Verify each environment configuration
      assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

      // Verify template can be created for each environment
      Template template = Template.fromStack(stack);
      assertThat(template).isNotNull();

      // Verify environment-specific resource naming
      template.hasResourceProperties("AWS::Lambda::Function", Map.of(
          "FunctionName", Match.stringLikeRegexp("tap-" + env + "-\\d+-backend")));

      template.hasResourceProperties("AWS::DynamoDB::GlobalTable", Map.of(
          "TableName", Match.stringLikeRegexp("tap-" + env + "-\\d+-data")));
    }
  }

  /**
   * Test API Gateway and Lambda integration.
   */
  @Test
  public void testApiGatewayLambdaIntegration() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify API Gateway is created
    template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
        "Name", Match.stringLikeRegexp("tap-test-\\d+-api")));

    // Verify API Gateway Method is created with Lambda integration
    template.hasResourceProperties("AWS::ApiGateway::Method", Map.of(
        "HttpMethod", "GET",
        "Integration", Match.objectLike(Map.of(
            "Type", "AWS_PROXY"))));

    // Verify Lambda permission for API Gateway
    template.hasResourceProperties("AWS::Lambda::Permission", Map.of(
        "Principal", "apigateway.amazonaws.com"));
  }

  /**
   * Test Lambda and DynamoDB integration.
   */
  @Test
  public void testLambdaDynamoDBIntegration() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify Lambda has environment variables for DynamoDB
    template.hasResourceProperties("AWS::Lambda::Function", Map.of(
        "Environment", Match.objectLike(Map.of(
            "Variables", Match.objectLike(Map.of(
                "DYNAMODB_TABLE", Match.anyValue(),
                "ENVIRONMENT", "test"))))));

    // Verify IAM policy allows Lambda to access DynamoDB
    template.hasResourceProperties("AWS::IAM::Policy", Map.of(
        "PolicyDocument", Match.objectLike(Map.of(
            "Statement", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "Effect", "Allow",
                    "Action", Match.arrayWith(Arrays.asList(
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"))))))))));
  }

  /**
   * Test VPC and Lambda networking integration.
   */
  @Test
  public void testVpcLambdaNetworking() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify Lambda is configured with VPC
    template.hasResourceProperties("AWS::Lambda::Function", Map.of(
        "VpcConfig", Match.objectLike(Map.of(
            "SecurityGroupIds", Match.anyValue(),
            "SubnetIds", Match.anyValue()))));

    // Verify security group has egress rules (CDK creates default allow-all rule)
    template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
        "SecurityGroupEgress", Match.arrayWith(Arrays.asList(
            Match.objectLike(Map.of(
                "IpProtocol", "-1",
                "CidrIp", "0.0.0.0/0"))))));
  }

  /**
   * Test CloudWatch monitoring integration.
   */
  @Test
  public void testCloudWatchMonitoring() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify CloudWatch Log Group for Lambda
    template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
        "LogGroupName", Match.stringLikeRegexp("/aws/lambda/tap-test-\\d+-backend"),
        "RetentionInDays", 14));

    // Verify CloudWatch Alarm configuration
    template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
        "ComparisonOperator", "GreaterThanThreshold",
        "EvaluationPeriods", 2,
        "Threshold", 1.0,
        "TreatMissingData", "notBreaching"));
  }

  /**
   * Test AWS Config and compliance monitoring integration.
   */
  @Test
  public void testConfigCompliance() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify Config Recorder is properly configured
    template.hasResourceProperties("AWS::Config::ConfigurationRecorder", Map.of(
        "RecordingGroup", Match.objectLike(Map.of(
            "AllSupported", true,
            "IncludeGlobalResourceTypes", true))));

    // Verify Config Delivery Channel
    template.hasResourceProperties("AWS::Config::DeliveryChannel", Map.of(
        "S3BucketName", Match.anyValue()));

    // Verify Config IAM Role
    template.hasResourceProperties("AWS::IAM::Role", Map.of(
        "AssumeRolePolicyDocument", Match.objectLike(Map.of(
            "Statement", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "Principal", Match.objectLike(Map.of(
                        "Service", "config.amazonaws.com"))))))))));
  }

  /**
   * Test that deployment outputs file can be read when present.
   * This test only runs when deployment outputs are available.
   */
  @Test
  public void testDeploymentOutputsStructure() {
    Path outputsPath = Paths.get("cfn-outputs/flat-outputs.json");

    if (Files.exists(outputsPath)) {
      assertThatCode(() -> {
        String content = Files.readString(outputsPath);
        Map<String, Object> outputs = mapper.readValue(content, Map.class);

        // Verify required outputs are present
        assertThat(outputs).containsKey("ApiGatewayUrl");
        assertThat(outputs).containsKey("DynamoDBTableName");
        assertThat(outputs).containsKey("LambdaFunctionArn");
        assertThat(outputs).containsKey("VpcId");

        // Verify outputs are not null
        assertThat(outputs.get("ApiGatewayUrl")).isNotNull();
        assertThat(outputs.get("DynamoDBTableName")).isNotNull();
        assertThat(outputs.get("LambdaFunctionArn")).isNotNull();
        assertThat(outputs.get("VpcId")).isNotNull();
      }).doesNotThrowAnyException();
    } else {
      // Skip test if outputs file doesn't exist
      System.out.println("Skipping deployment outputs test - file not found");
    }
  }

  /**
   * Test end-to-end workflow simulation.
   */
  @Test
  public void testEndToEndWorkflow() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify complete workflow: API Gateway -> Lambda -> DynamoDB

    // 1. API Gateway exists with proper configuration
    template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
        "Name", Match.stringLikeRegexp("tap-test-\\d+-api")));

    // 2. Lambda function exists with proper runtime
    template.hasResourceProperties("AWS::Lambda::Function", Map.of(
        "Runtime", "java21",
        "MemorySize", 512));

    // 3. DynamoDB table exists with proper billing mode
    template.hasResourceProperties("AWS::DynamoDB::GlobalTable", Map.of(
        "TableName", Match.stringLikeRegexp("tap-test-\\d+-data"),
        "BillingMode", "PROVISIONED"));

    // 4. All monitoring components exist
    template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of());
    // Application Insights temporarily disabled due to Resource Group dependency
    // template.hasResourceProperties("AWS::ApplicationInsights::Application",
    // Map.of());

    // 5. Security components exist
    template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of());
    template.hasResourceProperties("AWS::IAM::Role", Map.of());
  }

  /**
   * Test resource cleanup configuration.
   */
  @Test
  public void testResourceCleanup() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify resources have proper deletion policies
    template.hasResource("AWS::S3::Bucket", Map.of(
        "UpdateReplacePolicy", "Delete",
        "DeletionPolicy", "Delete"));

    // Verify DynamoDB table can be deleted
    template.hasResource("AWS::DynamoDB::GlobalTable", Map.of(
        "UpdateReplacePolicy", "Delete",
        "DeletionPolicy", "Delete"));
  }

  /**
   * Test stack outputs are properly configured.
   */
  @Test
  public void testStackOutputsConfiguration() {
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    Template template = Template.fromStack(stack);

    // Verify all required outputs exist with descriptions
    template.hasOutput("ApiGatewayUrl", Map.of(
        "Description", "API Gateway URL"));

    template.hasOutput("DynamoDBTableName", Map.of(
        "Description", "DynamoDB Table Name"));

    template.hasOutput("LambdaFunctionArn", Map.of(
        "Description", "Lambda Function ARN"));

    template.hasOutput("VpcId", Map.of(
        "Description", "VPC ID"));
  }
}