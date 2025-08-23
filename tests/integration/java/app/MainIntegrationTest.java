package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;

import com.pulumi.Context;

/**
 * Integration tests for the Main Pulumi program.
 * 
 * This is a minimal example showing how to write integration tests for Pulumi Java programs.
 * Add more specific tests based on your infrastructure requirements.
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    /**
     * Test that the application can be compiled and the main class loads.
     */
    @Test
    void testApplicationLoads() {
        assertDoesNotThrow(() -> {
            Class.forName("app.Main");
        });
    }

    /**
     * Test that Pulumi dependencies are available on classpath.
     */
    @Test
    void testPulumiDependenciesAvailable() {
        assertDoesNotThrow(() -> {
            Class.forName("com.pulumi.Pulumi");
            Class.forName("com.pulumi.aws.s3.Bucket");
            Class.forName("com.pulumi.aws.s3.BucketArgs");
        }, "Pulumi dependencies should be available on classpath");
    }

    /**
     * Test that required project files exist.
     */
    @Test
    void testProjectStructure() {
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
                "Main.java should exist");
        assertTrue(Files.exists(Paths.get("Pulumi.yaml")),
                "Pulumi.yaml should exist");
        assertTrue(Files.exists(Paths.get("build.gradle")),
                "build.gradle should exist");
        
        // Check for deployment outputs if they exist
        if (Files.exists(Paths.get("cfn-outputs/flat-outputs.json"))) {
            System.out.println("Found deployment outputs - integration tests can validate real resources");
        }
    }

    /**
     * Test that defineInfrastructure method exists and is accessible.
     */
    @Test
    void testDefineInfrastructureMethodAccessible() {
        assertDoesNotThrow(() -> {
            var method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertNotNull(method);
            assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()));
        });
    }

    /**
     * Example test for Pulumi program validation using Pulumi CLI.
     * Disabled by default as it requires Pulumi CLI and AWS setup.
     * 
     * Uncomment @Disabled and configure environment to run this test.
     */
    @Test
    @Disabled("Enable for actual Pulumi preview testing - requires Pulumi CLI and AWS credentials")
    void testPulumiPreview() throws Exception {
        // Skip if Pulumi CLI is not available
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", "test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        assertTrue(finished, "Pulumi preview should complete within 60 seconds");

        // Preview should succeed (exit code 0) or show changes needed (exit code 1)
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes");
    }

    /**
     * Example test for actual infrastructure deployment.
     * Disabled by default to prevent accidental resource creation.
     * 
     * IMPORTANT: This creates real AWS resources. Only enable in test environments.
     */
    @Test
    @Disabled("Enable for actual infrastructure testing - creates real AWS resources")
    void testInfrastructureDeployment() throws Exception {
        // Skip if environment is not properly configured
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        // Deploy infrastructure
        ProcessBuilder deployPb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", "integration-test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process deployProcess = deployPb.start();
        boolean deployFinished = deployProcess.waitFor(300, TimeUnit.SECONDS);

        assertTrue(deployFinished, "Deployment should complete within 5 minutes");
        assertEquals(0, deployProcess.exitValue(), "Deployment should succeed");

        try {
            // Verify deployment worked by checking stack outputs
            ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process outputsProcess = outputsPb.start();
            boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

            assertTrue(outputsFinished, "Getting outputs should complete quickly");
            assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs");

        } finally {
            // Clean up - destroy the stack
            ProcessBuilder destroyPb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process destroyProcess = destroyPb.start();
            destroyProcess.waitFor(300, TimeUnit.SECONDS);
        }
    }

    /**
     * Helper method to check if Pulumi CLI is available.
     */
    private boolean isPulumiAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Helper method to check if AWS credentials are configured.
     */
    private boolean hasAwsCredentials() {
        return System.getenv("AWS_ACCESS_KEY_ID") != null &&
                System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    /**
     * Helper method to check if we're in a testing environment (not production).
     */
    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        return env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"));
    }

    /**
     * Test AWS infrastructure using real deployment outputs.
     * This test reads from cfn-outputs/flat-outputs.json to validate the deployed resources.
     */
    @Test
    void testAwsInfrastructureWithRealOutputs() {
        // Skip if outputs file doesn't exist
        var outputsPath = Paths.get("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputsPath), 
            "cfn-outputs/flat-outputs.json should exist from deployment");

        assertDoesNotThrow(() -> {
            // Read deployment outputs
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> outputs = mapper.readValue(
                outputsPath.toFile(), 
                new TypeReference<Map<String, Object>>() {}
            );

            // Validate VPC exists and has expected CIDR
            assertNotNull(outputs.get("VpcId"), "VPC should be created");
            String vpcId = outputs.get("VpcId").toString();
            validateVpcConfiguration(vpcId);

            // Validate subnets exist and are in correct AZs
            assertNotNull(outputs.get("PublicSubnet1Id"), "Public subnet 1 should exist");
            assertNotNull(outputs.get("PublicSubnet2Id"), "Public subnet 2 should exist");
            assertNotNull(outputs.get("PrivateSubnet1Id"), "Private subnet 1 should exist");
            assertNotNull(outputs.get("PrivateSubnet2Id"), "Private subnet 2 should exist");
            
            validateSubnetsConfiguration(outputs);

            // Validate EC2 instances exist and are properly configured
            assertNotNull(outputs.get("WebServer1Id"), "Web server 1 should exist");
            assertNotNull(outputs.get("WebServer2Id"), "Web server 2 should exist");
            
            validateEc2Instances(outputs);

            // Validate Elastic IPs are assigned
            assertNotNull(outputs.get("WebServer1PublicIp"), "Web server 1 should have public IP");
            assertNotNull(outputs.get("WebServer2PublicIp"), "Web server 2 should have public IP");
            
            validateElasticIps(outputs);

            // Validate Security Group configuration
            assertNotNull(outputs.get("SecurityGroupId"), "Security group should exist");
            validateSecurityGroupRules(outputs.get("SecurityGroupId").toString());

            // Validate private IPs are within VPC range
            validatePrivateIpsInVpcRange(outputs);
        });
    }

    /**
     * Validates that the VPC has the correct configuration.
     */
    private void validateVpcConfiguration(String vpcId) {
        try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
            DescribeVpcsResponse vpcsResponse = ec2.describeVpcs(
                DescribeVpcsRequest.builder()
                    .vpcIds(vpcId)
                    .build()
            );
            
            assertEquals(1, vpcsResponse.vpcs().size(), "Should find exactly one VPC");
            
            Vpc vpc = vpcsResponse.vpcs().get(0);
            assertEquals("10.0.0.0/16", vpc.cidrBlock(), "VPC should have correct CIDR block");
            assertEquals("available", vpc.state().toString().toLowerCase(), "VPC should be available");
        }
    }

    /**
     * Validates subnet configuration and availability zones.
     */
    private void validateSubnetsConfiguration(Map<String, Object> outputs) {
        try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
            // Get all subnets
            String publicSubnet1Id = outputs.get("PublicSubnet1Id").toString();
            String publicSubnet2Id = outputs.get("PublicSubnet2Id").toString();
            String privateSubnet1Id = outputs.get("PrivateSubnet1Id").toString();
            String privateSubnet2Id = outputs.get("PrivateSubnet2Id").toString();
            
            DescribeSubnetsResponse subnetsResponse = ec2.describeSubnets(
                DescribeSubnetsRequest.builder()
                    .subnetIds(publicSubnet1Id, publicSubnet2Id, privateSubnet1Id, privateSubnet2Id)
                    .build()
            );
            
            assertEquals(4, subnetsResponse.subnets().size(), "Should have 4 subnets");
            
            // Validate subnet configurations
            for (Subnet subnet : subnetsResponse.subnets()) {
                assertEquals("available", subnet.state().toString().toLowerCase(), "All subnets should be available");
                assertTrue(subnet.cidrBlock().startsWith("10.0."), 
                    "All subnets should be within VPC CIDR range");
            }
            
            // Verify subnets are in different AZs
            var subnetIds = java.util.List.of(publicSubnet1Id, publicSubnet2Id);
            var azSet = subnetsResponse.subnets().stream()
                .filter(s -> subnetIds.contains(s.subnetId()))
                .map(Subnet::availabilityZone)
                .collect(java.util.stream.Collectors.toSet());
            
            assertEquals(2, azSet.size(), "Public subnets should be in different AZs");
        }
    }

    /**
     * Validates EC2 instances configuration.
     */
    private void validateEc2Instances(Map<String, Object> outputs) {
        try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
            String instance1Id = outputs.get("WebServer1Id").toString();
            String instance2Id = outputs.get("WebServer2Id").toString();
            
            DescribeInstancesResponse instancesResponse = ec2.describeInstances(
                DescribeInstancesRequest.builder()
                    .instanceIds(instance1Id, instance2Id)
                    .build()
            );
            
            int instanceCount = 0;
            for (Reservation reservation : instancesResponse.reservations()) {
                for (Instance instance : reservation.instances()) {
                    instanceCount++;
                    assertEquals("running", instance.state().name().toString().toLowerCase(),
                        "Instance should be running");
                    assertEquals("t3.micro", instance.instanceType().toString(),
                        "Instance should be t3.micro");
                    assertNotNull(instance.publicIpAddress(), "Instance should have public IP");
                    assertTrue(instance.privateIpAddress().startsWith("10.0."),
                        "Private IP should be within VPC range");
                }
            }
            
            assertEquals(2, instanceCount, "Should have exactly 2 EC2 instances");
        }
    }

    /**
     * Validates Elastic IP configuration.
     */
    private void validateElasticIps(Map<String, Object> outputs) {
        try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
            String publicIp1 = outputs.get("WebServer1PublicIp").toString();
            String publicIp2 = outputs.get("WebServer2PublicIp").toString();
            
            DescribeAddressesResponse addressesResponse = ec2.describeAddresses(
                DescribeAddressesRequest.builder()
                    .publicIps(publicIp1, publicIp2)
                    .build()
            );
            
            assertEquals(2, addressesResponse.addresses().size(), "Should have 2 Elastic IPs");
            
            for (Address address : addressesResponse.addresses()) {
                assertEquals("vpc", address.domain().toString(), "EIP should be VPC domain");
                assertNotNull(address.instanceId(), "EIP should be associated with instance");
            }
        }
    }

    /**
     * Validates Security Group rules.
     */
    private void validateSecurityGroupRules(String securityGroupId) {
        try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
            DescribeSecurityGroupsResponse sgResponse = ec2.describeSecurityGroups(
                DescribeSecurityGroupsRequest.builder()
                    .groupIds(securityGroupId)
                    .build()
            );
            
            assertEquals(1, sgResponse.securityGroups().size(), "Should find security group");
            
            SecurityGroup sg = sgResponse.securityGroups().get(0);
            
            // Check ingress rules
            assertTrue(sg.ipPermissions().size() >= 3, "Should have at least SSH, HTTP, HTTPS rules");
            
            // Verify SSH rule exists and is restricted
            boolean hasSshRule = sg.ipPermissions().stream()
                .anyMatch(rule -> rule.fromPort() != null && rule.fromPort() == 22);
            assertTrue(hasSshRule, "Should have SSH rule on port 22");
            
            // Verify egress allows outbound traffic
            assertTrue(sg.ipPermissionsEgress().size() >= 1, "Should have egress rules");
        }
    }

    /**
     * Validates that private IPs are within the VPC CIDR range.
     */
    private void validatePrivateIpsInVpcRange(Map<String, Object> outputs) {
        String privateIp1 = outputs.get("WebServer1PrivateIp").toString();
        String privateIp2 = outputs.get("WebServer2PrivateIp").toString();
        
        assertTrue(privateIp1.startsWith("10.0."), 
            "Private IP 1 should be within VPC range: " + privateIp1);
        assertTrue(privateIp2.startsWith("10.0."), 
            "Private IP 2 should be within VPC range: " + privateIp2);
        
        assertNotEquals(privateIp1, privateIp2, 
            "Instances should have different private IPs");
    }
}