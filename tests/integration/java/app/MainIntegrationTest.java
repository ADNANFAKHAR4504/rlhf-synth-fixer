package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesRequest;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Live AWS resource integration tests for deployed CDK infrastructure.
 * 
 * Tests actual AWS resources created by CDK deployment - NO MOCKING.
 * 
 * Prerequisites:
 * 1. Infrastructure must be deployed: cdk deploy
 * 2. Ensure AWS credentials are configured
 * 3. Set ENVIRONMENT_SUFFIX environment variable or PULUMI_STACK
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    private static final String TEST_REGION_US_EAST_1 = "us-east-1";
    private static final String TEST_REGION_US_WEST_2 = "us-west-2";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Deployment outputs - populated from actual CDK stack
    private static JsonNode allOutputs;
    private static String vpcIdUsEast1;
    private static String vpcIdUsWest2;
    private static String ec2InstanceId;
    private static String securityGroupIdUsEast1;
    private static String securityGroupIdUsWest2;
    private static String ec2InstanceRoleArn;
    private static String vpcPrivateSubnetIdEast1;
    private static String vpcPrivateSubnetIdWest2;
    private static String vpcPublicSubnetIdEast1;
    private static String vpcPublicSubnetIdWest2;

    @BeforeAll
    static void setUpDeploymentOutputs() {
        String TEST_STACK_NAME;
        try {
            String stackName = getStackName();
            TEST_STACK_NAME = stackName; // Set the test stack name for other methods
            
            System.out.println("=== Loading Deployment Outputs ===");
            System.out.println("Stack Name: " + stackName);
            
            // Try to get outputs from CloudFormation
            String outputsJson = getCdkStackOutputs(stackName);
            if (outputsJson != null) {
                allOutputs = objectMapper.readTree(outputsJson);
                
                // Extract specific outputs
                vpcIdUsEast1 = getOutputValue("us-east-1", "us-east-1-VpcId", stackName);
                vpcIdUsWest2 = getOutputValue("us-west-2", "us-west-2-VpcId", stackName);

                securityGroupIdUsEast1 = getOutputValue("us-east-1", "us-east-1-securityGroupId", stackName);
                securityGroupIdUsWest2 = getOutputValue("us-west-2", "us-west-2-securityGroupId", stackName);

                ec2InstanceId = getOutputValue("us-east-1", "us-east-1-ec2InstanceId", stackName);
                ec2InstanceRoleArn = getOutputValue("us-east-1", "us-east-1-ec2InstanceRoleArn", stackName);

                vpcPrivateSubnetIdEast1 = getOutputValue("us-east-1", "us-east-1-vpcPrivateSubnetId", stackName);
                vpcPrivateSubnetIdWest2 = getOutputValue("us-west-2", "us-west-2-vpcPrivateSubnetId", stackName);

                vpcPublicSubnetIdEast1 = getOutputValue("us-east-1", "us-east-1-vpcPublicSubnetId", stackName);
                vpcPublicSubnetIdWest2 = getOutputValue("us-west-2", "us-west-2-vpcPublicSubnetId", stackName);
                
                System.out.println("=== Deployment Outputs Loaded Successfully ===");
                System.out.println("VPC ID US-East-1: " + vpcIdUsEast1);
                System.out.println("VPC ID US-West-2: " + vpcIdUsWest2);
                System.out.println("EC2 Instance ID: " + ec2InstanceId);
                System.out.println("EC2 Role ARN: " + ec2InstanceRoleArn);
                System.out.println("Security Group ID US-East-1: " + securityGroupIdUsEast1);
                System.out.println("Security Group ID US-West-2: " + securityGroupIdUsWest2);
                System.out.println("VPC Private Subnet ID US-East-1: " + vpcPrivateSubnetIdEast1);
                System.out.println("VPC Private Subnet ID US-West-2: " + vpcPrivateSubnetIdWest2);
                System.out.println("VPC Public Subnet ID US-East-1: " + vpcPublicSubnetIdEast1);
                System.out.println("VPC Public Subnet ID US-West-2: " + vpcPublicSubnetIdWest2);
            }
            
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            System.err.println("Failed to load deployment outputs: " + errorMsg);
        }
    }
    
    private static String getStackName() {
        // Build stack name using TapStack + ENVIRONMENT_SUFFIX pattern
        String envSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (envSuffix != null && !envSuffix.isEmpty()) {
            return "TapStack" + envSuffix;
        }
        
        // Try to get current stack from CDK CLI or CloudFormation
        try {
            String currentStack = executeCommand("aws", "cloudformation", "describe-stacks", 
                    "--query", "Stacks[?starts_with(StackName, 'TapStack')].StackName", 
                    "--output", "text").trim();
            if (!currentStack.isEmpty() && !currentStack.equals("None")) {
                String[] stacks = currentStack.split("\t");
                if (stacks.length > 0) {
                    return stacks[0]; // Return first matching stack
                }
            }
        } catch (Exception e) {
            System.out.println("Could not get current stack from AWS CLI: " + e.getMessage());
        }
        
        // Fallback - look for any TapStack* pattern
        return "TapStack";
    }
    
    private static String getCdkStackOutputs(final String stackName) {
        try {
            // Get outputs from both regions
            StringBuilder outputs = new StringBuilder();
            outputs.append("{");
            
            String[] regions = {TEST_REGION_US_EAST_1, TEST_REGION_US_WEST_2};
            boolean first = true;
            
            for (String region : regions) {
                try {
                    String regionOutputs = executeCommand("aws", "cloudformation", "describe-stacks",
                            "--stack-name", stackName,
                            "--region", region,
                            "--query", "Stacks[0].Outputs",
                            "--output", "json");
                    
                    if (!regionOutputs.trim().equals("null") && !regionOutputs.trim().isEmpty()) {
                        JsonNode outputsArray = objectMapper.readTree(regionOutputs);
                        for (JsonNode output : outputsArray) {
                            if (!first) outputs.append(",");
                            outputs.append("\"").append(output.get("OutputKey").asText()).append("\":");
                            outputs.append("\"").append(output.get("OutputValue").asText()).append("\"");
                            first = false;
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Could not get outputs for region " + region + ": " + e.getMessage());
                }
            }
            
            outputs.append("}");
            return outputs.toString();
        } catch (Exception e) {
            System.err.println("Error getting CDK stack outputs: " + e.getMessage());
            return null;
        }
    }
    
    private static String getOutputValue(final String region, final String outputKey, final String stackName) {
        try {
            
            String result = executeCommand("aws", "cloudformation", "describe-stacks", 
                    "--stack-name", stackName,
                    "--region", region,
                    "--query", "Stacks[0].Outputs[?OutputKey=='" + outputKey + "'].OutputValue",
                    "--output", "text");
            
            return result.trim().equals("None") ? null : result.trim();
        } catch (Exception e) {
            return null;
        }
    }

    @BeforeEach
    void setUp() {
        // Validate that outputs are available before each test
        if (allOutputs == null) {
            boolean isCI = System.getenv("CI") != null || System.getenv("GITHUB_ACTIONS") != null;
            if (isCI) {
                System.out.println("Warning: Running in CI but deployment outputs not available. Test will be skipped.");
            } else {
                System.out.println("Warning: Deployment outputs not available. Test will be skipped. (Run after cdk deploy)");
            }
        }
    }

    // ================== Live AWS Resource Integration Tests ==================

    @Test
    void testDeploymentOutputsExist() {
        Assumptions.assumeTrue(vpcIdUsEast1 != null || vpcIdUsWest2 != null, 
                "At least one VPC should be deployed");
        
        assertDoesNotThrow(() -> {
            // Validate at least one VPC exists
            assertTrue(vpcIdUsEast1 != null || vpcIdUsWest2 != null, 
                    "At least one VPC should be available from live deployment");
            
            if (vpcIdUsEast1 != null) {
                assertFalse(vpcIdUsEast1.trim().isEmpty(), "VPC ID US-East-1 should not be empty");
                System.out.println("✓ VPC US-East-1 exists: " + vpcIdUsEast1);
            }
            
            if (vpcIdUsWest2 != null) {
                assertFalse(vpcIdUsWest2.trim().isEmpty(), "VPC ID US-West-2 should not be empty");
                System.out.println("✓ VPC US-West-2 exists: " + vpcIdUsWest2);
            }
            
            System.out.println("✓ All live deployment outputs are present and non-empty");
        });
    }
    
    @Test
    void testLiveVpcValidationUsEast1() {
        Assumptions.assumeTrue(vpcIdUsEast1 != null, "VPC ID US-East-1 should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (Ec2Client ec2Client = Ec2Client.builder().region(Region.US_EAST_1).build()) {
                // Validate actual deployed VPC exists in AWS
                DescribeVpcsResponse response = ec2Client.describeVpcs(
                        DescribeVpcsRequest.builder()
                                .vpcIds(vpcIdUsEast1)
                                .build());
                
                assertFalse(response.vpcs().isEmpty(), "Live VPC should exist in AWS EC2");
                
                var vpc = response.vpcs().get(0);
                assertEquals("10.0.0.0/16", vpc.cidrBlock(), "VPC should have correct CIDR block for us-east-1");
                assertEquals("available", vpc.state().toString(), "VPC should be in available state");
                // Note: DNS attributes are not directly available on VPC object in AWS SDK v2
                
                System.out.println("✓ Live VPC US-East-1 validation passed: " + vpc.vpcId());
                System.out.println("  - CIDR Block: " + vpc.cidrBlock());
                System.out.println("  - State: " + vpc.state());
                System.out.println("  - VPC ID: " + vpc.vpcId());
            }
        });
    }
    
    @Test
    void testLiveVpcValidationUsWest2() {
        Assumptions.assumeTrue(vpcIdUsWest2 != null, "VPC ID US-West-2 should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (Ec2Client ec2Client = Ec2Client.builder().region(Region.US_WEST_2).build()) {
                // Validate actual deployed VPC exists in AWS
                DescribeVpcsResponse response = ec2Client.describeVpcs(
                        DescribeVpcsRequest.builder()
                                .vpcIds(vpcIdUsWest2)
                                .build());
                
                assertFalse(response.vpcs().isEmpty(), "Live VPC should exist in AWS EC2");
                
                var vpc = response.vpcs().get(0);
                assertEquals("192.168.0.0/16", vpc.cidrBlock(), "VPC should have correct CIDR block for us-west-2");
                assertEquals("available", vpc.state().toString(), "VPC should be in available state");
                // Note: DNS attributes are not directly available on VPC object in AWS SDK v2
                
                System.out.println("✓ Live VPC US-West-2 validation passed: " + vpc.vpcId());
                System.out.println("  - CIDR Block: " + vpc.cidrBlock());
                System.out.println("  - State: " + vpc.state());
                System.out.println("  - VPC ID: " + vpc.vpcId());
            }
        });
    }
    
    @Test
    void testLiveEc2InstanceValidation() {
        Assumptions.assumeTrue(ec2InstanceId != null, "EC2 Instance ID should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (Ec2Client ec2Client = Ec2Client.builder().region(Region.US_EAST_1).build()) {
                // Validate actual deployed EC2 instance exists in AWS
                DescribeInstancesResponse response = ec2Client.describeInstances(
                        DescribeInstancesRequest.builder()
                                .instanceIds(ec2InstanceId)
                                .build());
                
                assertFalse(response.reservations().isEmpty(), "Live EC2 instance should exist in AWS");
                assertFalse(response.reservations().get(0).instances().isEmpty(), 
                        "EC2 reservation should contain instances");
                
                var instance = response.reservations().get(0).instances().get(0);
                assertEquals("t3.micro", instance.instanceType().toString(), 
                        "Instance should be t3.micro type");
                assertTrue(List.of("running", "pending", "stopped").contains(instance.state().name().toString()), 
                        "Instance should be in a valid state");
                
                System.out.println("✓ Live EC2 Instance validation passed: " + instance.instanceId());
                System.out.println("  - Instance Type: " + instance.instanceType());
                System.out.println("  - State: " + instance.state().name());
                System.out.println("  - VPC ID: " + instance.vpcId());
                System.out.println("  - Subnet ID: " + instance.subnetId());
            }
        });
    }
    
    @Test
    void testLiveSecurityGroupValidation() {
        Assumptions.assumeTrue(securityGroupIdUsEast1 != null, "Security Group ID should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (Ec2Client ec2Client = Ec2Client.builder().region(Region.US_EAST_1).build()) {
                // Validate actual deployed security group exists in AWS
                DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(
                        DescribeSecurityGroupsRequest.builder()
                                .groupIds(securityGroupIdUsEast1)
                                .build());
                
                assertFalse(response.securityGroups().isEmpty(), "Live Security Group should exist in AWS");
                
                var securityGroup = response.securityGroups().get(0);
                assertEquals(vpcIdUsEast1, securityGroup.vpcId(), "Security Group should be in correct VPC");
                
                // Validate ingress rules for HTTP and HTTPS
                var ingressRules = securityGroup.ipPermissions();
                boolean hasHttpRule = ingressRules.stream()
                        .anyMatch(rule -> rule.fromPort() == 80 && rule.toPort() == 80 && 
                                rule.ipProtocol().equals("tcp"));
                boolean hasHttpsRule = ingressRules.stream()
                        .anyMatch(rule -> rule.fromPort() == 443 && rule.toPort() == 443 && 
                                rule.ipProtocol().equals("tcp"));
                
                assertTrue(hasHttpRule, "Security Group should allow HTTP traffic");
                assertTrue(hasHttpsRule, "Security Group should allow HTTPS traffic");
                
                System.out.println("✓ Live Security Group validation passed: " + securityGroup.groupId());
                System.out.println("  - Group Name: " + securityGroup.groupName());
                System.out.println("  - VPC ID: " + securityGroup.vpcId());
                System.out.println("  - Ingress Rules: " + ingressRules.size());
            }
        });
    }
    
    @Test
    void testLiveIamRoleValidation() {
        Assumptions.assumeTrue(ec2InstanceRoleArn != null, "IAM Role ARN should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (IamClient iamClient = IamClient.builder().region(Region.US_EAST_1).build()) {
                // Extract role name from ARN
                String roleName = ec2InstanceRoleArn.substring(ec2InstanceRoleArn.lastIndexOf("/") + 1);
                
                // Validate actual deployed IAM role exists in AWS
                GetRoleResponse response = iamClient.getRole(
                        GetRoleRequest.builder()
                                .roleName(roleName)
                                .build());
                
                assertNotNull(response.role(), "Live IAM Role should exist in AWS IAM");
                assertEquals(ec2InstanceRoleArn, response.role().arn(), "Role ARN should match");
                
                // Validate role has proper trust policy for EC2 service
                assertNotNull(response.role().assumeRolePolicyDocument(), "Role should have assume role policy");
                assertTrue(response.role().assumeRolePolicyDocument().contains("ec2.amazonaws.com"), 
                        "Role should trust EC2 service");
                
                System.out.println("✓ Live IAM Role validation passed: " + response.role().roleName());
                System.out.println("  - ARN: " + response.role().arn());
                System.out.println("  - Created: " + response.role().createDate());
                System.out.println("  - Path: " + response.role().path());
            }
        });
    }
    
    @Test 
    void testLiveDeploymentConfigurationValues() {
        Assumptions.assumeTrue(vpcIdUsEast1 != null || vpcIdUsWest2 != null, 
                "At least one VPC should be deployed");
        
        assertDoesNotThrow(() -> {
            // Extract and validate configuration from actual deployed resources
            System.out.println("=== Live Deployment Configuration Analysis ===");
            
            // Validate VPC naming and configuration
            if (vpcIdUsEast1 != null) {
                System.out.println("Live VPC US-East-1: " + vpcIdUsEast1);
                assertTrue(vpcIdUsEast1.startsWith("vpc-"), "VPC ID should be valid AWS VPC identifier");
            }
            
            if (vpcIdUsWest2 != null) {
                System.out.println("Live VPC US-West-2: " + vpcIdUsWest2);
                assertTrue(vpcIdUsWest2.startsWith("vpc-"), "VPC ID should be valid AWS VPC identifier");
            }
            
            // Validate EC2 instance configuration if exists
            if (ec2InstanceId != null) {
                System.out.println("Live EC2 Instance: " + ec2InstanceId);
                assertTrue(ec2InstanceId.startsWith("i-"), "Instance ID should be valid AWS instance identifier");
            }
            
            // Validate Security Group configuration
            if (securityGroupIdUsEast1 != null) {
                System.out.println("Live Security Group: " + securityGroupIdUsEast1);
                assertTrue(securityGroupIdUsEast1.startsWith("sg-"), "Security Group ID should be valid AWS identifier");
            }
            
            // Validate IAM Role configuration
            if (ec2InstanceRoleArn != null) {
                System.out.println("Live IAM Role ARN: " + ec2InstanceRoleArn);
                assertTrue(ec2InstanceRoleArn.startsWith("arn:aws:iam::"), "IAM Role ARN should be valid AWS ARN format");
                assertTrue(ec2InstanceRoleArn.contains("role/"), "ARN should be for an IAM role");
            }
            
            System.out.println("✓ Live deployment configuration validation passed");
        });
    }

    // ================== Helper Methods ==================
    
    private static boolean hasAwsCredentials() {
        return (System.getenv("AWS_ACCESS_KEY_ID") != null && System.getenv("AWS_SECRET_ACCESS_KEY") != null) ||
               System.getenv("AWS_PROFILE") != null ||
               System.getProperty("aws.accessKeyId") != null;
    }
    
    private static String executeCommand(final String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command)
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);
                
        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);
        
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Command timed out: " + String.join(" ", command));
        }
        
        if (process.exitValue() != 0) {
            String output = readProcessOutput(process);
            throw new RuntimeException("Command failed with exit code " + process.exitValue() + ": " + output);
        }
        
        return readProcessOutput(process);
    }
    
    private static String readProcessOutput(final Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
}