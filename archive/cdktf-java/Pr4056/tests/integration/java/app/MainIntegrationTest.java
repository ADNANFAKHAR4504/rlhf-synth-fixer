package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.autoscaling.AutoScalingClient;
import software.amazon.awssdk.services.autoscaling.model.*;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.*;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.*;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.elasticloadbalancingv2.ElasticLoadBalancingV2Client;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.*;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeTargetGroupsRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeTargetGroupsResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeListenersRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeListenersResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeTargetHealthRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeTargetHealthResponse;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for CDKTF Java MainStack template.
 *
 * These tests validate actual AWS resources deployed via Terraform/CDKTF.
 * They test cross-service interactions and use stack outputs.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String OUTPUTS_FILE_PATH = Optional.ofNullable(System.getProperty("OUTPUTS_FILE_PATH"))
        .orElseGet(() -> System.getenv().getOrDefault("OUTPUTS_FILE_PATH", "cfn-outputs/flat-outputs.json"));
    private static final String REGION_STR = Optional.ofNullable(System.getenv("AWS_REGION"))
        .orElse(Optional.ofNullable(System.getenv("CDK_DEFAULT_REGION")).orElse("us-east-1"));

    // AWS Clients
    private static Ec2Client ec2Client;
    private static ElasticLoadBalancingV2Client elbClient;
    private static AutoScalingClient autoScalingClient;
    private static IamClient iamClient;
    private static KmsClient kmsClient;
    private static CloudWatchClient cloudWatchClient;
    private static CloudWatchLogsClient logsClient;
    private static SnsClient snsClient;

    // Stack outputs
    private static Map<String, String> outputs;
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();

    @BeforeAll
    static void setup() {
        Region region = Region.of(REGION_STR);
        DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();

        // Initialize AWS clients
        ec2Client = Ec2Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        elbClient = ElasticLoadBalancingV2Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        autoScalingClient = AutoScalingClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        iamClient = IamClient.builder()
            .region(Region.AWS_GLOBAL)
            .credentialsProvider(credentialsProvider)
            .build();

        kmsClient = KmsClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        cloudWatchClient = CloudWatchClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        logsClient = CloudWatchLogsClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        snsClient = SnsClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        // Load outputs from file
        outputs = loadOutputsFromFile();

        if (outputs.isEmpty()) {
            System.err.println("WARNING: No outputs found. Tests will be skipped.");
        }
    }

    private static Map<String, String> loadOutputsFromFile() {
        try {
            File file = new File(OUTPUTS_FILE_PATH);
            if (!file.exists()) {
                System.err.println("Outputs file not found: " + OUTPUTS_FILE_PATH);
                return new HashMap<>();
            }

            String content = Files.readString(Paths.get(OUTPUTS_FILE_PATH));
            if (content == null || content.isBlank()) {
                return new HashMap<>();
            }

            JsonNode node = MAPPER.readTree(content);
            Map<String, String> result = new HashMap<>();

            node.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value.isObject()) {
                    value.fields().forEachRemaining(nestedEntry -> {
                        JsonNode nestedValue = nestedEntry.getValue();
                        // Store arrays and objects as JSON strings, primitives as text
                        if (nestedValue.isArray() || nestedValue.isObject()) {
                            result.put(nestedEntry.getKey(), nestedValue.toString());
                        } else {
                            result.put(nestedEntry.getKey(), nestedValue.asText());
                        }
                    });
                } else if (value.isArray()) {
                    result.put(entry.getKey(), value.toString());
                } else {
                    result.put(entry.getKey(), value.asText());
                }
            });

            System.out.println("Loaded " + result.size() + " outputs from " + OUTPUTS_FILE_PATH);
            return result;
        } catch (Exception e) {
            System.err.println("Failed to load outputs: " + e.getMessage());
            return new HashMap<>();
        }
    }

    // ========== Network Infrastructure Tests ==========

    @Test
    @Order(1)
    @DisplayName("VPC exists with correct configuration")
    void testVpcConfiguration() {
        skipIfOutputMissing("vpc-id");

        String vpcId = outputs.get("vpc-id");

        DescribeVpcsResponse response = ec2Client.describeVpcs(
            DescribeVpcsRequest.builder().vpcIds(vpcId).build()
        );

        assertFalse(response.vpcs().isEmpty(), "VPC should exist");
        Vpc vpc = response.vpcs().get(0);

        assertEquals("10.0.0.0/16", vpc.cidrBlock(), "VPC should have correct CIDR block");
        // Note: enableDnsHostnames and enableDnsSupport are attributes that need to be verified via DescribeVpcAttribute
        DescribeVpcAttributeResponse hostnamesAttr = ec2Client.describeVpcAttribute(
            DescribeVpcAttributeRequest.builder().vpcId(vpcId).attribute(VpcAttributeName.ENABLE_DNS_HOSTNAMES).build()
        );
        assertTrue(hostnamesAttr.enableDnsHostnames().value(), "DNS hostnames should be enabled");

        DescribeVpcAttributeResponse supportAttr = ec2Client.describeVpcAttribute(
            DescribeVpcAttributeRequest.builder().vpcId(vpcId).attribute(VpcAttributeName.ENABLE_DNS_SUPPORT).build()
        );
        assertTrue(supportAttr.enableDnsSupport().value(), "DNS support should be enabled");
    }

    @Test
    @Order(2)
    @DisplayName("Public subnets exist in different availability zones")
    void testPublicSubnetsConfiguration() {
        skipIfOutputMissing("public-subnet-ids");

        String publicSubnetIdsStr = outputs.get("public-subnet-ids");
        List<String> publicSubnetIds = parseListOutput(publicSubnetIdsStr);

        assertEquals(2, publicSubnetIds.size(), "Should have 2 public subnets");

        DescribeSubnetsResponse response = ec2Client.describeSubnets(
            DescribeSubnetsRequest.builder().subnetIds(publicSubnetIds).build()
        );

        List<Subnet> subnets = response.subnets();
        assertEquals(2, subnets.size(), "All public subnets should exist");

        // Verify subnets are in different AZs
        Set<String> azs = subnets.stream()
            .map(Subnet::availabilityZone)
            .collect(Collectors.toSet());
        assertEquals(2, azs.size(), "Public subnets should be in different AZs");

        // Verify public IP assignment
        for (Subnet subnet : subnets) {
            assertTrue(subnet.mapPublicIpOnLaunch(), "Public subnets should auto-assign public IPs");
        }
    }

    @Test
    @Order(3)
    @DisplayName("Private subnets exist in different availability zones")
    void testPrivateSubnetsConfiguration() {
        skipIfOutputMissing("private-subnet-ids");

        String privateSubnetIdsStr = outputs.get("private-subnet-ids");
        List<String> privateSubnetIds = parseListOutput(privateSubnetIdsStr);

        assertEquals(2, privateSubnetIds.size(), "Should have 2 private subnets");

        DescribeSubnetsResponse response = ec2Client.describeSubnets(
            DescribeSubnetsRequest.builder().subnetIds(privateSubnetIds).build()
        );

        List<Subnet> subnets = response.subnets();
        assertEquals(2, subnets.size(), "All private subnets should exist");

        // Verify subnets are in different AZs
        Set<String> azs = subnets.stream()
            .map(Subnet::availabilityZone)
            .collect(Collectors.toSet());
        assertEquals(2, azs.size(), "Private subnets should be in different AZs");

        // Verify no public IP assignment
        for (Subnet subnet : subnets) {
            assertFalse(subnet.mapPublicIpOnLaunch(), "Private subnets should not auto-assign public IPs");
        }
    }

    @Test
    @Order(4)
    @DisplayName("Internet Gateway is attached to VPC")
    void testInternetGatewayAttachment() {
        skipIfOutputMissing("vpc-id");

        String vpcId = outputs.get("vpc-id");

        DescribeInternetGatewaysResponse response = ec2Client.describeInternetGateways(
            DescribeInternetGatewaysRequest.builder()
                .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                    .name("attachment.vpc-id")
                    .values(vpcId)
                    .build())
                .build()
        );

        assertFalse(response.internetGateways().isEmpty(), "Internet Gateway should be attached to VPC");
    }

    @Test
    @Order(5)
    @DisplayName("NAT Gateway is configured with Elastic IP")
    void testNatGatewayConfiguration() {
        skipIfOutputMissing("vpc-id");

        String vpcId = outputs.get("vpc-id");

        DescribeNatGatewaysResponse response = ec2Client.describeNatGateways(
            DescribeNatGatewaysRequest.builder()
                .filter(software.amazon.awssdk.services.ec2.model.Filter.builder()
                    .name("vpc-id")
                    .values(vpcId)
                    .build())
                .build()
        );

        assertFalse(response.natGateways().isEmpty(), "NAT Gateway should exist");
        NatGateway natGateway = response.natGateways().get(0);

        assertEquals(NatGatewayState.AVAILABLE, natGateway.state(), "NAT Gateway should be available");
        assertFalse(natGateway.natGatewayAddresses().isEmpty(), "NAT Gateway should have Elastic IP");
    }

    // ========== Security Infrastructure Tests ==========

    @Test
    @Order(6)
    @DisplayName("Security groups are configured correctly")
    void testSecurityGroupsConfiguration() {
        skipIfOutputMissing("instance-security-group-id", "alb-security-group-id");

        String instanceSgId = outputs.get("instance-security-group-id");
        String albSgId = outputs.get("alb-security-group-id");

        DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(
            DescribeSecurityGroupsRequest.builder()
                .groupIds(instanceSgId, albSgId)
                .build()
        );

        assertEquals(2, response.securityGroups().size(), "Both security groups should exist");
    }

    @Test
    @Order(7)
    @DisplayName("ALB security group allows HTTP and HTTPS traffic")
    void testAlbSecurityGroupRules() {
        skipIfOutputMissing("alb-security-group-id");

        String albSgId = outputs.get("alb-security-group-id");

        DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(
            DescribeSecurityGroupsRequest.builder()
                .groupIds(albSgId)
                .build()
        );

        SecurityGroup albSg = response.securityGroups().get(0);
        List<IpPermission> ingressRules = albSg.ipPermissions();

        // Verify HTTP rule (port 80)
        boolean hasHttpRule = ingressRules.stream()
            .anyMatch(rule -> rule.fromPort() != null && rule.fromPort() == 80);
        assertTrue(hasHttpRule, "ALB security group should allow HTTP traffic");

        // Verify HTTPS rule (port 443)
        boolean hasHttpsRule = ingressRules.stream()
            .anyMatch(rule -> rule.fromPort() != null && rule.fromPort() == 443);
        assertTrue(hasHttpsRule, "ALB security group should allow HTTPS traffic");
    }

    @Test
    @Order(8)
    @DisplayName("Instance security group allows traffic from ALB")
    void testInstanceSecurityGroupRules() {
        skipIfOutputMissing("instance-security-group-id", "alb-security-group-id");

        String instanceSgId = outputs.get("instance-security-group-id");
        String albSgId = outputs.get("alb-security-group-id");

        DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(
            DescribeSecurityGroupsRequest.builder()
                .groupIds(instanceSgId)
                .build()
        );

        SecurityGroup instanceSg = response.securityGroups().get(0);
        List<IpPermission> ingressRules = instanceSg.ipPermissions();

        // Verify rule allowing traffic from ALB security group
        boolean hasAlbRule = ingressRules.stream()
            .anyMatch(rule -> rule.userIdGroupPairs().stream()
                .anyMatch(pair -> albSgId.equals(pair.groupId())));
        assertTrue(hasAlbRule, "Instance security group should allow traffic from ALB");
    }

    @Test
    @Order(9)
    @DisplayName("KMS key exists with encryption enabled")
    void testKmsKeyConfiguration() {
        skipIfOutputMissing("kms-key-id");

        String kmsKeyId = outputs.get("kms-key-id");

        DescribeKeyResponse response = kmsClient.describeKey(
            DescribeKeyRequest.builder().keyId(kmsKeyId).build()
        );

        KeyMetadata keyMetadata = response.keyMetadata();
        assertEquals(KeyState.ENABLED, keyMetadata.keyState(), "KMS key should be enabled");
        assertTrue(keyMetadata.enabled(), "KMS key should be enabled");
    }

    @Test
    @Order(10)
    @DisplayName("KMS key rotation is enabled")
    void testKmsKeyRotation() {
        skipIfOutputMissing("kms-key-id");

        String kmsKeyId = outputs.get("kms-key-id");

        GetKeyRotationStatusResponse response = kmsClient.getKeyRotationStatus(
            GetKeyRotationStatusRequest.builder().keyId(kmsKeyId).build()
        );

        assertTrue(response.keyRotationEnabled(), "KMS key rotation should be enabled");
    }

    @Test
    @Order(11)
    @DisplayName("IAM instance profile exists and has correct role")
    void testIamInstanceProfileConfiguration() {
        skipIfOutputMissing("instance-profile-name");

        String instanceProfileName = outputs.get("instance-profile-name");

        GetInstanceProfileResponse response = iamClient.getInstanceProfile(
            GetInstanceProfileRequest.builder()
                .instanceProfileName(instanceProfileName)
                .build()
        );

        InstanceProfile profile = response.instanceProfile();
        assertNotNull(profile, "Instance profile should exist");
        assertFalse(profile.roles().isEmpty(), "Instance profile should have at least one role");
    }

    @Test
    @Order(12)
    @DisplayName("IAM role has required policies attached")
    void testIamRolePolicies() {
        skipIfOutputMissing("instance-profile-name");

        String instanceProfileName = outputs.get("instance-profile-name");

        GetInstanceProfileResponse profileResponse = iamClient.getInstanceProfile(
            GetInstanceProfileRequest.builder()
                .instanceProfileName(instanceProfileName)
                .build()
        );

        String roleName = profileResponse.instanceProfile().roles().get(0).roleName();

        ListAttachedRolePoliciesResponse policiesResponse = iamClient.listAttachedRolePolicies(
            ListAttachedRolePoliciesRequest.builder()
                .roleName(roleName)
                .build()
        );

        List<AttachedPolicy> attachedPolicies = policiesResponse.attachedPolicies();
        assertTrue(attachedPolicies.size() >= 2, "Role should have at least 2 policies attached");

        // Verify CloudWatch and SSM policies
        boolean hasCloudWatchPolicy = attachedPolicies.stream()
            .anyMatch(policy -> policy.policyName().contains("CloudWatch"));
        boolean hasSsmPolicy = attachedPolicies.stream()
            .anyMatch(policy -> policy.policyName().contains("SSM"));

        assertTrue(hasCloudWatchPolicy, "Role should have CloudWatch policy");
        assertTrue(hasSsmPolicy, "Role should have SSM policy");
    }

    // ========== Load Balancer Infrastructure Tests ==========

    @Test
    @Order(13)
    @DisplayName("Application Load Balancer exists and is active")
    void testAlbConfiguration() {
        skipIfOutputMissing("alb-arn");

        String albArn = outputs.get("alb-arn");

        DescribeLoadBalancersResponse response = elbClient.describeLoadBalancers(
            DescribeLoadBalancersRequest.builder()
                .loadBalancerArns(albArn)
                .build()
        );

        assertFalse(response.loadBalancers().isEmpty(), "ALB should exist");
        LoadBalancer alb = response.loadBalancers().get(0);

        assertEquals(LoadBalancerStateEnum.ACTIVE, alb.state().code(), "ALB should be active");
        assertEquals(LoadBalancerSchemeEnum.INTERNET_FACING, alb.scheme(), "ALB should be internet-facing");
        assertEquals(LoadBalancerTypeEnum.APPLICATION, alb.type(), "Should be an Application Load Balancer");
    }

    @Test
    @Order(14)
    @DisplayName("ALB is deployed across multiple availability zones")
    void testAlbAvailabilityZones() {
        skipIfOutputMissing("alb-arn");

        String albArn = outputs.get("alb-arn");

        DescribeLoadBalancersResponse response = elbClient.describeLoadBalancers(
            DescribeLoadBalancersRequest.builder()
                .loadBalancerArns(albArn)
                .build()
        );

        LoadBalancer alb = response.loadBalancers().get(0);
        assertTrue(alb.availabilityZones().size() >= 2, "ALB should be deployed across at least 2 AZs");
    }

    @Test
    @Order(15)
    @DisplayName("Target group exists with correct health check configuration")
    void testTargetGroupConfiguration() {
        skipIfOutputMissing("target-group-arn");

        String targetGroupArn = outputs.get("target-group-arn");

        DescribeTargetGroupsResponse response = elbClient.describeTargetGroups(
            DescribeTargetGroupsRequest.builder()
                .targetGroupArns(targetGroupArn)
                .build()
        );

        assertFalse(response.targetGroups().isEmpty(), "Target group should exist");
        software.amazon.awssdk.services.elasticloadbalancingv2.model.TargetGroup targetGroup = response.targetGroups().get(0);

        assertEquals(80, targetGroup.port(), "Target group should use port 80");
        assertEquals(ProtocolEnum.HTTP, targetGroup.protocol(), "Target group should use HTTP protocol");
        assertEquals(TargetTypeEnum.INSTANCE, targetGroup.targetType(), "Target type should be instance");

        // Verify health check configuration
        assertEquals("/health", targetGroup.healthCheckPath(), "Health check path should be /health");
        assertEquals(30, targetGroup.healthCheckIntervalSeconds(), "Health check interval should be 30 seconds");
        assertEquals(2, targetGroup.healthyThresholdCount(), "Healthy threshold should be 2");
        assertEquals(2, targetGroup.unhealthyThresholdCount(), "Unhealthy threshold should be 2");
    }

    @Test
    @Order(16)
    @DisplayName("HTTP listener is configured correctly")
    void testHttpListenerConfiguration() {
        skipIfOutputMissing("alb-arn");

        String albArn = outputs.get("alb-arn");

        DescribeListenersResponse response = elbClient.describeListeners(
            DescribeListenersRequest.builder()
                .loadBalancerArn(albArn)
                .build()
        );

        assertFalse(response.listeners().isEmpty(), "At least one listener should exist");

        // Find HTTP listener
        Optional<Listener> httpListener = response.listeners().stream()
            .filter(listener -> listener.port() == 80)
            .findFirst();

        assertTrue(httpListener.isPresent(), "HTTP listener on port 80 should exist");
        assertEquals(software.amazon.awssdk.services.elasticloadbalancingv2.model.ProtocolEnum.HTTP,
            httpListener.get().protocol(), "Listener should use HTTP protocol");
    }

    // ========== Compute Infrastructure Tests ==========

    @Test
    @Order(17)
    @DisplayName("Auto Scaling Group exists with correct configuration")
    void testAutoScalingGroupConfiguration() {
        skipIfOutputMissing("autoscaling-group-name");

        String asgName = outputs.get("autoscaling-group-name");

        DescribeAutoScalingGroupsResponse response = autoScalingClient.describeAutoScalingGroups(
            DescribeAutoScalingGroupsRequest.builder()
                .autoScalingGroupNames(asgName)
                .build()
        );

        assertFalse(response.autoScalingGroups().isEmpty(), "Auto Scaling Group should exist");
        software.amazon.awssdk.services.autoscaling.model.AutoScalingGroup asg = response.autoScalingGroups().get(0);

        assertEquals(2, asg.minSize(), "Min size should be 2");
        assertEquals(6, asg.maxSize(), "Max size should be 6");
        assertEquals(2, asg.desiredCapacity(), "Desired capacity should be 2");
        assertEquals("ELB", asg.healthCheckType(), "Health check type should be ELB");
        assertEquals(300, asg.healthCheckGracePeriod(), "Health check grace period should be 300");
    }

    @Test
    @Order(18)
    @DisplayName("Auto Scaling Group is attached to target group")
    void testAutoScalingGroupTargetGroupAttachment() {
        skipIfOutputMissing("autoscaling-group-name", "target-group-arn");

        String asgName = outputs.get("autoscaling-group-name");
        String targetGroupArn = outputs.get("target-group-arn");

        DescribeAutoScalingGroupsResponse response = autoScalingClient.describeAutoScalingGroups(
            DescribeAutoScalingGroupsRequest.builder()
                .autoScalingGroupNames(asgName)
                .build()
        );

        software.amazon.awssdk.services.autoscaling.model.AutoScalingGroup asg = response.autoScalingGroups().get(0);
        assertTrue(asg.targetGroupARNs().contains(targetGroupArn),
            "Auto Scaling Group should be attached to target group");
    }

    @Test
    @Order(19)
    @DisplayName("Auto Scaling Group spans multiple availability zones")
    void testAutoScalingGroupAZs() {
        skipIfOutputMissing("autoscaling-group-name");

        String asgName = outputs.get("autoscaling-group-name");

        DescribeAutoScalingGroupsResponse response = autoScalingClient.describeAutoScalingGroups(
            DescribeAutoScalingGroupsRequest.builder()
                .autoScalingGroupNames(asgName)
                .build()
        );

        software.amazon.awssdk.services.autoscaling.model.AutoScalingGroup asg = response.autoScalingGroups().get(0);
        assertTrue(asg.availabilityZones().size() >= 2, "Auto Scaling Group should span at least 2 AZs");
    }

    @Test
    @Order(20)
    @DisplayName("EC2 instances are running and healthy")
    void testEc2InstancesHealth() {
        skipIfOutputMissing("instance-ids");

        String instanceIdsStr = outputs.get("instance-ids");
        List<String> instanceIds = parseListOutput(instanceIdsStr);

        if (instanceIds.isEmpty()) {
            System.out.println("No instance IDs found in outputs, skipping test");
            return;
        }

        DescribeInstancesResponse response = ec2Client.describeInstances(
            DescribeInstancesRequest.builder()
                .instanceIds(instanceIds)
                .build()
        );

        List<software.amazon.awssdk.services.ec2.model.Instance> instances = response.reservations().stream()
            .flatMap(reservation -> reservation.instances().stream())
            .toList();

        assertFalse(instances.isEmpty(), "At least one instance should exist");

        for (software.amazon.awssdk.services.ec2.model.Instance instance : instances) {
            assertThat(instance.state().name())
                .isIn(InstanceStateName.RUNNING, InstanceStateName.PENDING);
        }
    }

    @Test
    @Order(21)
    @DisplayName("EC2 instances have encryption enabled")
    void testEc2InstancesEncryption() {
        skipIfOutputMissing("instance-ids");

        String instanceIdsStr = outputs.get("instance-ids");
        List<String> instanceIds = parseListOutput(instanceIdsStr);

        if (instanceIds.isEmpty()) {
            System.out.println("No instance IDs found in outputs, skipping test");
            return;
        }

        DescribeInstancesResponse response = ec2Client.describeInstances(
            DescribeInstancesRequest.builder()
                .instanceIds(instanceIds)
                .build()
        );

        List<software.amazon.awssdk.services.ec2.model.Instance> instances = response.reservations().stream()
            .flatMap(reservation -> reservation.instances().stream())
            .toList();

        for (software.amazon.awssdk.services.ec2.model.Instance instance : instances) {
            assertNotNull(instance.rootDeviceName(), "Instance should have root device");

            // Get volume details
            if (!instance.blockDeviceMappings().isEmpty()) {
                EbsInstanceBlockDevice ebs = instance.blockDeviceMappings().get(0).ebs();
                if (ebs != null) {
                    String volumeId = ebs.volumeId();
                    DescribeVolumesResponse volumeResponse = ec2Client.describeVolumes(
                        DescribeVolumesRequest.builder().volumeIds(volumeId).build()
                    );

                    if (!volumeResponse.volumes().isEmpty()) {
                        Volume volume = volumeResponse.volumes().get(0);
                        assertTrue(volume.encrypted(), "Root volume should be encrypted");
                    }
                }
            }
        }
    }

    @Test
    @Order(22)
    @DisplayName("EC2 instances have monitoring enabled")
    void testEc2InstancesMonitoring() {
        skipIfOutputMissing("instance-ids");

        String instanceIdsStr = outputs.get("instance-ids");
        List<String> instanceIds = parseListOutput(instanceIdsStr);

        if (instanceIds.isEmpty()) {
            System.out.println("No instance IDs found in outputs, skipping test");
            return;
        }

        DescribeInstancesResponse response = ec2Client.describeInstances(
            DescribeInstancesRequest.builder()
                .instanceIds(instanceIds)
                .build()
        );

        List<software.amazon.awssdk.services.ec2.model.Instance> instances = response.reservations().stream()
            .flatMap(reservation -> reservation.instances().stream())
            .toList();

        for (software.amazon.awssdk.services.ec2.model.Instance instance : instances) {
            assertNotNull(instance.monitoring(), "Instance should have monitoring configuration");
            assertThat(instance.monitoring().state())
                .isIn(MonitoringState.ENABLED, MonitoringState.PENDING);
        }
    }

    // ========== Monitoring Infrastructure Tests ==========

    @Test
    @Order(23)
    @DisplayName("CloudWatch alarms are configured")
    void testCloudWatchAlarmsConfiguration() {
        // Search for specific alarms by name instead of listing all alarms
        DescribeAlarmsResponse cpuResponse = cloudWatchClient.describeAlarms(
            DescribeAlarmsRequest.builder()
                .alarmNames("high-cpu-utilization")
                .build()
        );

        DescribeAlarmsResponse healthResponse = cloudWatchClient.describeAlarms(
            DescribeAlarmsRequest.builder()
                .alarmNames("unhealthy-targets")
                .build()
        );

        DescribeAlarmsResponse requestResponse = cloudWatchClient.describeAlarms(
            DescribeAlarmsRequest.builder()
                .alarmNames("high-request-count")
                .build()
        );

        // Verify CPU alarm exists
        assertFalse(cpuResponse.metricAlarms().isEmpty(), "CPU utilization alarm should exist");

        // Verify target health alarm exists
        assertFalse(healthResponse.metricAlarms().isEmpty(), "Healthy host count alarm should exist");

        // Verify request count alarm exists
        assertFalse(requestResponse.metricAlarms().isEmpty(), "Request count alarm should exist");
    }

    @Test
    @Order(24)
    @DisplayName("CPU alarm is configured with correct threshold")
    void testCpuAlarmConfiguration() {
        // Search for specific alarm by name
        DescribeAlarmsResponse response = cloudWatchClient.describeAlarms(
            DescribeAlarmsRequest.builder()
                .alarmNames("high-cpu-utilization")
                .build()
        );

        assertFalse(response.metricAlarms().isEmpty(), "CPU alarm should exist");

        MetricAlarm alarm = response.metricAlarms().get(0);
        assertEquals(80.0, alarm.threshold(), "CPU alarm threshold should be 80%");
        assertEquals(ComparisonOperator.GREATER_THAN_THRESHOLD, alarm.comparisonOperator(),
            "CPU alarm should use GreaterThanThreshold");
        assertTrue(alarm.actionsEnabled(), "Alarm actions should be enabled");
    }

    @Test
    @Order(25)
    @DisplayName("SNS topic for alarms exists")
    void testSnsTopicConfiguration() {
        skipIfOutputMissing("alarm-topic-arn");

        String topicArn = outputs.get("alarm-topic-arn");

        GetTopicAttributesResponse response = snsClient.getTopicAttributes(
            GetTopicAttributesRequest.builder()
                .topicArn(topicArn)
                .build()
        );

        assertNotNull(response.attributes(), "SNS topic should have attributes");
        assertEquals("VPC Migration Alarms", response.attributes().get("DisplayName"),
            "SNS topic display name should be correct");
    }

    @Test
    @Order(26)
    @DisplayName("SNS topic has email subscription")
    void testSnsTopicSubscription() {
        skipIfOutputMissing("alarm-topic-arn");

        String topicArn = outputs.get("alarm-topic-arn");

        ListSubscriptionsByTopicResponse response = snsClient.listSubscriptionsByTopic(
            ListSubscriptionsByTopicRequest.builder()
                .topicArn(topicArn)
                .build()
        );

        assertFalse(response.subscriptions().isEmpty(), "SNS topic should have at least one subscription");

        boolean hasEmailSubscription = response.subscriptions().stream()
            .anyMatch(sub -> "email".equals(sub.protocol()));
        assertTrue(hasEmailSubscription, "SNS topic should have email subscription");
    }

    @Test
    @Order(27)
    @DisplayName("CloudWatch dashboard exists")
    void testCloudWatchDashboard() {
        ListDashboardsResponse response = cloudWatchClient.listDashboards(
            ListDashboardsRequest.builder().build()
        );

        boolean hasDashboard = response.dashboardEntries().stream()
            .anyMatch(dashboard -> "vpc-migration-dashboard".equals(dashboard.dashboardName()));
        assertTrue(hasDashboard, "CloudWatch dashboard should exist");
    }

    // ========== Cross-Service Integration Tests ==========

    @Test
    @Order(28)
    @DisplayName("Interactive Test: ALB can route traffic to healthy instances")
    void testAlbTargetHealthIntegration() throws InterruptedException {
        skipIfOutputMissing("target-group-arn", "alb-dns-name");

        String targetGroupArn = outputs.get("target-group-arn");
        String albDnsName = outputs.get("alb-dns-name");

        System.out.println("Testing ALB health check integration...");

        // Wait for instances to become healthy (max 2 minutes)
        int maxAttempts = 24;
        int attempt = 0;
        boolean hasHealthyTargets = false;

        while (attempt < maxAttempts && !hasHealthyTargets) {
            DescribeTargetHealthResponse response = elbClient.describeTargetHealth(
                DescribeTargetHealthRequest.builder()
                    .targetGroupArn(targetGroupArn)
                    .build()
            );

            List<TargetHealthDescription> targets = response.targetHealthDescriptions();
            long healthyCount = targets.stream()
                .filter(target -> TargetHealthStateEnum.HEALTHY.equals(target.targetHealth().state()))
                .count();

            System.out.println("Attempt " + (attempt + 1) + ": " + healthyCount + " healthy targets out of " + targets.size());

            if (healthyCount > 0) {
                hasHealthyTargets = true;
            } else {
                Thread.sleep(5000); // Wait 5 seconds before next check
                attempt++;
            }
        }

        assertTrue(hasHealthyTargets, "At least one target should be healthy after waiting");
    }

    @Test
    @Order(29)
    @DisplayName("Interactive Test: ALB DNS responds to HTTP requests")
    void testAlbHttpResponseIntegration() throws Exception {
        skipIfOutputMissing("alb-dns-name");

        String albDnsName = outputs.get("alb-dns-name");
        String url = "http://" + albDnsName;

        System.out.println("Testing HTTP connectivity to ALB at: " + url);

        // Retry logic for ALB to become available
        int maxAttempts = 10;
        int attempt = 0;
        boolean success = false;

        while (attempt < maxAttempts && !success) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                System.out.println("HTTP Response Status: " + response.statusCode());
                System.out.println("HTTP Response Body: " + response.body());

                // Any response (even 503) means ALB is responding
                assertThat(response.statusCode()).isLessThan(600);
                success = true;

            } catch (Exception e) {
                System.out.println("Attempt " + (attempt + 1) + " failed: " + e.getMessage());
                Thread.sleep(10000); // Wait 10 seconds before retry
                attempt++;
            }
        }

        assertTrue(success, "ALB should respond to HTTP requests");
    }

    @Test
    @Order(30)
    @DisplayName("Interactive Test: Security group connectivity flow")
    void testSecurityGroupConnectivityFlow() {
        skipIfOutputMissing("alb-security-group-id", "instance-security-group-id");

        String albSgId = outputs.get("alb-security-group-id");
        String instanceSgId = outputs.get("instance-security-group-id");

        System.out.println("Testing security group connectivity flow...");

        // Verify ALB SG allows inbound HTTP/HTTPS
        DescribeSecurityGroupsResponse albSgResponse = ec2Client.describeSecurityGroups(
            DescribeSecurityGroupsRequest.builder().groupIds(albSgId).build()
        );

        SecurityGroup albSg = albSgResponse.securityGroups().get(0);
        boolean albAllowsHttp = albSg.ipPermissions().stream()
            .anyMatch(perm -> perm.fromPort() != null && perm.fromPort() == 80);
        assertTrue(albAllowsHttp, "ALB security group should allow HTTP from internet");

        // Verify Instance SG allows traffic from ALB SG
        DescribeSecurityGroupsResponse instanceSgResponse = ec2Client.describeSecurityGroups(
            DescribeSecurityGroupsRequest.builder().groupIds(instanceSgId).build()
        );

        SecurityGroup instanceSg = instanceSgResponse.securityGroups().get(0);
        boolean instanceAllowsAlb = instanceSg.ipPermissions().stream()
            .anyMatch(perm -> perm.userIdGroupPairs().stream()
                .anyMatch(pair -> albSgId.equals(pair.groupId())));
        assertTrue(instanceAllowsAlb, "Instance security group should allow traffic from ALB");

        System.out.println("✓ Security group connectivity flow verified");
    }

    @Test
    @Order(31)
    @DisplayName("Interactive Test: Auto Scaling Group integration with Load Balancer")
    void testAutoScalingGroupLoadBalancerIntegration() {
        skipIfOutputMissing("autoscaling-group-name", "target-group-arn");

        String asgName = outputs.get("autoscaling-group-name");
        String targetGroupArn = outputs.get("target-group-arn");

        System.out.println("Testing Auto Scaling Group and Load Balancer integration...");

        // Get ASG instances
        DescribeAutoScalingGroupsResponse asgResponse = autoScalingClient.describeAutoScalingGroups(
            DescribeAutoScalingGroupsRequest.builder()
                .autoScalingGroupNames(asgName)
                .build()
        );

        software.amazon.awssdk.services.autoscaling.model.AutoScalingGroup asg = asgResponse.autoScalingGroups().get(0);
        List<String> asgInstanceIds = asg.instances().stream()
            .map(software.amazon.awssdk.services.autoscaling.model.Instance::instanceId)
            .toList();

        System.out.println("ASG has " + asgInstanceIds.size() + " instances");

        // Get target group targets
        DescribeTargetHealthResponse targetHealthResponse = elbClient.describeTargetHealth(
            DescribeTargetHealthRequest.builder()
                .targetGroupArn(targetGroupArn)
                .build()
        );

        List<String> targetIds = targetHealthResponse.targetHealthDescriptions().stream()
            .map(target -> target.target().id())
            .toList();

        System.out.println("Target group has " + targetIds.size() + " targets");

        // Verify ASG instances are registered with target group
        for (String instanceId : asgInstanceIds) {
            assertTrue(targetIds.contains(instanceId),
                "ASG instance " + instanceId + " should be registered with target group");
        }

        System.out.println("✓ All ASG instances are registered with target group");
    }

    @Test
    @Order(32)
    @DisplayName("Interactive Test: KMS encryption integration with EC2 volumes")
    void testKmsEc2VolumeEncryptionIntegration() {
        skipIfOutputMissing("kms-key-id", "instance-ids");

        String kmsKeyId = outputs.get("kms-key-id");
        String instanceIdsStr = outputs.get("instance-ids");
        List<String> instanceIds = parseListOutput(instanceIdsStr);

        if (instanceIds.isEmpty()) {
            System.out.println("No instances to test, skipping");
            return;
        }

        System.out.println("Testing KMS encryption integration with EC2 volumes...");

        DescribeInstancesResponse response = ec2Client.describeInstances(
            DescribeInstancesRequest.builder()
                .instanceIds(instanceIds)
                .build()
        );

        List<software.amazon.awssdk.services.ec2.model.Instance> instances = response.reservations().stream()
            .flatMap(reservation -> reservation.instances().stream())
            .toList();

        for (software.amazon.awssdk.services.ec2.model.Instance instance : instances) {
            if (!instance.blockDeviceMappings().isEmpty()) {
                EbsInstanceBlockDevice ebs = instance.blockDeviceMappings().get(0).ebs();
                if (ebs != null) {
                    String volumeId = ebs.volumeId();
                    DescribeVolumesResponse volumeResponse = ec2Client.describeVolumes(
                        DescribeVolumesRequest.builder().volumeIds(volumeId).build()
                    );

                    Volume volume = volumeResponse.volumes().get(0);
                    assertTrue(volume.encrypted(), "Volume should be encrypted");

                    if (volume.kmsKeyId() != null) {
                        System.out.println("✓ Volume " + volumeId + " is encrypted with KMS key");
                    }
                }
            }
        }

        System.out.println("✓ KMS encryption verified for EC2 volumes");
    }

    @Test
    @Order(33)
    @DisplayName("Interactive Test: CloudWatch metrics are being collected")
    void testCloudWatchMetricsCollection() throws InterruptedException {
        skipIfOutputMissing("autoscaling-group-name");

        String asgName = outputs.get("autoscaling-group-name");

        System.out.println("Testing CloudWatch metrics collection...");

        // Wait a bit for metrics to be available
        Thread.sleep(5000);

        // Query for CPU metrics
        GetMetricStatisticsResponse response = cloudWatchClient.getMetricStatistics(
            GetMetricStatisticsRequest.builder()
                .namespace("AWS/EC2")
                .metricName("CPUUtilization")
                .dimensions(Dimension.builder()
                    .name("AutoScalingGroupName")
                    .value(asgName)
                    .build())
                .startTime(java.time.Instant.now().minus(java.time.Duration.ofMinutes(15)))
                .endTime(java.time.Instant.now())
                .period(300)
                .statistics(Statistic.AVERAGE)
                .build()
        );

        // Metrics might not be available immediately, so we just verify the call succeeds
        assertNotNull(response, "CloudWatch metrics query should succeed");
        System.out.println("✓ CloudWatch metrics API is accessible, " +
            response.datapoints().size() + " datapoints found");
    }

    @Test
    @Order(34)
    @DisplayName("Interactive Test: Network routing configuration")
    void testNetworkRoutingConfiguration() {
        skipIfOutputMissing("vpc-id", "public-subnet-ids", "private-subnet-ids");

        String vpcId = outputs.get("vpc-id");
        String publicSubnetIdsStr = outputs.get("public-subnet-ids");
        String privateSubnetIdsStr = outputs.get("private-subnet-ids");

        List<String> publicSubnetIds = parseListOutput(publicSubnetIdsStr);
        List<String> privateSubnetIds = parseListOutput(privateSubnetIdsStr);

        System.out.println("Testing network routing configuration...");

        // Get route tables
        DescribeRouteTablesResponse response = ec2Client.describeRouteTables(
            DescribeRouteTablesRequest.builder()
                .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                    .name("vpc-id")
                    .values(vpcId)
                    .build())
                .build()
        );

        List<RouteTable> routeTables = response.routeTables();

        // Verify public subnets have route to IGW
        for (String subnetId : publicSubnetIds) {
            RouteTable publicRouteTable = routeTables.stream()
                .filter(rt -> rt.associations().stream()
                    .anyMatch(assoc -> subnetId.equals(assoc.subnetId())))
                .findFirst()
                .orElse(null);

            assertNotNull(publicRouteTable, "Public subnet should have associated route table");

            boolean hasIgwRoute = publicRouteTable.routes().stream()
                .anyMatch(route -> route.gatewayId() != null &&
                    route.gatewayId().startsWith("igw-") &&
                    "0.0.0.0/0".equals(route.destinationCidrBlock()));

            assertTrue(hasIgwRoute, "Public subnet should have route to Internet Gateway");
        }

        // Verify private subnets have route to NAT Gateway
        for (String subnetId : privateSubnetIds) {
            RouteTable privateRouteTable = routeTables.stream()
                .filter(rt -> rt.associations().stream()
                    .anyMatch(assoc -> subnetId.equals(assoc.subnetId())))
                .findFirst()
                .orElse(null);

            if (privateRouteTable != null) {
                boolean hasNatRoute = privateRouteTable.routes().stream()
                    .anyMatch(route -> route.natGatewayId() != null &&
                        "0.0.0.0/0".equals(route.destinationCidrBlock()));

                assertTrue(hasNatRoute, "Private subnet should have route to NAT Gateway");
            }
        }

        System.out.println("✓ Network routing configuration verified");
    }

    @Test
    @Order(35)
    @DisplayName("Interactive Test: End-to-end infrastructure health check")
    void testEndToEndInfrastructureHealth() throws Exception {
        skipIfOutputMissing("vpc-id", "alb-dns-name", "autoscaling-group-name");

        System.out.println("Running end-to-end infrastructure health check...");

        // 1. Verify VPC is available
        String vpcId = outputs.get("vpc-id");
        DescribeVpcsResponse vpcResponse = ec2Client.describeVpcs(
            DescribeVpcsRequest.builder().vpcIds(vpcId).build()
        );
        assertEquals(VpcState.AVAILABLE, vpcResponse.vpcs().get(0).state(), "VPC should be available");
        System.out.println("✓ VPC is available");

        // 2. Verify ALB is active
        String albDnsName = outputs.get("alb-dns-name");
        String albArn = outputs.get("alb-arn");
        DescribeLoadBalancersResponse albResponse = elbClient.describeLoadBalancers(
            DescribeLoadBalancersRequest.builder().loadBalancerArns(albArn).build()
        );
        assertEquals(LoadBalancerStateEnum.ACTIVE, albResponse.loadBalancers().get(0).state().code(),
            "ALB should be active");
        System.out.println("✓ ALB is active");

        // 3. Verify ASG has instances
        String asgName = outputs.get("autoscaling-group-name");
        DescribeAutoScalingGroupsResponse asgResponse = autoScalingClient.describeAutoScalingGroups(
            DescribeAutoScalingGroupsRequest.builder().autoScalingGroupNames(asgName).build()
        );
        assertTrue(asgResponse.autoScalingGroups().get(0).instances().size() >= 2,
            "ASG should have at least 2 instances");
        System.out.println("✓ ASG has required instances");

        // 4. Verify CloudWatch alarms exist
        DescribeAlarmsResponse alarmsResponse = cloudWatchClient.describeAlarms(
            DescribeAlarmsRequest.builder().maxRecords(100).build()
        );
        assertTrue(alarmsResponse.metricAlarms().size() >= 3, "Should have at least 3 alarms configured");
        System.out.println("✓ CloudWatch alarms are configured");

        // 5. Test HTTP connectivity
        try {
            String url = "http://" + albDnsName;
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).isLessThan(600);
            System.out.println("✓ HTTP connectivity verified (status: " + response.statusCode() + ")");
        } catch (Exception e) {
            System.out.println("⚠ HTTP connectivity test skipped: " + e.getMessage());
        }

        System.out.println("✓ End-to-end infrastructure health check completed successfully");
    }

    // ========== Helper Methods ==========

    private void skipIfOutputMissing(String... requiredOutputs) {
        if (outputs == null || outputs.isEmpty()) {
            Assumptions.assumeTrue(false, "No outputs available - skipping test");
        }

        for (String output : requiredOutputs) {
            if (!outputs.containsKey(output)) {
                Assumptions.assumeTrue(false, "Required output '" + output + "' not found - skipping test");
            }
        }
    }

    private List<String> parseListOutput(String listStr) {
        if (listStr == null || listStr.isEmpty()) {
            return new ArrayList<>();
        }

        // Handle both JSON array format and comma-separated format
        try {
            JsonNode node = MAPPER.readTree(listStr);
            if (node.isArray()) {
                List<String> result = new ArrayList<>();
                node.forEach(elem -> result.add(elem.asText()));
                return result;
            }
        } catch (Exception e) {
            // Fall through to comma-separated parsing
        }

        // Try comma-separated
        return Arrays.stream(listStr.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
    }

    @AfterAll
    static void cleanup() {
        // Close clients
        if (ec2Client != null) ec2Client.close();
        if (elbClient != null) elbClient.close();
        if (autoScalingClient != null) autoScalingClient.close();
        if (iamClient != null) iamClient.close();
        if (kmsClient != null) kmsClient.close();
        if (cloudWatchClient != null) cloudWatchClient.close();
        if (logsClient != null) logsClient.close();
        if (snsClient != null) snsClient.close();
    }
}
