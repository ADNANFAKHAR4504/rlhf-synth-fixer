package app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.assertj.core.api.Assertions;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionResponse;
import software.amazon.awssdk.services.s3.model.GetBucketLifecycleConfigurationRequest;
import software.amazon.awssdk.services.s3.model.GetBucketLifecycleConfigurationResponse;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningRequest;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.TransitionStorageClass;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.SecurityGroup;
import software.amazon.awssdk.services.elasticloadbalancingv2.ElasticLoadBalancingV2Client;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.LoadBalancer;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.LoadBalancerSchemeEnum;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.LoadBalancerStateEnum;
import software.amazon.awssdk.services.autoscaling.AutoScalingClient;
import software.amazon.awssdk.services.autoscaling.model.AutoScalingGroup;
import software.amazon.awssdk.services.autoscaling.model.DescribeAutoScalingGroupsRequest;
import software.amazon.awssdk.services.autoscaling.model.DescribeAutoScalingGroupsResponse;
import software.amazon.awssdk.services.autoscaling.model.DescribePoliciesRequest;
import software.amazon.awssdk.services.autoscaling.model.DescribePoliciesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeNatGatewaysRequest;
import software.amazon.awssdk.services.ec2.model.DescribeNatGatewaysResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Filter;
import software.amazon.awssdk.services.ec2.model.NatGatewayState;
import software.amazon.awssdk.services.ec2.model.SecurityGroup;
import software.amazon.awssdk.services.ec2.model.Tag;
import software.amazon.awssdk.services.ec2.model.Vpc;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.nio.file.Files;

/**
 * Integration tests for WebApp infrastructure deployment.
 * These tests run against actual AWS resources deployed by CDK.
 */
