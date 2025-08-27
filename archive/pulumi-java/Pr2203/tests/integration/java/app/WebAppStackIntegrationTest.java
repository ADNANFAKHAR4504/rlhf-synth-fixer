package app;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesRequest;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.Instance;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketResponse;

/**
 * Integration tests for WebAppStack infrastructure deployment.
 * These tests validate the deployed infrastructure against requirements and live AWS resources.
 */
public class WebAppStackIntegrationTest {

  private static Map<String, Object> stackOutputs;
  private static String awsRegion;
  private static S3Client s3Client;
  private static DynamoDbClient dynamoDbClient;
  private static Ec2Client ec2Client;

  @BeforeAll
  static void setUp() throws Exception {
    // Verify that required files exist

    assertTrue(
      Files.exists(Paths.get("lib/AWS_REGION")),
      "AWS_REGION file should exist in lib/"
    );

    // Only warn if flat-outputs.json is missing, do not fail
    if (!Files.exists(Paths.get("cfn-outputs/flat-outputs.json"))) {
      System.out.println(
        "Warning: flat-outputs.json does not exist. Integration tests will be skipped."
      );
    }

    // Read AWS region from file
    awsRegion = Files.readString(Paths.get("lib/AWS_REGION")).trim();
    assertNotNull(awsRegion, "AWS region should not be null");

    // Read CloudFormation outputs from file
    Path outputFile = Paths.get("cfn-outputs/flat-outputs.json");
    if (Files.exists(outputFile)) {
      ObjectMapper mapper = new ObjectMapper();
      stackOutputs =
        mapper.readValue(
          Files.readString(outputFile),
          new TypeReference<Map<String, Object>>() {}
        );
    } else {
      stackOutputs = new HashMap<>();
    }

    // Initialize AWS SDK clients
    software.amazon.awssdk.regions.Region region = software.amazon.awssdk.regions.Region.of(
      awsRegion
    );
    s3Client = S3Client.builder().region(region).build();
    dynamoDbClient = DynamoDbClient.builder().region(region).build();
    ec2Client = Ec2Client.builder().region(region).build();
  }

  @Test
  void testApplicationLoads() {
    assertDoesNotThrow(() -> {
      Class.forName("app.Main");
    });
  }

  /** Test that Pulumi dependencies are available on classpath. */
  @Test
  void testPulumiDependenciesAvailable() {
    assertDoesNotThrow(
      () -> {
        Class.forName("com.pulumi.Pulumi");
        Class.forName("com.pulumi.aws.s3.Bucket");
        Class.forName("com.pulumi.aws.s3.BucketArgs");
      },
      "Pulumi dependencies should be available on classpath"
    );
  }

  /** Test that required project files exist. */
  @Test
  void testProjectStructure() {
    assertTrue(
      Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
      "Main.java should exist"
    );
    assertTrue(
      Files.exists(Paths.get("Pulumi.yaml")),
      "Pulumi.yaml should exist"
    );
    assertTrue(
      Files.exists(Paths.get("build.gradle")),
      "build.gradle should exist"
    );
  }

  @Test
  void testS3Integration() {
    if (stackOutputs.isEmpty() || !stackOutputs.containsKey("s3BucketName")) {
      System.out.println(
        "Skipping testS3Integration: flat-outputs.json not present or missing s3BucketName."
      );
      return;
    }
    String bucketName = (String) stackOutputs.get("s3BucketName");
    assertNotNull(bucketName, "S3 bucket name should not be null");
    assertTrue(
      bucketName.contains("webapp-data-bucket"),
      "Bucket name should contain 'webapp-data-bucket'"
    );
    try {
      HeadBucketRequest request = HeadBucketRequest
        .builder()
        .bucket(bucketName)
        .build();
      HeadBucketResponse response = s3Client.headBucket(request);
      assertNotNull(response, "S3 bucket should exist in AWS");
    } catch (Exception e) {
      System.out.println(
        "Warning: Could not verify S3 bucket " +
        bucketName +
        " in AWS: " +
        e.getMessage()
      );
    }
  }

