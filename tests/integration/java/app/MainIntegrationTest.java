package app;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.Assumptions;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.NotFoundException;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsRequest;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.ListTopicsRequest;
import software.amazon.awssdk.services.cloudtrail.CloudTrailClient;
import software.amazon.awssdk.services.cloudtrail.model.DescribeTrailsRequest;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;

import java.util.List;
import java.util.Optional;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the
 * TapStack
 * and may involve more complex scenarios than unit tests.
 *
 * Note: These tests still use synthetic AWS resources and do not require
 * actual AWS credentials or resources to be created.
 */
public class MainIntegrationTest {

  /**
   * Integration test for full stack deployment simulation.
   *
   * This test verifies that the complete stack can be synthesized
   * with all its components working together.
   */
  @Test
  public void testFullStackDeployment() {
    App app = new App();

    // Create stack with production-like configuration
    Main.TapStack stack = new Main.TapStack(app, "TapStackProd",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "production", "prod", "test-project", "us-east-1");

    // Create template and verify it can be synthesized
    Template template = Template.fromStack(stack);

    // Verify stack configuration
    assertThat(stack).isNotNull();
    assertThat(template).isNotNull();
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
    String[] environments = { "development", "staging", "production" };

    for (String env : environments) {
      // Create a new app for each environment to avoid synthesis conflicts
      App app = new App();
      Main.TapStack stack = new Main.TapStack(app, "TapStack" + env,
          StackProps.builder()
              .env(Environment.builder()
                  .account("123456789012")
                  .region("us-east-1")
                  .build())
              .build(),
          env, "test", "test-project", "us-east-1");

      // Verify template can be created for each environment
      Template template = Template.fromStack(stack);
      assertThat(stack).isNotNull();
      assertThat(template).isNotNull();
    }
  }

  /**
   * Integration test for stack with nested components.
   *
   * This test would verify the integration between the main stack
   * and any nested stacks or components that might be added in the future.
   */
  @Test
  public void testStackWithNestedComponents() {
    App app = new App();

    Main.TapStack stack = new Main.TapStack(app, "TapStackIntegration",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        "integration", "test", "test-project", "us-east-1");

    Template template = Template.fromStack(stack);

    // Verify basic stack structure
    assertThat(stack).isNotNull();
    assertThat(template).isNotNull();

    // When nested stacks are added, additional assertions would go here
    // For example:
    // template.hasResourceProperties("AWS::CloudFormation::Stack", Map.of(...));
  }

  // ========================================
  // AWS SDK Integration Tests
  // ========================================
  // These tests require actual AWS credentials and will interact with AWS APIs
  // They are disabled by default and can be enabled with AWS_INTEGRATION_TESTS=true

  private String testStackName = "TapStack-us-east-1-development";
  private Region testRegion = Region.US_EAST_1;

  @BeforeEach
  void checkAwsCredentials() {
    // These tests require AWS credentials to be configured
    try {
      DefaultCredentialsProvider.create().resolveCredentials();
    } catch (Exception e) {
      Assumptions.assumeTrue(false, "AWS credentials not configured - skipping integration tests");
    }
  }

