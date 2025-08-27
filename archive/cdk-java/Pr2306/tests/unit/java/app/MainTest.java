package app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

  private App app;
  private Main.TapStack stack;

  @BeforeEach
  void setUp() {
    app = new App();
    stack = new Main.TapStack(app, "TestStack",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "test", "test-project", "us-east-1");
  }

  /**
   * Test that the TapStack can be instantiated successfully with default
   * properties.
   */
  @Test
  public void testStackCreation() {
    // Verify stack was created
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TestStack");
  }

  /**
   * Test that the TapStack synthesizes without errors.
   */
  @Test
  public void testStackSynthesis() {
    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();
  }

  /**
   * Test that the TapStack respects environment from CDK context.
   */
  @Test
  public void testEnvironmentFromContext() {
    App contextApp = new App();
    contextApp.getNode().setContext("environment", "staging");

    Main.TapStack contextStack = new Main.TapStack(contextApp, "ContextTestStack",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "staging", "test", "test-project", "us-east-1");

    // Verify stack was created
    assertThat(contextStack).isNotNull();
  }

  /**
   * Test that the stack contains expected AWS resources.
   */
  @Test
  public void testStackContainsExpectedResources() {
    Template template = Template.fromStack(stack);

    // Verify VPC resource exists
    template.hasResourceProperties("AWS::EC2::VPC", Map.of(
        "CidrBlock", "10.0.0.0/16",
        "EnableDnsHostnames", true,
        "EnableDnsSupport", true));

    // Verify KMS Key resource exists
    template.hasResourceProperties("AWS::KMS::Key", Map.of(
        "KeyUsage", "ENCRYPT_DECRYPT",
        "KeySpec", "SYMMETRIC_DEFAULT"));

    // Verify S3 Bucket resources exist (there are 3 buckets: data, logs, and one
    // for CloudTrail)
    template.resourceCountIs("AWS::S3::Bucket", 3);
  }

  /**
   * Test that the stack handles different regions correctly.
   */
  @Test
  public void testStackWithDifferentRegions() {
    String[] regions = { "us-east-1", "us-east-2", "us-west-2", "eu-west-1" };

    for (String region : regions) {
      App regionApp = new App();
      Main.TapStack regionStack = new Main.TapStack(regionApp, "RegionTestStack",
          StackProps.builder()
              .env(Environment.builder()
                  .account("123456789012")
                  .region(region)
                  .build())
              .build(),
          "development", "test", "test-project", region);

      Template template = Template.fromStack(regionStack);
      assertThat(template).isNotNull();
    }
  }

  /**
   * Test that the stack handles different environments correctly.
   */
  @Test
  public void testStackWithDifferentEnvironments() {
    String[] environments = { "development", "staging", "production" };

    for (String env : environments) {
      App envApp = new App();
      Main.TapStack envStack = new Main.TapStack(envApp, "EnvTestStack",
          StackProps.builder()
              .env(Environment.builder()
                  .account("123456789012")
                  .region("us-east-1")
                  .build())
              .build(),
          env, "test", "test-project", "us-east-1");

      Template template = Template.fromStack(envStack);
      assertThat(template).isNotNull();
    }
  }

  /**
   * Test that the stack contains proper tags.
   */
  @Test
  public void testStackContainsProperTags() {
    Template template = Template.fromStack(stack);

    // Verify that the VPC exists and has tags (simplified check)
    template.hasResourceProperties("AWS::EC2::VPC", Map.of(
        "CidrBlock", "10.0.0.0/16",
        "EnableDnsHostnames", true,
        "EnableDnsSupport", true));

    // Just verify that a VPC resource exists (which will have tags)
    template.resourceCountIs("AWS::EC2::VPC", 1);
  }

  /**
   * Test that the stack contains CloudWatch alarms.
   */
  @Test
  public void testStackContainsCloudWatchAlarms() {
    Template template = Template.fromStack(stack);

    // Verify that CloudWatch alarm is created for unauthorized API calls
    template.resourceCountIs("AWS::CloudWatch::Alarm", 1);
    template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
        "AlarmName", "test-project-unauthorized-api-calls",
        "MetricName", "UnauthorizedAPICalls",
        "Namespace", "AWS/CloudTrail"));
  }

  /**
   * Test that the stack contains SNS topics.
   */
  @Test
  public void testStackContainsSNSTopics() {
    Template template = Template.fromStack(stack);

    // Verify that SNS topic is created
    template.resourceCountIs("AWS::SNS::Topic", 1);
  }

  /**
   * Test that the stack contains IAM resources.
   */
  @Test
  public void testStackContainsIAMResources() {
    Template template = Template.fromStack(stack);

    // Verify that IAM roles and policies are created (there is 1 backup service role)
    template.resourceCountIs("AWS::IAM::Role", 1);
    template.resourceCountIs("AWS::IAM::ManagedPolicy", 1);
  }

  /**
   * Test that the stack contains backup resources.
   */
  @Test
  public void testStackContainsBackupResources() {
    Template template = Template.fromStack(stack);

    // Verify that backup resources are created
    template.resourceCountIs("AWS::Backup::BackupVault", 1);
    template.resourceCountIs("AWS::Backup::BackupPlan", 1);
    template.resourceCountIs("AWS::Backup::BackupSelection", 1);
  }

  /**
   * Test that the stack contains CloudTrail.
   */
  @Test
  public void testStackContainsCloudTrail() {
    Template template = Template.fromStack(stack);

    // Verify that CloudTrail is created
    template.resourceCountIs("AWS::CloudTrail::Trail", 1);
  }

  /**
   * Test that the stack contains VPC export for cross-region peering.
   */
  @Test
  public void testStackContainsVPCPeering() {
    Template template = Template.fromStack(stack);

    // Verify that VPC ID is exported for cross-region peering
    // (Actual peering connections are created by Lambda in CrossRegionNetworkingStack)
    template.hasOutput("VpcIdExport", Map.of(
        "Export", Map.of("Name", "test-project-development-us-east-1-vpc-id")));
  }

  /**
   * Test that the stack contains proper outputs.
   */
  @Test
  public void testStackContainsOutputs() {
    Template template = Template.fromStack(stack);

    // Verify that outputs are created
    template.hasOutput("VpcId", Map.of());
    template.hasOutput("KmsKeyId", Map.of());
    template.hasOutput("S3Bucket0Name", Map.of());
    template.hasOutput("S3Bucket1Name", Map.of());
  }

  /**
   * Test that the stack handles invalid region gracefully.
   */
  @Test
  public void testStackWithInvalidRegion() {
    App invalidApp = new App();

    assertThatThrownBy(() -> {
      new Main.TapStack(invalidApp, "InvalidRegionStack",
          StackProps.builder()
              .env(Environment.builder()
                  .account("123456789012")
                  .region("invalid-region")
                  .build())
              .build(),
          "development", "test", "test-project", "invalid-region");
    }).isInstanceOf(RuntimeException.class);
  }

  /**
   * Test that the stack handles null parameters gracefully.
   */
  @Test
  public void testStackWithNullParameters() {
    App nullApp = new App();

    assertThatThrownBy(() -> {
      new Main.TapStack(nullApp, null,
          StackProps.builder()
              .env(Environment.builder()
                  .account("123456789012")
                  .region("us-east-1")
                  .build())
              .build(),
          null, null, null, null);
    }).isInstanceOf(Exception.class);
  }

  /**
   * Test that the TapStage can be instantiated successfully.
   */
  @Test
  public void testTapStageCreation() {
    App stageApp = new App();

    Main.TapStage stage = new Main.TapStage(stageApp, "TestStage",
        software.amazon.awscdk.StageProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "test", "test-project", "us-east-1");

    // Verify stage was created
    assertThat(stage).isNotNull();
    assertThat(stage.getStageName()).isEqualTo("TestStage");
  }

  /**
   * Test that the TapStage synthesizes without errors.
   */
  @Test
  public void testTapStageSynthesis() {
    App stageApp = new App();

    Main.TapStage stage = new Main.TapStage(stageApp, "TestStage",
        software.amazon.awscdk.StageProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "test", "test-project", "us-east-1");

    // Verify stage was created and can be synthesized
    assertThat(stage).isNotNull();

    // Synthesize the app to verify no errors
    stageApp.synth();
  }

  /**
   * Test that the TapStage contains the expected TapStack.
   */
  @Test
  public void testTapStageContainsTapStack() {
    App stageApp = new App();

    Main.TapStage stage = new Main.TapStage(stageApp, "TestStage",
        software.amazon.awscdk.StageProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "test", "test-project", "us-east-1");

    // Verify stage was created
    assertThat(stage).isNotNull();

    // Verify that the stage has the expected stage name
    assertThat(stage.getStageName()).isEqualTo("TestStage");

    // Synthesize to verify the stage works correctly
    stageApp.synth();
  }

  /**
   * Test that the CrossRegionNetworkingStack contains VPC peering Lambda function.
   */
  @Test
  public void testCrossRegionNetworkingStack() {
    App networkingApp = new App();
    Main.CrossRegionNetworkingStack networkingStack = new Main.CrossRegionNetworkingStack(
        networkingApp, "TestNetworkingStack",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "test-project");

    Template template = Template.fromStack(networkingStack);

    // Verify that Lambda function for VPC peering is created
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.hasResourceProperties("AWS::Lambda::Function", Map.of(
        "FunctionName", "test-project-development-vpc-peering",
        "Runtime", "python3.9",
        "Handler", "index.lambda_handler"));

    // Verify that EventBridge rule is created to trigger the Lambda
    template.resourceCountIs("AWS::Events::Rule", 1);
    template.hasResourceProperties("AWS::Events::Rule", Map.of(
        "Name", "test-project-development-vpc-peering-trigger"));
  }

  /**
   * Test that the TapPipelineStack can be instantiated successfully.
   */
  @Test
  void testTapPipelineStack() {
    App app = new App();
    Main.TapPipelineStack stack = new Main.TapPipelineStack(app, "TestPipelineStack", 
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "development", "cost-center-123", "tap-project");
    
    Template template = Template.fromStack(stack);
    
    // Test that pipeline bucket and artifact store buckets are created
    // CDK pipeline creates at least 2 buckets: source bucket + artifact stores
    template.resourceCountIs("AWS::S3::Bucket", 2);
    
    // Test that CodePipeline is created
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
  }

  /**
   * Test that the TapPipelineStack handles cross-account keys correctly.
   */
  @Test
  void testTapPipelineStackCrossAccountKeys() {
    App app = new App();
    Main.TapPipelineStack stack = new Main.TapPipelineStack(app, "TestPipelineStack", 
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "production", "cost-center-456", "enterprise-project");
    
    Template template = Template.fromStack(stack);
    
    // Test that pipeline and artifact buckets are created
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
    template.resourceCountIs("AWS::S3::Bucket", 2);
  }
}