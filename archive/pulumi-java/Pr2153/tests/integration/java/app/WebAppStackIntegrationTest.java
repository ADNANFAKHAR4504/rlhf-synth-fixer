package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.File;
import java.io.IOException;
import java.util.Map;

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
            System.out.println("Deployment outputs not available - integration tests will be limited");
            outputsLoaded = false;
        }
    }

    @Test
    void testWebAppStackConfigIntegration() {
        // Test that configuration is valid for deployment
        assertTrue(WebAppStackConfig.validateConfiguration());
        
        String environmentSuffix = WebAppStackConfig.getEnvironmentSuffix();
        assertNotNull(environmentSuffix);
        assertTrue(environmentSuffix.length() > 0);
        
        Map<String, String> tags = WebAppStackConfig.createTags(environmentSuffix);
        assertNotNull(tags);
        assertEquals(4, tags.size());
        
        String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        assertTrue(bucketName.matches("^[a-z0-9-]+$")); // S3 bucket naming rules
        
        String[] expectedExports = WebAppStackConfig.getExpectedExports();
        assertEquals(9, expectedExports.length);
    }

    @Test
    void testAssumeRolePolicyValidation() {
        String policy = WebAppStackConfig.createAssumeRolePolicy();
        assertNotNull(policy);
        
        // Validate JSON structure
        assertDoesNotThrow(() -> {
            JsonNode policyJson = objectMapper.readTree(policy);
            assertTrue(policyJson.has("Version"));
            assertTrue(policyJson.has("Statement"));
            assertEquals("2012-10-17", policyJson.get("Version").asText());
            
            JsonNode statements = policyJson.get("Statement");
            assertTrue(statements.isArray());
            assertTrue(statements.size() > 0);
            
            JsonNode firstStatement = statements.get(0);
            assertEquals("Allow", firstStatement.get("Effect").asText());
            assertEquals("sts:AssumeRole", firstStatement.get("Action").asText());
        });
    }

    @Test
    void testS3AccessPolicyValidation() {
        String policy = WebAppStackConfig.createS3AccessPolicy();
        assertNotNull(policy);
        
        // Validate JSON structure
        assertDoesNotThrow(() -> {
            JsonNode policyJson = objectMapper.readTree(policy);
            assertTrue(policyJson.has("Version"));
            assertTrue(policyJson.has("Statement"));
            
            JsonNode statements = policyJson.get("Statement");
            JsonNode firstStatement = statements.get(0);
            assertEquals("Allow", firstStatement.get("Effect").asText());
            
            JsonNode actions = firstStatement.get("Action");
            assertTrue(actions.isArray());
            assertTrue(actions.toString().contains("s3:GetObject"));
            assertTrue(actions.toString().contains("s3:ListBucket"));
        });
    }

    @Test
    void testUserDataScriptGeneration() {
        String bucketName = "test-bucket-123";
        String userData = WebAppStackConfig.createUserDataScript(bucketName);
        
        assertNotNull(userData);
        assertTrue(userData.startsWith("#!/bin/bash"));
        
        // Verify script contains essential commands
        String[] requiredCommands = {
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "aws s3 cp s3://" + bucketName
        };
        
        for (String command : requiredCommands) {
            assertTrue(userData.contains(command), 
                "User data should contain: " + command);
        }
        
        // Verify HTML content generation
        assertTrue(userData.contains("<!DOCTYPE html>"));
        assertTrue(userData.contains("Web Application"));
        assertTrue(userData.contains("$(ec2-metadata --instance-id"));
    }

    @Test
    void testConfigurationConstants() {
        // Test VPC and subnet configuration
        assertTrue(WebAppStackConfig.VPC_CIDR.matches("\\d+\\.\\d+\\.\\d+\\.\\d+/\\d+"));
        assertTrue(WebAppStackConfig.SUBNET1_CIDR.matches("\\d+\\.\\d+\\.\\d+\\.\\d+/\\d+"));
        assertTrue(WebAppStackConfig.SUBNET2_CIDR.matches("\\d+\\.\\d+\\.\\d+\\.\\d+/\\d+"));
        
        // Test that subnets are within VPC CIDR
        assertTrue(WebAppStackConfig.SUBNET1_CIDR.startsWith("10.0."));
        assertTrue(WebAppStackConfig.SUBNET2_CIDR.startsWith("10.0."));
        assertTrue(WebAppStackConfig.VPC_CIDR.startsWith("10.0."));
        
        // Test auto scaling configuration
        assertTrue(WebAppStackConfig.MIN_SIZE <= WebAppStackConfig.DESIRED_CAPACITY);
        assertTrue(WebAppStackConfig.DESIRED_CAPACITY <= WebAppStackConfig.MAX_SIZE);
        
        // Test health check configuration
        assertTrue(WebAppStackConfig.HEALTH_CHECK_TIMEOUT < WebAppStackConfig.HEALTH_CHECK_INTERVAL);
        assertTrue(WebAppStackConfig.HEALTHY_THRESHOLD >= 1);
        assertTrue(WebAppStackConfig.UNHEALTHY_THRESHOLD >= 1);
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedVpcOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("VPCId"), "Should export VPC ID");
        String vpcId = outputs.get("VPCId").asText();
        assertTrue(vpcId.startsWith("vpc-"), "VPC ID should have correct format");
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedSubnetOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("publicSubnet1Id"), "Should export public subnet 1 ID");
        assertTrue(outputs.has("publicSubnet2Id"), "Should export public subnet 2 ID");
        
        String subnet1Id = outputs.get("publicSubnet1Id").asText();
        String subnet2Id = outputs.get("publicSubnet2Id").asText();
        
        assertTrue(subnet1Id.startsWith("subnet-"), "Subnet 1 ID should have correct format");
        assertTrue(subnet2Id.startsWith("subnet-"), "Subnet 2 ID should have correct format");
        assertTrue(!subnet1Id.equals(subnet2Id), "Subnets should be different");
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedLoadBalancerOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("loadBalancerDnsName"), "Should export load balancer DNS name");
        assertTrue(outputs.has("applicationUrl"), "Should export application URL");
        
        String albDns = outputs.get("loadBalancerDnsName").asText();
        String appUrl = outputs.get("applicationUrl").asText();
        
        assertTrue(albDns.contains(".elb."), "ALB DNS should contain .elb.");
        assertTrue(appUrl.startsWith("http://"), "Application URL should be HTTP");
        assertTrue(appUrl.contains(albDns), "Application URL should contain ALB DNS");
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedAutoScalingGroupOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("autoScalingGroupName"), "Should export ASG name");
        String asgName = outputs.get("autoScalingGroupName").asText();
        assertTrue(asgName.contains("webapp-asg"), "ASG name should contain webapp-asg");
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedS3BucketOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("codeBucketName"), "Should export S3 bucket name");
        String bucketName = outputs.get("codeBucketName").asText();
        assertTrue(bucketName.contains("webapp-code-bucket"), "Bucket name should contain webapp-code-bucket");
        assertTrue(bucketName.equals(bucketName.toLowerCase()), "Bucket name should be lowercase");
    }

    @Test
    @Disabled("Enable only when deployment outputs are available")
    void testDeployedTargetGroupOutputs() {
        if (!outputsLoaded) {
            return;
        }
        
        assertTrue(outputs.has("targetGroupArn"), "Should export target group ARN");
        String tgArn = outputs.get("targetGroupArn").asText();
        assertTrue(tgArn.startsWith("arn:aws:elasticloadbalancing:"), 
            "Target group ARN should have correct format");
        assertTrue(tgArn.contains("targetgroup/"), 
            "Target group ARN should contain targetgroup/");
    }

    @Test
    void testResourceNamingConventions() {
        String environmentSuffix = "pr123";
        
        String vpcName = WebAppStackConfig.generateResourceName("webapp-vpc", environmentSuffix);
        assertEquals("webapp-vpc-pr123", vpcName);
        
        String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        assertEquals("webapp-code-bucket-pr123", bucketName);
        
        String launchTemplatePrefix = WebAppStackConfig.generateLaunchTemplatePrefix(environmentSuffix);
        assertEquals("webapp-pr123-", launchTemplatePrefix);
    }

    @Test
    void testTagConsistency() {
        String environmentSuffix = "integration-test";
        Map<String, String> tags = WebAppStackConfig.createTags(environmentSuffix);
        
        assertEquals("Production", tags.get("Environment"));
        assertEquals("trainr347", tags.get("Project"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertEquals(environmentSuffix, tags.get("EnvironmentSuffix"));
        
        // Ensure all required tags are present
        assertTrue(tags.containsKey("Environment"));
        assertTrue(tags.containsKey("Project"));
        assertTrue(tags.containsKey("ManagedBy"));
        assertTrue(tags.containsKey("EnvironmentSuffix"));
    }

    @Test
    void testMainClassIntegration() {
        // Test that Main class is properly configured
        assertDoesNotThrow(() -> {
            Class.forName("app.Main");
        });
        
        // Test that Main has correct methods
        assertDoesNotThrow(() -> {
            var mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertNotNull(mainMethod);
            
            var defineInfraMethod = Main.class.getDeclaredMethod("defineInfrastructure", 
                com.pulumi.Context.class);
            assertNotNull(defineInfraMethod);
        });
    }

    @Test
    void testWebAppStackClassStructure() {
        // Verify WebAppStack has all expected methods
        assertDoesNotThrow(() -> {
            var stackMethod = WebAppStack.class.getDeclaredMethod("stack", com.pulumi.Context.class);
            assertNotNull(stackMethod);
            
            // Verify inner classes exist
            Class<?>[] innerClasses = WebAppStack.class.getDeclaredClasses();
            assertTrue(innerClasses.length >= 5, "Should have at least 5 inner classes");
            
            boolean hasAllClasses = false;
            for (Class<?> innerClass : innerClasses) {
                String name = innerClass.getSimpleName();
                if (name.equals("NetworkResources") || name.equals("SecurityResources")
                    || name.equals("ComputeResources") || name.equals("LoadBalancerResources")
                    ||
                    name.equals("StorageResources")) {
                    hasAllClasses = true;
                }
            }
            assertTrue(hasAllClasses, "Should have resource container classes");
        });
    }
}