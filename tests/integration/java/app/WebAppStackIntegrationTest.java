package app;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Integration tests for WebAppStack infrastructure deployment.
 * These tests validate the deployed infrastructure against requirements.
 */
public class WebAppStackIntegrationTest {

  private ObjectMapper objectMapper;
  private JsonNode outputs;
  private boolean outputsLoaded = false;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
    loadDeploymentOutputs();
  }

  private void loadDeploymentOutputs() {
    try {
      File outputsFile = new File("cfn-outputs/flat-outputs.json");
      if (outputsFile.exists()) {
        outputs = objectMapper.readTree(outputsFile);
        outputsLoaded = true;
      }
    } catch (IOException e) {
      System.out.println(
        "Deployment outputs not available - integration tests will be limited"
      );
      outputsLoaded = false;
    }
  }

  @Test
  void testDeployedOutputsPresentAndValid() {
    assertTrue(outputsLoaded, "Outputs file should be loaded");

    // Validate presence and format of expected outputs
    assertTrue(outputs.has("dynamoTableName"));
    assertTrue(outputs.has("ec2InstanceId"));
    assertTrue(outputs.has("ec2PublicIp"));
    assertTrue(outputs.has("s3BucketName"));
    assertTrue(outputs.has("securityGroupId"));

    String tableName = outputs.get("dynamoTableName").asText();
    String ec2Id = outputs.get("ec2InstanceId").asText();
    String ec2Ip = outputs.get("ec2PublicIp").asText();
    String bucketName = outputs.get("s3BucketName").asText();
    String sgId = outputs.get("securityGroupId").asText();

    assertNotNull(tableName);
    assertTrue(tableName.startsWith("webapp-data-table-"));

    assertNotNull(ec2Id);
    assertTrue(ec2Id.startsWith("i-"));

    assertNotNull(ec2Ip);
    assertTrue(ec2Ip.matches("\\d+\\.\\d+\\.\\d+\\.\\d+"));

    assertNotNull(bucketName);
    assertTrue(bucketName.startsWith("webapp-data-bucket-"));

    assertNotNull(sgId);
    assertTrue(sgId.startsWith("sg-"));
  }

  @Test
  void testWebAppStackConfigIntegration() {
    WebAppStackConfig config = new WebAppStackConfig();
    String environmentSuffix = config.getEnvironmentSuffix();
    assertNotNull(environmentSuffix);
    assertTrue(environmentSuffix.length() > 0);
    assertNotNull(config.getAwsRegion());
    assertNotNull(config.getInstanceType());
  }

  // Pulumi resource instantiation tests removed. Only pure Java/config/output tests remain.

  @Test
  void testResourceNameGeneration() {
    WebAppStackConfig config = new WebAppStackConfig();
    String env = config.getEnvironmentSuffix();
    assertEquals("webapp-vpc-" + env, config.getResourceName("webapp-vpc"));
    assertEquals(
      "webapp-data-bucket-" + env,
      config.getResourceName("webapp-data-bucket")
    );
  }
}
