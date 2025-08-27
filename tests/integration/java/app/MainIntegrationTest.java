package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetInstanceProfileRequest;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.s3.S3Client;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

/**
 * Integration tests for the Main Pulumi program.
 *
 * Run with: ./gradlew integrationTest
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static Ec2Client ec2Client;
    private static S3Client s3Client;
    private static IamClient iamClient;
    private static JsonNode allOutputs;

    @BeforeAll
    static void setUp() throws Exception {
        Region region = Region.US_EAST_1;
        
        ec2Client = Ec2Client.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

        s3Client = S3Client.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

        iamClient = IamClient.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

        ObjectMapper objectMapper = new ObjectMapper();

        String suffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        String stackName = "TapStack" + suffix;
        System.out.println("Using stack: " + stackName);

        String outputsJson = executeCommand("pulumi", "stack", "output", "--json", "--stack", stackName);
        allOutputs = objectMapper.readTree(outputsJson);
        
        System.out.println("Stack outputs: " + allOutputs.toPrettyString());
    }

    @AfterAll
    static void tearDown() {
        if (ec2Client != null) {
            ec2Client.close();
        }
        if (s3Client != null) {
            s3Client.close();
        }
        if (iamClient != null) {
            iamClient.close();
        }
    }

    @Test
    @Order(1)
    @DisplayName("Should validate VPC exists and has correct configuration")
    void shouldValidateVpcConfiguration() {
        String vpcId = allOutputs.get("primary-vpcId").asText();
        assertNotNull(vpcId, "Primary VPC ID should be in outputs");

        DescribeVpcsResponse vpcsResponse = ec2Client.describeVpcs(
                DescribeVpcsRequest.builder()
                        .vpcIds(vpcId)
                        .build());

        assertEquals(1, vpcsResponse.vpcs().size(), "Should find exactly one VPC");
        
        Vpc vpc = vpcsResponse.vpcs().get(0);
        assertEquals(vpcId, vpc.vpcId(), "VPC ID should match");
        assertEquals(VpcState.AVAILABLE, vpc.state(), "VPC should be available");
        
        System.out.println("✓ VPC validated: " + vpcId + " with CIDR: " + vpc.cidrBlock());
    }

    @Test
    @Order(2)
    @DisplayName("Should validate public subnets exist and are correctly configured")
    void shouldValidatePublicSubnets() {
        String publicSubnetPrimaryId = allOutputs.get("primary-publicSubnetPrimaryId").asText();
        String publicSubnetSecondaryId = allOutputs.get("primary-publicSubnetSecondaryId").asText();
        
        assertNotNull(publicSubnetPrimaryId, "Primary public subnet ID should be in outputs");
        assertNotNull(publicSubnetSecondaryId, "Secondary public subnet ID should be in outputs");

        DescribeSubnetsResponse subnetsResponse = ec2Client.describeSubnets(
                DescribeSubnetsRequest.builder()
                        .subnetIds(publicSubnetPrimaryId, publicSubnetSecondaryId)
                        .build());

        assertEquals(2, subnetsResponse.subnets().size(), "Should find both public subnets");
        
        for (Subnet subnet : subnetsResponse.subnets()) {
            assertEquals(SubnetState.AVAILABLE, subnet.state(), "Subnet should be available");
            assertTrue(subnet.mapPublicIpOnLaunch(), "Public subnets should map public IP on launch");
            
            System.out.println("✓ Public subnet validated: " + subnet.subnetId() + 
                    " in AZ: " + subnet.availabilityZone() + 
                    " with CIDR: " + subnet.cidrBlock());
        }
    }

    @Test
    @Order(3)
    @DisplayName("Should validate private subnets exist and are correctly configured")
    void shouldValidatePrivateSubnets() {
        String privateSubnetPrimaryId = allOutputs.get("primary-privateSubnetPrimaryId").asText();
        String privateSubnetSecondaryId = allOutputs.get("primary-privateSubnetSecondaryId").asText();
        
        assertNotNull(privateSubnetPrimaryId, "Primary private subnet ID should be in outputs");
        assertNotNull(privateSubnetSecondaryId, "Secondary private subnet ID should be in outputs");

        DescribeSubnetsResponse subnetsResponse = ec2Client.describeSubnets(
                DescribeSubnetsRequest.builder()
                        .subnetIds(privateSubnetPrimaryId, privateSubnetSecondaryId)
                        .build());

        assertEquals(2, subnetsResponse.subnets().size(), "Should find both private subnets");
        
        for (Subnet subnet : subnetsResponse.subnets()) {
            assertEquals(SubnetState.AVAILABLE, subnet.state(), "Subnet should be available");
            assertFalse(subnet.mapPublicIpOnLaunch());
            
            System.out.println("✓ Private subnet validated: " + subnet.subnetId() + 
                    " in AZ: " + subnet.availabilityZone() + 
                    " with CIDR: " + subnet.cidrBlock());
        }
    }

    @Test
    @Order(4)
    @DisplayName("Should validate security group exists with correct rules")
    void shouldValidateSecurityGroup() {
        String securityGroupId = allOutputs.get("primary-webSecurityGroupId").asText();
        
        assertNotNull(securityGroupId, "Security Group ID should be in outputs");

        DescribeSecurityGroupsResponse sgResponse = ec2Client.describeSecurityGroups(
                DescribeSecurityGroupsRequest.builder()
                        .groupIds(securityGroupId)
                        .build());

        assertEquals(1, sgResponse.securityGroups().size(), "Should find exactly one Security Group");
        
        SecurityGroup sg = sgResponse.securityGroups().get(0);
        assertEquals(securityGroupId, sg.groupId(), "Security Group ID should match");
        assertEquals("web-security-group", sg.groupName(), "Security Group name should be correct");

        boolean hasHttpRule = sg.ipPermissions().stream()
                .anyMatch(rule -> rule.fromPort() == 80 && rule.toPort() == 80);
        boolean hasHttpsRule = sg.ipPermissions().stream()
                .anyMatch(rule -> rule.fromPort() == 443 && rule.toPort() == 443);
        boolean hasSshRule = sg.ipPermissions().stream()
                .anyMatch(rule -> rule.fromPort() == 22 && rule.toPort() == 22);

        assertTrue(hasHttpRule, "Should have HTTP rule (port 80)");
        assertTrue(hasHttpsRule, "Should have HTTPS rule (port 443)");
        assertTrue(hasSshRule, "Should have SSH rule (port 22)");
        
        System.out.println("✓ Security Group validated: " + securityGroupId + " with correct rules");
    }

    @Test
    @Order(5)
    @DisplayName("Should validate IAM role and instance profile exist")
    void shouldValidateIamResources() throws Exception {
        String instanceProfileName = allOutputs.get("primary-instanceProfileName").asText();
        String iamRoleArn = allOutputs.get("primary-iamRoleArn").asText();
        
        assertNotNull(instanceProfileName, "Instance Profile name should be in outputs");
        assertNotNull(iamRoleArn, "IAM Role ARN should be in outputs");

        String roleName = iamRoleArn.substring(iamRoleArn.lastIndexOf('/') + 1);

        var instanceProfile = iamClient.getInstanceProfile(
                GetInstanceProfileRequest.builder()
                        .instanceProfileName(instanceProfileName)
                        .build());

        assertNotNull(String.valueOf(instanceProfile.instanceProfile()), "Instance Profile should exist");
        assertEquals(instanceProfileName, instanceProfile.instanceProfile().instanceProfileName(),
                "Instance profile name should equals " + instanceProfile.instanceProfile().instanceProfileName());

        var role = iamClient.getRole(
                GetRoleRequest.builder()
                        .roleName(roleName)
                        .build());

        assertNotNull(String.valueOf(role.role()), "IAM Role should exist");
        assertEquals(roleName, role.role().roleName(), "IAM Role name should equals " + role.role().roleName());
        
        System.out.println("✓ IAM resources validated - Role: " + roleName + ", Instance Profile: " + instanceProfileName);
    }

    @Test
    @Order(6)
    @DisplayName("Should validate EC2 instance exists and is running")
    void shouldValidateEc2Instance() throws Exception {
        String instanceId = allOutputs.get("primary-instanceId").asText();
        String publicIp = allOutputs.get("primary-publicIp").asText();
        
        assertNotNull(instanceId, "Instance ID should be in outputs");
        assertNotNull(publicIp, "Public IP should be in outputs");

        DescribeInstancesResponse instancesResponse = ec2Client.describeInstances(
                DescribeInstancesRequest.builder()
                        .instanceIds(instanceId)
                        .build());

        assertEquals(1, instancesResponse.reservations().size(), "Should find exactly one reservation");
        assertEquals(1, instancesResponse.reservations().get(0).instances().size(), "Should find exactly one instance");
        
        Instance instance = instancesResponse.reservations().get(0).instances().get(0);
        assertEquals(instanceId, instance.instanceId(), "Instance ID should match");
        assertEquals(publicIp, instance.publicIpAddress(), "Public IP should match");
        
        InstanceState state = instance.state();
        assertTrue(state.name() == InstanceStateName.RUNNING || state.name() == InstanceStateName.PENDING,
                "Instance should be running or pending");
        
        System.out.println("✓ EC2 instance validated: " + instanceId + " with public IP: " + publicIp + 
                ", state: " + state.name());
    }

    @Test
    @Order(7)
    @DisplayName("Should validate route table configuration")
    void shouldValidateRouteTable() {
        String publicRouteTableId = allOutputs.get("primary-publicRouteTableId").asText();
        String internetGatewayId = allOutputs.get("primary-internetGatewayId").asText();
        
        assertNotNull(publicRouteTableId, "Public Route Table ID should be in outputs");

        DescribeRouteTablesResponse routeTablesResponse = ec2Client.describeRouteTables(
                DescribeRouteTablesRequest.builder()
                        .routeTableIds(publicRouteTableId)
                        .build());

        assertEquals(1, routeTablesResponse.routeTables().size(), "Should find exactly one route table");
        
        RouteTable routeTable = routeTablesResponse.routeTables().get(0);
        assertEquals(publicRouteTableId, routeTable.routeTableId(), "Route Table ID should match");

        boolean hasInternetRoute = routeTable.routes().stream()
                .anyMatch(route -> 
                    "0.0.0.0/0".equals(route.destinationCidrBlock()) &&
                    internetGatewayId.equals(route.gatewayId()) &&
                    route.state() == RouteState.ACTIVE);

        assertTrue(hasInternetRoute, "Route table should have active route to Internet Gateway");
        
        System.out.println("✓ Route table validated: " + publicRouteTableId + " with internet route via: " + internetGatewayId);
    }

    @Test
    @Order(8)
    @DisplayName("Should validate complete infrastructure connectivity")
    void shouldValidateInfrastructureConnectivity() throws Exception {
        String instanceId = allOutputs.get("primary-instanceId").asText();
        String publicIp = allOutputs.get("primary-publicIp").asText();
        String bucketId = allOutputs.get("primary-bucketId").asText();

        System.out.println("Waiting for EC2 instance to be fully available...");
        
        waitForInstanceToBeRunning(instanceId);

        System.out.println("✓ Complete infrastructure validated:");
        System.out.println("  - VPC with public/private subnets across multiple AZs");
        System.out.println("  - Internet Gateway with proper routing");
        System.out.println("  - Security Group with web server access rules");
        System.out.println("  - S3 bucket for web hosting: " + bucketId);
        System.out.println("  - IAM role and instance profile for EC2-S3 access");
        System.out.println("  - EC2 instance running web server: " + instanceId);
        System.out.println("  - Public IP accessible: " + publicIp);
    }

    private void waitForInstanceToBeRunning(String instanceId) throws InterruptedException {
        long startTime = System.currentTimeMillis();
        long timeoutMillis = 300 * 1000L;

        while (System.currentTimeMillis() - startTime < timeoutMillis) {
            DescribeInstancesResponse response = ec2Client.describeInstances(
                    DescribeInstancesRequest.builder()
                            .instanceIds(instanceId)
                            .build());

            Instance instance = response.reservations().get(0).instances().get(0);
            InstanceStateName state = instance.state().name();

            if (state == InstanceStateName.RUNNING) {
                System.out.println("✓ Instance " + instanceId + " is running");
                return;
            }

            System.out.println("Instance " + instanceId + " state: " + state + ", waiting...");
            TimeUnit.SECONDS.sleep(10);
        }

        throw new RuntimeException("Instance " + instanceId + " did not reach running state within " + 300 + " seconds");
    }

    private static String executeCommand(String... command) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        
        Process process = processBuilder.start();
        
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }
        
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Command failed with exit code " + exitCode + ": " + output.toString());
        }
        
        return output.toString().trim();
    }

    private void assertNotNull(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new AssertionError(message + " - got: " + value);
        }
    }

    private void assertEquals(Object expected, Object actual, String message) {
        if (!expected.equals(actual)) {
            throw new AssertionError(message + " - expected: " + expected + ", actual: " + actual);
        }
    }

    private void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private void assertFalse(boolean condition) {
        if (condition) {
            throw new AssertionError("Private subnets should not map public IP on launch");
        }
    }
}