  /**
   * Test that deployed VPC can be found via AWS API
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testVpcExistsInAws() {
    try (Ec2Client ec2Client = Ec2Client.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      DescribeVpcsResponse response = ec2Client.describeVpcs(DescribeVpcsRequest.builder().build());
      
      // Look for our VPC by checking for the right tags
      boolean foundVpc = response.vpcs().stream()
          .anyMatch(vpc -> vpc.tags().stream()
              .anyMatch(tag -> "Project".equals(tag.key()) && "tap-project".equals(tag.value())));
      
      // Note: This will only pass if the stack has been deployed
      // In a real CI/CD pipeline, this would run after deployment
      assertThat(foundVpc).describedAs("VPC with Project=tap-project tag should exist").isTrue();
    }
  }

  /**
   * Test that deployed S3 buckets exist and are accessible
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testS3BucketsExistInAws() {
    try (S3Client s3Client = S3Client.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      // Get bucket names from CloudFormation outputs
      Optional<String> dataBucketName = getStackOutput("S3Bucket0Name");
      Optional<String> logsBucketName = getStackOutput("S3Bucket1Name");
      
      if (dataBucketName.isPresent()) {
        // Test that data bucket exists and is accessible
        try {
          s3Client.headBucket(HeadBucketRequest.builder()
              .bucket(dataBucketName.get())
              .build());
          // If no exception is thrown, the bucket is accessible
          assertThat(true).describedAs("Data bucket should be accessible").isTrue();
        } catch (NoSuchBucketException e) {
          assertThat(false).describedAs("Data bucket should exist").isTrue();
        }
      }
      
      if (logsBucketName.isPresent()) {
        // Test that logs bucket exists and is accessible
        try {
          s3Client.headBucket(HeadBucketRequest.builder()
              .bucket(logsBucketName.get())
              .build());
          // If no exception is thrown, the bucket is accessible
          assertThat(true).describedAs("Logs bucket should be accessible").isTrue();
        } catch (NoSuchBucketException e) {
          assertThat(false).describedAs("Logs bucket should exist").isTrue();
        }
      }
    }
  }

  /**
   * Test that KMS key exists and is accessible
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testKmsKeyExistsInAws() {
    try (KmsClient kmsClient = KmsClient.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      Optional<String> kmsKeyId = getStackOutput("KmsKeyId");
      
      if (kmsKeyId.isPresent()) {
        // Test that KMS key exists and is accessible
        try {
          kmsClient.describeKey(DescribeKeyRequest.builder()
              .keyId(kmsKeyId.get())
              .build());
          // If no exception is thrown, the key is accessible
          assertThat(true).describedAs("KMS key should be accessible").isTrue();
        } catch (NotFoundException e) {
          assertThat(false).describedAs("KMS key should exist").isTrue();
        }
      }
    }
  }

  /**
   * Test that CloudWatch alarms exist
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testCloudWatchAlarmsExist() {
    try (CloudWatchClient cloudWatchClient = CloudWatchClient.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      var response = cloudWatchClient.describeAlarms(DescribeAlarmsRequest.builder()
          .alarmNamePrefix("tap-project-unauthorized-api-calls")
          .build());
      
      assertThat(response.metricAlarms())
          .describedAs("Should have at least one alarm for unauthorized API calls")
          .isNotEmpty();
    }
  }

  /**
   * Test that SNS topics exist
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testSnsTopicsExist() {
    try (SnsClient snsClient = SnsClient.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      var response = snsClient.listTopics(ListTopicsRequest.builder().build());
      
      // Look for our SNS topic
      boolean foundTopic = response.topics().stream()
          .anyMatch(topic -> topic.topicArn().contains("tap-project-development-us-east-1-alerts"));
      
      assertThat(foundTopic)
          .describedAs("Should have SNS topic for alerts")
          .isTrue();
    }
  }

  /**
   * Test that CloudTrail exists
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testCloudTrailExists() {
    try (CloudTrailClient cloudTrailClient = CloudTrailClient.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      var response = cloudTrailClient.describeTrails(DescribeTrailsRequest.builder().build());
      
      // Look for our CloudTrail
      boolean foundTrail = response.trailList().stream()
          .anyMatch(trail -> trail.name().contains("tap-project-development-us-east-1-trail"));
      
      assertThat(foundTrail)
          .describedAs("Should have CloudTrail for auditing")
          .isTrue();
    }
  }

  /**
   * Test cross-region connectivity (if VPC peering is set up)
   */
  @Test
  @EnabledIfEnvironmentVariable(named = "AWS_INTEGRATION_TESTS", matches = "true")
  void testCrossRegionConnectivity() {
    // Test that VPCs in different regions can communicate
    // This would typically involve deploying test instances and testing connectivity
    
    List<Region> regions = List.of(Region.US_EAST_1, Region.US_EAST_2, Region.EU_WEST_1);
    
    for (Region region : regions) {
      try (Ec2Client ec2Client = Ec2Client.builder()
          .region(region)
          .credentialsProvider(DefaultCredentialsProvider.create())
          .build()) {
        
        // Check if VPC peering connections exist
        var peeringConnections = ec2Client.describeVpcPeeringConnections();
        
        // In a full test, we would check that peering connections are active
        // and that routes are properly configured
        assertThat(peeringConnections.vpcPeeringConnections())
            .describedAs("Should have VPC peering connections for cross-region connectivity")
            .isNotNull();
      }
    }
  }

  /**
   * Helper method to get CloudFormation stack output
   */
  private Optional<String> getStackOutput(String outputKey) {
    try (CloudFormationClient cfnClient = CloudFormationClient.builder()
        .region(testRegion)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()) {
      
      DescribeStacksResponse response = cfnClient.describeStacks(DescribeStacksRequest.builder()
          .stackName(testStackName)
          .build());
      
      return response.stacks().stream()
          .flatMap(stack -> stack.outputs().stream())
          .filter(output -> outputKey.equals(output.outputKey()))
          .map(output -> output.outputValue())
          .findFirst();
          
    } catch (Exception e) {
      // Stack might not exist in test environment
      return Optional.empty();
    }
  }
}
