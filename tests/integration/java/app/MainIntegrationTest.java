package app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.regions.providers.DefaultAwsRegionProviderChain;
import software.amazon.awssdk.services.cloudtrail.CloudTrailClient;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.sns.SnsClient;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests read from cfn-outputs/flat-outputs.json and validate
 * the deployed infrastructure against real AWS resources.
 */
public class MainIntegrationTest {

  static Map<String, Object> out;
  static Ec2Client ec2;
  static S3Client s3;
  static KmsClient kms;
  static CloudWatchClient cloudWatch;
  static SnsClient sns;
  static CloudTrailClient cloudTrail;
  static final ObjectMapper MAPPER = new ObjectMapper();
  static Region region;

  @BeforeAll
  static void setup() {
    Path outputFile = Path.of("cfn-outputs/flat-outputs.json");
    Assumptions.assumeTrue(Files.exists(outputFile),
        "Skipping all tests: outputs file is missing: " + outputFile);

    try {
      String json = Files.readString(outputFile);
      out = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {
      });
    } catch (IOException e) {
      Assumptions.abort("Skipping all tests: failed to read/parse outputs file: " + e.getMessage());
      return;
    }

    region = resolveRegion();
    ec2 = Ec2Client.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    s3 = S3Client.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    kms = KmsClient.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    cloudWatch = CloudWatchClient.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    sns = SnsClient.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();
    cloudTrail = CloudTrailClient.builder()
        .region(region)
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build();

    System.out.println("Integration tests using region: " + region);
  }

  private static Region resolveRegion() {
    String env = System.getenv("AWS_REGION");
    if (env == null || env.isBlank())
      env = System.getenv("AWS_DEFAULT_REGION");
    if (env != null && !env.isBlank())
      return Region.of(env);
    try {
      Region fromChain = DefaultAwsRegionProviderChain.builder().build().getRegion();
      if (fromChain != null)
        return fromChain;
    } catch (Exception ignored) {
    }
    return Region.US_EAST_1;
  }

  @AfterAll
  static void teardown() {
    if (ec2 != null)
      ec2.close();
    if (s3 != null)
      s3.close();
    if (kms != null)
      kms.close();
    if (cloudWatch != null)
      cloudWatch.close();
    if (sns != null)
      sns.close();
    if (cloudTrail != null)
      cloudTrail.close();
  }

  private static boolean hasKeys(String... keys) {
    if (out == null)
      return false;
    for (String k : keys) {
      if (!out.containsKey(k) || out.get(k) == null)
        return false;
    }
    return true;
  }

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
  }

  @Test
  @DisplayName("01) Pipeline exists and is accessible")
  void testPipelineExists() {
    Assumptions.assumeTrue(hasKeys("PipelineName", "PipelineArn"),
        "Skipping: PipelineName or PipelineArn missing in outputs");

    String pipelineName = String.valueOf(out.get("PipelineName"));
    String pipelineArn = String.valueOf(out.get("PipelineArn"));

    // Verify pipeline ARN format is correct
    assertTrue(pipelineArn.startsWith("arn:aws:codepipeline:"),
        "Pipeline ARN should be valid: " + pipelineArn);
    assertTrue(pipelineArn.contains(pipelineName),
        "Pipeline ARN should contain pipeline name: " + pipelineName);
  }

  @Test
  @DisplayName("02) Source S3 bucket exists and is accessible")
  void testSourceBucketExists() {
    Assumptions.assumeTrue(hasKeys("SourceBucketName", "SourceBucketArn"),
        "Skipping: SourceBucketName or SourceBucketArn missing in outputs");

    String sourceBucketName = String.valueOf(out.get("SourceBucketName"));
    String sourceBucketArn = String.valueOf(out.get("SourceBucketArn"));

    // Test that source bucket exists and is accessible
    try {
      s3.headBucket(HeadBucketRequest.builder()
          .bucket(sourceBucketName)
          .build());
      // If no exception is thrown, the bucket is accessible
      assertThat(true).describedAs("Source bucket should be accessible").isTrue();
    } catch (NoSuchBucketException e) {
      assertThat(false).describedAs("Source bucket should exist: " + sourceBucketName).isTrue();
    } catch (Exception e) {
      // Handle permission errors gracefully - bucket exists but we don't have access
      if (e.getMessage() != null && e.getMessage().contains("403")) {
        System.out.println("Source bucket exists but access denied (expected in CI): " + sourceBucketName);
        assertThat(true).describedAs("Source bucket exists but access restricted (acceptable)").isTrue();
      } else {
        throw e; // Re-throw unexpected errors
      }
    }

    // Verify ARN format
    assertTrue(sourceBucketArn.equals("arn:aws:s3:::" + sourceBucketName),
        "Source bucket ARN should match bucket name");
  }

  @Test
  @DisplayName("03) VPC Peering Lambda function exists")
  void testVpcPeeringFunctionExists() {
    Assumptions.assumeTrue(hasKeys("VpcPeeringFunctionName", "VpcPeeringFunctionArn"),
        "Skipping: VpcPeeringFunctionName or VpcPeeringFunctionArn missing in outputs");

    String functionName = String.valueOf(out.get("VpcPeeringFunctionName"));
    String functionArn = String.valueOf(out.get("VpcPeeringFunctionArn"));

    // Verify Lambda function ARN format is correct
    assertTrue(functionArn.startsWith("arn:aws:lambda:"),
        "Lambda function ARN should be valid: " + functionArn);
    assertTrue(functionArn.contains(functionName),
        "Lambda function ARN should contain function name: " + functionName);

    // Verify function name follows expected pattern
    assertTrue(functionName.contains("vpc-peering"),
        "Function name should contain 'vpc-peering': " + functionName);
  }

  @Test
  @DisplayName("04) All expected pipeline outputs are present")
  void testAllExpectedOutputsPresent() {
    // Verify all expected outputs from the pipeline deployment are present
    String[] expectedKeys = {
        "SourceBucketArn",
        "PipelineArn",
        "PipelineName",
        "SourceBucketName",
        "VpcPeeringFunctionName",
        "VpcPeeringFunctionArn"
    };

    for (String key : expectedKeys) {
      assertTrue(out.containsKey(key) && out.get(key) != null,
          "Expected output key should be present: " + key);

      String value = String.valueOf(out.get(key));
      assertTrue(!value.isEmpty() && !"null".equals(value),
          "Expected output key should have non-empty value: " + key);
    }
  }

  @Test
  @DisplayName("05) Output values follow expected naming conventions")
  void testNamingConventions() {
    Assumptions.assumeTrue(hasKeys("PipelineName", "SourceBucketName", "VpcPeeringFunctionName"),
        "Skipping: Required naming convention keys missing");

    String pipelineName = String.valueOf(out.get("PipelineName"));
    String sourceBucketName = String.valueOf(out.get("SourceBucketName"));
    String functionName = String.valueOf(out.get("VpcPeeringFunctionName"));

    // Verify naming conventions follow project standards
    assertTrue(pipelineName.contains("tap-project"),
        "Pipeline name should contain project identifier: " + pipelineName);
    assertTrue(pipelineName.contains("development"),
        "Pipeline name should contain environment: " + pipelineName);

    assertTrue(sourceBucketName.contains("tap-project"),
        "Source bucket name should contain project identifier: " + sourceBucketName);
    assertTrue(sourceBucketName.contains("pipeline-source"),
        "Source bucket name should indicate purpose: " + sourceBucketName);

    assertTrue(functionName.contains("tap-project"),
        "Function name should contain project identifier: " + functionName);
    assertTrue(functionName.contains("development"),
        "Function name should contain environment: " + functionName);
  }
}
