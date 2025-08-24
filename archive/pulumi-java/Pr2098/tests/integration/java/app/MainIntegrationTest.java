package app;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulumi.Context;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeAddressesRequest;
import software.amazon.awssdk.services.ec2.model.DescribeAddressesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesRequest;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.Reservation;
import software.amazon.awssdk.services.ec2.model.Instance;
import software.amazon.awssdk.services.ec2.model.Address;
import software.amazon.awssdk.services.ec2.model.SecurityGroup;
import software.amazon.awssdk.services.ec2.model.Tag;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
     * Test that validates deployed VPC CIDR block matches expected configuration.
     * This test uses real deployment outputs from flat-outputs.json.
     */
    @Test
    void testVpcCidrBlockFromOutputs() {
        // Skip if outputs file doesn't exist
        var outputsPath = Paths.get("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputsPath),
            "cfn-outputs/flat-outputs.json should exist from deployment");

        assertDoesNotThrow(() -> {
            // Read deployment outputs
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> outputs = mapper.readValue(
                outputsPath.toFile(),
                new TypeReference<Map<String, Object>>() { }
            );

            // Validate VPC exists and configuration
            assertNotNull(outputs.get("VpcId"), "VPC should be created");
            String vpcId = outputs.get("VpcId").toString();

            try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
                DescribeVpcsResponse vpcsResponse = ec2.describeVpcs(
                    DescribeVpcsRequest.builder()
                        .vpcIds(vpcId)
                        .build()
                );

                assertEquals(1, vpcsResponse.vpcs().size(), "Should find exactly one VPC");
                Vpc vpc = vpcsResponse.vpcs().get(0);
                assertEquals("10.0.0.0/16", vpc.cidrBlock(), "VPC should have correct CIDR block");
            }
        });
    }

    /**
     * Test that validates EC2 instances are properly distributed across availability zones.
     * This test uses real deployment outputs from flat-outputs.json.
     */
    @Test
    void testInstanceDistributionAcrossAZs() {
        // Skip if outputs file doesn't exist
        var outputsPath = Paths.get("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputsPath),
            "cfn-outputs/flat-outputs.json should exist from deployment");

        assertDoesNotThrow(() -> {
            // Read deployment outputs
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> outputs = mapper.readValue(
                outputsPath.toFile(),
                new TypeReference<Map<String, Object>>() { }
            );

            // Validate instances exist
            assertNotNull(outputs.get("WebServer1Id"), "Web server 1 should exist");
            assertNotNull(outputs.get("WebServer2Id"), "Web server 2 should exist");

            String instance1Id = outputs.get("WebServer1Id").toString();
            String instance2Id = outputs.get("WebServer2Id").toString();

            try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
                DescribeInstancesResponse instancesResponse = ec2.describeInstances(
                    DescribeInstancesRequest.builder()
                        .instanceIds(instance1Id, instance2Id)
                        .build()
                );

                // Collect availability zones
                var availabilityZones = instancesResponse.reservations().stream()
                    .flatMap(reservation -> reservation.instances().stream())
                    .map(instance -> instance.placement().availabilityZone())
                    .collect(java.util.stream.Collectors.toSet());

                assertEquals(2, availabilityZones.size(),
                    "Instances should be distributed across 2 different availability zones");
                assertTrue(availabilityZones.contains("us-west-2a")
                          || availabilityZones.contains("us-west-2b"),
                    "Instances should be in us-west-2a or us-west-2b");
            }
        });
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
        return System.getenv("AWS_ACCESS_KEY_ID") != null
                && System.getenv("AWS_SECRET_ACCESS_KEY") != null;
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
                new TypeReference<Map<String, Object>>() { }
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
    private void validateVpcConfiguration(final String vpcId) {
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
    private void validateSubnetsConfiguration(final Map<String, Object> outputs) {
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
    private void validateEc2Instances(final Map<String, Object> outputs) {
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
    private void validateElasticIps(final Map<String, Object> outputs) {
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
    private void validateSecurityGroupRules(final String securityGroupId) {
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
    private void validatePrivateIpsInVpcRange(final Map<String, Object> outputs) {
        String privateIp1 = outputs.get("WebServer1PrivateIp").toString();
        String privateIp2 = outputs.get("WebServer2PrivateIp").toString();

        assertTrue(privateIp1.startsWith("10.0."),
            "Private IP 1 should be within VPC range: " + privateIp1);
        assertTrue(privateIp2.startsWith("10.0."),
            "Private IP 2 should be within VPC range: " + privateIp2);

        assertNotEquals(privateIp1, privateIp2,
            "Instances should have different private IPs");
    }

    /**
     * Test that validates Elastic IPs are properly allocated and associated.
     * This test uses real deployment outputs from flat-outputs.json.
     */
    @Test
    void testElasticIpAllocationFromOutputs() {
        // Skip if outputs file doesn't exist
        var outputsPath = Paths.get("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputsPath),
            "cfn-outputs/flat-outputs.json should exist from deployment");

        assertDoesNotThrow(() -> {
            // Read deployment outputs
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> outputs = mapper.readValue(
                outputsPath.toFile(),
                new TypeReference<Map<String, Object>>() { }
            );

            // Validate Elastic IPs exist
            assertNotNull(outputs.get("WebServer1PublicIp"), "Web server 1 should have public IP");
            assertNotNull(outputs.get("WebServer2PublicIp"), "Web server 2 should have public IP");

            String publicIp1 = outputs.get("WebServer1PublicIp").toString();
            String publicIp2 = outputs.get("WebServer2PublicIp").toString();

            // Validate IP format
            assertTrue(isValidPublicIpFormat(publicIp1),
                "Public IP 1 should be valid format: " + publicIp1);
            assertTrue(isValidPublicIpFormat(publicIp2),
                "Public IP 2 should be valid format: " + publicIp2);

            // Validate IPs are different
            assertNotEquals(publicIp1, publicIp2,
                "Each instance should have unique public IP");

            try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
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
        });
    }

    /**
     * Test that validates environment suffix isolation is working properly.
     * This test uses real deployment outputs from flat-outputs.json.
     */
    @Test
    void testEnvironmentSuffixIsolation() {
        // Skip if outputs file doesn't exist
        var outputsPath = Paths.get("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputsPath),
            "cfn-outputs/flat-outputs.json should exist from deployment");

        assertDoesNotThrow(() -> {
            // Read deployment outputs
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> outputs = mapper.readValue(
                outputsPath.toFile(),
                new TypeReference<Map<String, Object>>() { }
            );

            // Validate Environment Suffix is exported
            assertNotNull(outputs.get("EnvironmentSuffix"), "Environment suffix should be exported");
            String environmentSuffix = outputs.get("EnvironmentSuffix").toString();

            // Validate suffix is not empty or default only
            assertFalse(environmentSuffix.trim().isEmpty(), "Environment suffix should not be empty");

            // Validate VPC name includes environment suffix
            String vpcId = outputs.get("VpcId").toString();

            try (Ec2Client ec2 = Ec2Client.builder().region(Region.US_WEST_2).build()) {
                DescribeVpcsResponse vpcsResponse = ec2.describeVpcs(
                    DescribeVpcsRequest.builder()
                        .vpcIds(vpcId)
                        .build()
                );

                Vpc vpc = vpcsResponse.vpcs().get(0);
                String vpcName = vpc.tags().stream()
                    .filter(tag -> "Name".equals(tag.key()))
                    .map(Tag::value)
                    .findFirst()
                    .orElse("");

                assertTrue(vpcName.contains(environmentSuffix),
                    "VPC name should contain environment suffix: " + vpcName + " should contain " + environmentSuffix);
            }
        });
    }

    /**
     * Helper method to validate public IP address format.
     */
    private boolean isValidPublicIpFormat(final String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }

        // Basic IP address validation regex
        String ipPattern = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
        return ip.matches(ipPattern) && !ip.startsWith("10.")
               && !ip.startsWith("192.168.") && !ip.startsWith("172.");
    }
}
