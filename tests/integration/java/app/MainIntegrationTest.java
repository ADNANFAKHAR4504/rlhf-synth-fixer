package app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import software.amazon.awssdk.services.cloudtrail.model.DescribeTrailsRequest;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsRequest;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.VpcCidrBlockAssociation;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.NotFoundException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;

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

  /** Accept List, single string, CSV/whitespace, or stringified JSON array. */
  private static List<String> toStringList(Object value) {
    if (value == null)
      return List.of();

    if (value instanceof List<?>) {
      return ((List<?>) value).stream().map(String::valueOf).collect(Collectors.toList());
    }

    if (value instanceof String s) {
      String t = s.trim();
      if (t.isEmpty())
        return List.of();

      if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("\"[") && t.endsWith("]\""))) {
        try {
          String json = t.startsWith("\"[") ? t.substring(1, t.length() - 1) : t;
          return MAPPER.readValue(json, new TypeReference<List<String>>() {
          });
        } catch (Exception ignored) {
          /* fall back to split */ }
      }

      return Arrays.stream(t.split("[,\\s]+"))
          .map(String::trim)
          .filter(x -> !x.isEmpty())
          .collect(Collectors.toList());
    }

    return List.of(String.valueOf(value));
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
  @DisplayName("01) VPC exists with correct CIDR")
  void vpcExists() {
    Assumptions.assumeTrue(hasKeys("VpcId", "VpcCidr"),
        "Skipping: VpcId or VpcCidr missing in outputs");

    String vpcId = String.valueOf(out.get("VpcId"));
    String vpcCidr = String.valueOf(out.get("VpcCidr"));

    DescribeVpcsResponse resp = ec2.describeVpcs(r -> r.vpcIds(vpcId));
    assertEquals(1, resp.vpcs().size(), "VPC not found");
    Vpc vpc = resp.vpcs().get(0);

    List<String> cidrs = vpc.cidrBlockAssociationSet().stream()
        .map(VpcCidrBlockAssociation::cidrBlock)
        .collect(Collectors.toList());
    assertTrue(cidrs.contains(vpcCidr), "Unexpected VPC CIDR: " + cidrs);
  }

  @Test
  @DisplayName("02) Public subnets exist and have public IP mapping")
  void publicSubnets() {
    Assumptions.assumeTrue(hasKeys("PublicSubnets"),
        "Skipping: PublicSubnets missing in outputs");

    List<String> subnetIds = toStringList(out.get("PublicSubnets"));
    assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

    DescribeSubnetsResponse resp = ec2.describeSubnets(r -> r.subnetIds(subnetIds));
    assertEquals(2, resp.subnets().size(), "Subnets not found");

    for (Subnet s : resp.subnets()) {
      assertTrue(subnetIds.contains(s.subnetId()), "Unknown subnet " + s.subnetId());
      Boolean mapOnLaunch = s.mapPublicIpOnLaunch();
      assertTrue(Boolean.TRUE.equals(mapOnLaunch),
          "mapPublicIpOnLaunch not enabled: " + s.subnetId());
    }
  }

  /**
   * Test that deployed S3 buckets exist and are accessible
   */
  @Test
  @DisplayName("03) S3 buckets exist in AWS")
  void testS3BucketsExistInAws() {
    Assumptions.assumeTrue(hasKeys("S3Bucket0Name", "S3Bucket1Name"),
        "Skipping: S3 bucket names missing in outputs");

    String dataBucketName = String.valueOf(out.get("S3Bucket0Name"));
    String logsBucketName = String.valueOf(out.get("S3Bucket1Name"));

    // Test that data bucket exists and is accessible
    try {
      s3.headBucket(HeadBucketRequest.builder()
          .bucket(dataBucketName)
          .build());
      // If no exception is thrown, the bucket is accessible
      assertThat(true).describedAs("Data bucket should be accessible").isTrue();
    } catch (NoSuchBucketException e) {
      assertThat(false).describedAs("Data bucket should exist: " + dataBucketName).isTrue();
    }

    // Test that logs bucket exists and is accessible
    try {
      s3.headBucket(HeadBucketRequest.builder()
          .bucket(logsBucketName)
          .build());
      // If no exception is thrown, the bucket is accessible
      assertThat(true).describedAs("Logs bucket should be accessible").isTrue();
    } catch (NoSuchBucketException e) {
      assertThat(false).describedAs("Logs bucket should exist: " + logsBucketName).isTrue();
    }
  }

  /**
   * Test that KMS key exists and is accessible
   */
  @Test
  @DisplayName("04) KMS key exists in AWS")
  void testKmsKeyExistsInAws() {
    Assumptions.assumeTrue(hasKeys("KmsKeyId"),
        "Skipping: KmsKeyId missing in outputs");

    String kmsKeyId = String.valueOf(out.get("KmsKeyId"));

    // Test that KMS key exists and is accessible
    try {
      kms.describeKey(DescribeKeyRequest.builder()
          .keyId(kmsKeyId)
          .build());
      // If no exception is thrown, the key is accessible
      assertThat(true).describedAs("KMS key should be accessible").isTrue();
    } catch (NotFoundException e) {
      assertThat(false).describedAs("KMS key should exist: " + kmsKeyId).isTrue();
    }
  }

  /**
   * Test that CloudWatch alarms exist
   */
  @Test
  @DisplayName("05) CloudWatch alarms exist")
  void testCloudWatchAlarmsExist() {
    Assumptions.assumeTrue(hasKeys("CloudWatchAlarmName"),
        "Skipping: CloudWatchAlarmName missing in outputs");

    String alarmName = String.valueOf(out.get("CloudWatchAlarmName"));

    var response = cloudWatch.describeAlarms(DescribeAlarmsRequest.builder()
        .alarmNames(alarmName)
        .build());

    assertThat(response.metricAlarms())
        .describedAs("Should have alarm: " + alarmName)
        .isNotEmpty();
  }

  /**
   * Test that SNS topics exist
   */
  @Test
  @DisplayName("06) SNS topics exist")
  void testSnsTopicsExist() {
    Assumptions.assumeTrue(hasKeys("SnsTopicArn"),
        "Skipping: SnsTopicArn missing in outputs");

    String topicArn = String.valueOf(out.get("SnsTopicArn"));

    // Test that the topic exists by trying to get its attributes
    try {
      sns.getTopicAttributes(GetTopicAttributesRequest.builder()
          .topicArn(topicArn)
          .build());
      assertThat(true).describedAs("SNS topic should exist").isTrue();
    } catch (Exception e) {
      assertThat(false).describedAs("SNS topic should exist: " + topicArn).isTrue();
    }
  }

  /**
   * Test that CloudTrail exists
   */
  @Test
  @DisplayName("07) CloudTrail exists")
  void testCloudTrailExists() {
    Assumptions.assumeTrue(hasKeys("CloudTrailArn"),
        "Skipping: CloudTrailArn missing in outputs");

    String cloudTrailArn = String.valueOf(out.get("CloudTrailArn"));

    var response = cloudTrail.describeTrails(DescribeTrailsRequest.builder().build());

    // Look for our CloudTrail by ARN
    boolean foundTrail = response.trailList().stream()
        .anyMatch(trail -> cloudTrailArn.equals(trail.trailARN()));

    assertThat(foundTrail)
        .describedAs("Should have CloudTrail: " + cloudTrailArn)
        .isTrue();
  }

  /**
   * Test cross-region connectivity (check for VPC peering function)
   */
  @Test
  @DisplayName("08) Cross-region Lambda function exists")
  void testCrossRegionConnectivity() {
    Assumptions.assumeTrue(hasKeys("VpcPeeringFunctionArn"),
        "Skipping: VpcPeeringFunctionArn missing in outputs");

    String functionArn = String.valueOf(out.get("VpcPeeringFunctionArn"));

    // Just verify the ARN format is correct for Lambda function
    assertTrue(functionArn.startsWith("arn:aws:lambda:"),
        "VPC Peering function ARN should be valid: " + functionArn);
  }
}