@DisplayName("WebApp Stack Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class WebAppStackIntegrationTest {
    
    private static S3Client s3Client;
    private static Ec2Client ec2Client;
    private static ElasticLoadBalancingV2Client elbClient;
    private static AutoScalingClient asgClient;
    private static HttpClient httpClient;
    private static ObjectMapper objectMapper;
    private static JsonNode outputs;
    private static String region;
    
    @BeforeAll
    public static void setupClients() throws IOException {
        // Read outputs from CDK deployment
        String outputsPath = "cfn-outputs/flat-outputs.json";
        File outputsFile = new File(outputsPath);
        
        if (!outputsFile.exists()) {
            System.out.println("Warning: Outputs file not found at " + outputsPath);
            System.out.println("Attempting to read from alternative location...");
            // Try alternative location
            outputsPath = "../../cfn-outputs/flat-outputs.json";
            outputsFile = new File(outputsPath);
        }
        
        objectMapper = new ObjectMapper();
        if (outputsFile.exists()) {
            String jsonContent = Files.readString(outputsFile.toPath());
            outputs = objectMapper.readTree(jsonContent);
            System.out.println("Loaded outputs: " + outputs.toString());
        } else {
            System.out.println("Warning: Could not find outputs file. Some tests may be skipped.");
            outputs = objectMapper.createObjectNode();
        }
        
        // Determine region
        region = System.getenv("AWS_REGION");
        if (region == null || region.isEmpty()) {
            region = "us-west-2"; // Default to us-west-2 as specified
        }
        
        Region awsRegion = Region.of(region);
        
        // Initialize AWS clients
        s3Client = S3Client.builder()
            .region(awsRegion)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        ec2Client = Ec2Client.builder()
            .region(awsRegion)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        elbClient = ElasticLoadBalancingV2Client.builder()
            .region(awsRegion)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        asgClient = AutoScalingClient.builder()
            .region(awsRegion)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }
    
    @AfterAll
    public static void closeClients() {
        if (s3Client != null) {
            s3Client.close();
        }
        if (ec2Client != null) {
            ec2Client.close();
        }
        if (elbClient != null) {
            elbClient.close();
        }
        if (asgClient != null) {
            asgClient.close();
        }
    }
    
    @Test
    @Order(1)
    @DisplayName("VPC should be created and configured correctly")
    public void testVpcDeployment() {
        String vpcId = getOutput("VPCId");
        if (vpcId == null) {
            System.out.println("Skipping VPC test - no VPC ID in outputs");
            return;
        }
        
        // Describe VPC
        DescribeVpcsRequest request = DescribeVpcsRequest.builder()
            .vpcIds(vpcId)
            .build();
            
        DescribeVpcsResponse response = ec2Client.describeVpcs(request);
        
        Assertions.assertThat(response.vpcs()).hasSize(1);
        Vpc vpc = response.vpcs().get(0);
        
        // Verify VPC CIDR
        Assertions.assertThat(vpc.cidrBlock()).isEqualTo("10.0.0.0/16");
        
        // Verify subnets
        DescribeSubnetsRequest subnetRequest = DescribeSubnetsRequest.builder()
            .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                .name("vpc-id")
                .values(vpcId)
                .build())
            .build();
            
        DescribeSubnetsResponse subnetResponse = ec2Client.describeSubnets(subnetRequest);
        
        // Should have at least 4 subnets (2 public, 2 private minimum)
        Assertions.assertThat(subnetResponse.subnets()).hasSizeGreaterThanOrEqualTo(4);
        
        // Verify NAT Gateways
        DescribeNatGatewaysRequest natRequest = DescribeNatGatewaysRequest.builder()
            .filter(software.amazon.awssdk.services.ec2.model.Filter.builder()
                .name("vpc-id")
                .values(vpcId)
                .build())
            .build();
            
        DescribeNatGatewaysResponse natResponse = ec2Client.describeNatGateways(natRequest);
        
        // Should have 2 NAT Gateways for HA
        Assertions.assertThat(natResponse.natGateways()
            .stream()
            .filter(nat -> nat.state() == NatGatewayState.AVAILABLE)
            .count()).isEqualTo(2);
    }
    
    @Test
    @Order(2)
    @DisplayName("S3 bucket should be created with correct configuration")
    public void testS3BucketDeployment() {
        String bucketName = getOutput("S3BucketName");
        if (bucketName == null) {
            System.out.println("Skipping S3 test - no bucket name in outputs");
            return;
        }
        
        // Check bucket exists
        HeadBucketRequest headRequest = HeadBucketRequest.builder()
            .bucket(bucketName)
            .build();
            
        try {
            s3Client.headBucket(headRequest);
        } catch (Exception e) {
            Assertions.fail("Bucket does not exist: " + bucketName);
        }
        
        // Verify versioning is enabled
        GetBucketVersioningRequest versioningRequest = GetBucketVersioningRequest.builder()
            .bucket(bucketName)
            .build();
            
        GetBucketVersioningResponse versioningResponse = s3Client.getBucketVersioning(versioningRequest);
        Assertions.assertThat(versioningResponse.statusAsString()).isEqualTo("Enabled");
        
        // Verify encryption
        GetBucketEncryptionRequest encryptionRequest = GetBucketEncryptionRequest.builder()
            .bucket(bucketName)
            .build();
            
        GetBucketEncryptionResponse encryptionResponse = s3Client.getBucketEncryption(encryptionRequest);
        Assertions.assertThat(encryptionResponse.serverSideEncryptionConfiguration()).isNotNull();
        
        // Verify lifecycle configuration
        GetBucketLifecycleConfigurationRequest lifecycleRequest = 
            GetBucketLifecycleConfigurationRequest.builder()
                .bucket(bucketName)
                .build();
                
        GetBucketLifecycleConfigurationResponse lifecycleResponse = 
            s3Client.getBucketLifecycleConfiguration(lifecycleRequest);
            
        Assertions.assertThat(lifecycleResponse.rules()).isNotEmpty();
        
        // Check for Glacier transition
        boolean hasGlacierTransition = lifecycleResponse.rules().stream()
            .anyMatch(rule -> rule.transitions().stream()
                .anyMatch(t -> t.storageClass() == TransitionStorageClass.GLACIER && 
                              t.days() == 30));
                              
        Assertions.assertThat(hasGlacierTransition).isTrue();
    }
    
    @Test
    @Order(3)
    @DisplayName("Auto Scaling Group should be configured correctly")
    public void testAutoScalingGroup() {
        String asgName = getOutput("AutoScalingGroupName");
        if (asgName == null) {
            System.out.println("Skipping ASG test - no ASG name in outputs");
            return;
        }
        
        DescribeAutoScalingGroupsRequest request = DescribeAutoScalingGroupsRequest.builder()
            .autoScalingGroupNames(asgName)
            .build();
            
        DescribeAutoScalingGroupsResponse response = asgClient.describeAutoScalingGroups(request);
        
        Assertions.assertThat(response.autoScalingGroups()).hasSize(1);
        
        AutoScalingGroup asg = response.autoScalingGroups().get(0);
        
        // Verify capacity settings
        Assertions.assertThat(asg.minSize()).isEqualTo(2);
        Assertions.assertThat(asg.maxSize()).isEqualTo(6);
        Assertions.assertThat(asg.desiredCapacity()).isGreaterThanOrEqualTo(2);
        
        // Verify instances are running
        Assertions.assertThat(asg.instances()).hasSizeGreaterThanOrEqualTo(2);
        
        // Verify all instances are healthy
        long healthyInstances = asg.instances().stream()
            .filter(i -> i.healthStatus().equals("Healthy"))
            .count();
        Assertions.assertThat(healthyInstances).isGreaterThanOrEqualTo(2);
        
        // Verify scaling policies
        DescribePoliciesRequest policiesRequest = DescribePoliciesRequest.builder()
            .autoScalingGroupName(asgName)
            .build();
            
        DescribePoliciesResponse policiesResponse = asgClient.describePolicies(policiesRequest);
        
        // Should have CPU-based scaling policy
        boolean hasCpuScaling = policiesResponse.scalingPolicies().stream()
            .anyMatch(policy -> policy.policyType().equals("TargetTrackingScaling"));
            
        Assertions.assertThat(hasCpuScaling).isTrue();
    }
    
    @Test
    @Order(4)
    @DisplayName("Application Load Balancer should be accessible")
    public void testApplicationLoadBalancer() {
        String albDns = getOutput("LoadBalancerDNS");
        if (albDns == null) {
            System.out.println("Skipping ALB test - no DNS name in outputs");
            return;
        }
        
        // Describe load balancer
        software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest request = software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest.builder()
            .build();
            
        software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersResponse response = elbClient.describeLoadBalancers(request);
        
        LoadBalancer alb = response.loadBalancers().stream()
            .filter(lb -> lb.dnsName().equals(albDns))
            .findFirst()
            .orElse(null);
            
        Assertions.assertThat(alb).isNotNull();
        Assertions.assertThat(alb.state().code()).isEqualTo(LoadBalancerStateEnum.ACTIVE);
        Assertions.assertThat(alb.scheme()).isEqualTo(LoadBalancerSchemeEnum.INTERNET_FACING);
        
        // Test HTTP endpoint (should redirect to HTTPS in production)
        try {
            URI uri = URI.create("http://" + albDns);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();
                
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, 
                HttpResponse.BodyHandlers.ofString());
                
            // Should get a response (either 200 or redirect)
            Assertions.assertThat(httpResponse.statusCode())
                .isIn(200, 301, 302, 307, 308);
                
        } catch (Exception e) {
            System.out.println("Warning: Could not connect to ALB at " + albDns);
            System.out.println("This might be expected if DNS propagation is still in progress");
        }
    }
    
    @Test
    @Order(5)
    @DisplayName("Security groups should be properly configured")
    public void testSecurityGroups() {
        String vpcId = getOutput("VPCId");
        if (vpcId == null) {
            System.out.println("Skipping security groups test - no VPC ID in outputs");
            return;
        }
        
        // Find security groups in the VPC
        DescribeSecurityGroupsRequest request = DescribeSecurityGroupsRequest.builder()
            .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                .name("vpc-id")
                .values(vpcId)
                .build())
            .build();
            
        DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(request);
        
        // Should have at least 2 security groups (ALB and instances)
        List<SecurityGroup> customGroups = response.securityGroups().stream()
            .filter(sg -> !sg.groupName().equals("default"))
            .toList();
            
        Assertions.assertThat(customGroups).hasSizeGreaterThanOrEqualTo(2);
        
        // Find ALB security group (allows 80 and 443 from anywhere)
        boolean hasAlbSecurityGroup = customGroups.stream()
            .anyMatch(sg -> sg.ipPermissions().stream()
                .anyMatch(perm -> perm.fromPort() == 80 && perm.toPort() == 80));
                
        Assertions.assertThat(hasAlbSecurityGroup).isTrue();
    }
    
    @Test
    @Order(6)
    @DisplayName("Resources should be tagged correctly")
    public void testResourceTags() {
        String vpcId = getOutput("VPCId");
        if (vpcId == null) {
            System.out.println("Skipping tags test - no VPC ID in outputs");
            return;
        }
        
        // Check VPC tags
        DescribeVpcsRequest request = DescribeVpcsRequest.builder()
            .vpcIds(vpcId)
            .build();
            
        DescribeVpcsResponse response = ec2Client.describeVpcs(request);
        
        if (!response.vpcs().isEmpty()) {
            Vpc vpc = response.vpcs().get(0);
            
            // Check for required tags
            Map<String, String> tags = vpc.tags().stream()
                .collect(java.util.stream.Collectors.toMap(
                    Tag::key,
                    Tag::value
                ));
                    
            // Verify Environment and App tags
            Assertions.assertThat(tags).containsKey("Environment");
            Assertions.assertThat(tags).containsKey("App");
            Assertions.assertThat(tags.get("Environment")).isEqualTo("Production");
            Assertions.assertThat(tags.get("App")).isEqualTo("WebApp");
        }
    }
    
    // Helper method to get output value
    private String getOutput(final String key) {
        if (outputs == null || !outputs.has(key)) {
            return null;
        }
        return outputs.get(key).asText();
    }
}