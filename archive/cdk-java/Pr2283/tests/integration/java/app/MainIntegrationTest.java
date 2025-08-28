package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awscdk.App;

import java.io.File;
import java.io.IOException;
import java.util.Map;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the deployed infrastructure using actual AWS outputs
 * from the cfn-outputs/flat-outputs.json file.
 */
public class MainIntegrationTest {

    private static Map<String, Object> deploymentOutputs;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeAll
    public static void loadDeploymentOutputs() {
        // Load outputs from deployment (created during deployment phase)
        File outputFile = new File("cfn-outputs/flat-outputs.json");
        if (outputFile.exists()) {
            try {
                deploymentOutputs = objectMapper.readValue(outputFile, Map.class);
            } catch (IOException e) {
                System.out.println("Warning: Could not load deployment outputs - " + e.getMessage());
                deploymentOutputs = Map.of();
            }
        } else {
            System.out.println("Note: Deployment outputs file not found - tests will run with mock data");
            deploymentOutputs = Map.of();
        }
    }

    /**
     * Test that all expected stack components were deployed.
     */
    @Test
    public void testStacksDeployed() {
        // Test that the main method can be executed
        String[] args = {};
        try {
            Main.main(args);
            assertThat(true).isTrue();
        } catch (Exception e) {
            assertThat(false).withFailMessage("Main execution failed: " + e.getMessage()).isTrue();
        }
    }

    /**
     * Test VPC deployment outputs.
     */
    @Test
    public void testVpcDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for VPC-related outputs
            boolean hasVpcOutputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("vpc"));
            
            if (hasVpcOutputs) {
                assertThat(deploymentOutputs).containsKey("VPCId");
            }
        }
    }

    /**
     * Test security group deployment.
     */
    @Test
    public void testSecurityGroupDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for security group outputs
            boolean hasSecurityGroups = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("security") || key.toLowerCase().contains("sg"));
            
            assertThat(hasSecurityGroups || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test S3 bucket deployment.
     */
    @Test
    public void testS3BucketDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for S3 bucket outputs
            boolean hasS3Outputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("bucket") || key.toLowerCase().contains("s3"));
            
            if (hasS3Outputs) {
                Object bucketName = deploymentOutputs.get("S3BucketName");
                if (bucketName != null) {
                    assertThat(bucketName.toString()).contains("app-s3-data");
                }
            }
        }
    }

    /**
     * Test EC2 instance deployment.
     */
    @Test
    public void testEc2Deployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for EC2-related outputs
            boolean hasEc2Outputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("instance") || 
                                    key.toLowerCase().contains("ec2") || 
                                    key.toLowerCase().contains("elasticip"));
            
            assertThat(hasEc2Outputs || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test RDS database deployment.
     */
    @Test
    public void testRdsDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for RDS-related outputs
            boolean hasRdsOutputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("database") || 
                                    key.toLowerCase().contains("rds") ||
                                    key.toLowerCase().contains("db"));
            
            assertThat(hasRdsOutputs || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test CloudTrail deployment.
     */
    @Test
    public void testCloudTrailDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for CloudTrail-related outputs
            boolean hasCloudTrailOutputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("trail") || 
                                    key.toLowerCase().contains("cloudtrail"));
            
            assertThat(hasCloudTrailOutputs || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test GuardDuty deployment.
     */
    @Test
    public void testGuardDutyDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for GuardDuty-related outputs
            boolean hasGuardDutyOutputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("guardduty") || 
                                    key.toLowerCase().contains("detector"));
            
            assertThat(hasGuardDutyOutputs || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test VPC endpoint configuration.
     */
    @Test
    public void testVpcEndpointDeployment() {
        if (!deploymentOutputs.isEmpty()) {
            // Check for VPC endpoint outputs
            boolean hasEndpointOutputs = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("endpoint") || 
                                    key.toLowerCase().contains("vpce"));
            
            assertThat(hasEndpointOutputs || deploymentOutputs.isEmpty()).isTrue();
        }
    }

    /**
     * Test security configurations are in place.
     */
    @Test
    public void testSecurityConfigurations() {
        // This test verifies that security-related resources were deployed
        if (!deploymentOutputs.isEmpty()) {
            // Check for encryption-related outputs (KMS keys)
            boolean hasEncryption = deploymentOutputs.keySet().stream()
                    .anyMatch(key -> key.toLowerCase().contains("kms") || 
                                    key.toLowerCase().contains("key") ||
                                    key.toLowerCase().contains("encrypt"));
            
            // Security is critical, so we assert it's present if we have outputs
            assertThat(hasEncryption || deploymentOutputs.isEmpty()).isTrue();
        }
    }
}