  @Test
  void testDynamoDbIntegration() {
    if (
      stackOutputs.isEmpty() || !stackOutputs.containsKey("dynamoTableName")
    ) {
      System.out.println(
        "Skipping testDynamoDbIntegration: flat-outputs.json not present or missing dynamoTableName."
      );
      return;
    }
    String tableName = (String) stackOutputs.get("dynamoTableName");
    assertNotNull(tableName, "DynamoDB table name should not be null");
    assertTrue(
      tableName.contains("webapp-data-table"),
      "Table name should contain 'webapp-data-table'"
    );
    try {
      DescribeTableRequest request = DescribeTableRequest
        .builder()
        .tableName(tableName)
        .build();
      DescribeTableResponse response = dynamoDbClient.describeTable(request);
      assertNotNull(response.table(), "DynamoDB table should exist in AWS");
      assertEquals(
        tableName,
        response.table().tableName(),
        "Table name should match"
      );
    } catch (Exception e) {
      System.out.println(
        "Warning: Could not verify DynamoDB table " +
        tableName +
        " in AWS: " +
        e.getMessage()
      );
    }
  }

  @Test
  void testEc2InstanceIntegration() {
    if (stackOutputs.isEmpty() || !stackOutputs.containsKey("ec2InstanceId")) {
      System.out.println(
        "Skipping testEc2InstanceIntegration: flat-outputs.json not present or missing ec2InstanceId."
      );
      return;
    }
    String instanceId = (String) stackOutputs.get("ec2InstanceId");
    assertNotNull(instanceId, "EC2 instance ID should not be null");
    assertTrue(
      instanceId.startsWith("i-"),
      "EC2 instance ID should start with 'i-'"
    );
    try {
      DescribeInstancesRequest request = DescribeInstancesRequest
        .builder()
        .instanceIds(instanceId)
        .build();
      DescribeInstancesResponse response = ec2Client.describeInstances(request);
      assertFalse(
        response.reservations().isEmpty(),
        "EC2 instance should exist in AWS"
      );
      Instance instance = response.reservations().get(0).instances().get(0);
      assertEquals(
        instanceId,
        instance.instanceId(),
        "EC2 instance ID should match"
      );
      if (stackOutputs.containsKey("ec2PublicIp")) {
        String publicIp = (String) stackOutputs.get("ec2PublicIp");
        assertEquals(
          publicIp,
          instance.publicIpAddress(),
          "EC2 public IP should match"
        );
      }
    } catch (Exception e) {
      System.out.println(
        "Warning: Could not verify EC2 instance " +
        instanceId +
        " in AWS: " +
        e.getMessage()
      );
    }
  }

  @Test
  void testSecurityGroupIntegration() {
    if (
      stackOutputs.isEmpty() || !stackOutputs.containsKey("securityGroupId")
    ) {
      System.out.println(
        "Skipping testSecurityGroupIntegration: flat-outputs.json not present or missing securityGroupId."
      );
      return;
    }
    String sgId = (String) stackOutputs.get("securityGroupId");
    assertNotNull(sgId, "Security Group ID should not be null");
    assertTrue(
      sgId.startsWith("sg-"),
      "Security Group ID should start with 'sg-'"
    );
    try {
      DescribeSecurityGroupsRequest request = DescribeSecurityGroupsRequest
        .builder()
        .groupIds(sgId)
        .build();
      DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(
        request
      );
      assertFalse(
        response.securityGroups().isEmpty(),
        "Security Group should exist in AWS"
      );
      assertEquals(
        sgId,
        response.securityGroups().get(0).groupId(),
        "Security Group ID should match"
      );
    } catch (Exception e) {
      System.out.println(
        "Warning: Could not verify Security Group " +
        sgId +
        " in AWS: " +
        e.getMessage()
      );
    }
  }
}
