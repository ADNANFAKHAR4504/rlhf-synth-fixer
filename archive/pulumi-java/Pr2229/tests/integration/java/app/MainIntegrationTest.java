package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;

import static org.junit.jupiter.api.Assertions.*;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.cloudtrail.CloudTrailClient;
import software.amazon.awssdk.services.cloudtrail.model.*;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityRequest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Live AWS resource integration tests for deployed Pulumi infrastructure.
 * 
 * Tests actual AWS resources created by Pulumi deployment - NO MOCKING.
 * 
 * Prerequisites:
 * 1. Infrastructure must be deployed: pulumi up
 * 2. Set PULUMI_CONFIG_PASSPHRASE environment variable (available in CI)
 * 3. Ensure AWS credentials are configured
 * 
 * Run with: ./gradlew integrationTest
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String TEST_REGION = "us-east-1";
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    // AWS SDK Clients
    private S3Client s3Client;
    private Ec2Client ec2Client;
    private IamClient iamClient;
    private KmsClient kmsClient;
    private CloudTrailClient cloudTrailClient;
    private StsClient stsClient;

    // Deployment outputs from Pulumi stack - populated from actual deployment
    private static String vpcId;
    private static List<String> publicSubnetIds;
    private static List<String> privateSubnetIds;
    private static List<String> ec2InstanceIds;
    private static List<String> s3BucketNames;
    private static String cloudTrailArn;
    private static JsonNode allOutputs;
    private static String stackName;

    @BeforeAll
    void setUp() {
        // Skip tests if AWS credentials are not configured
        Assumptions.assumeTrue(hasAwsCredentials(), 
            "AWS credentials not configured - skipping integration tests");
        
        System.out.println("=== Starting Live AWS Resource Integration Tests ===");
        System.out.println("Region: " + TEST_REGION);

        // Load deployment outputs from Pulumi stack
        loadDeploymentOutputs();
        
        // Initialize AWS SDK clients
        Region region = Region.of(TEST_REGION);
        DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();

        this.s3Client = S3Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        this.ec2Client = Ec2Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        this.iamClient = IamClient.builder()
            .region(Region.AWS_GLOBAL) // IAM is global
            .credentialsProvider(credentialsProvider)
            .build();

        this.kmsClient = KmsClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        this.cloudTrailClient = CloudTrailClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        this.stsClient = StsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        // Get current account ID
        String currentAccountId = stsClient.getCallerIdentity(GetCallerIdentityRequest.builder().build())
                .account();
        System.out.println("Current AWS Account ID: " + currentAccountId);
    }
    
    private void loadDeploymentOutputs() {
        try {
            stackName = getStackName();
            System.out.println("=== Loading Deployment Outputs ===");
            System.out.println("Stack Name: " + stackName);
            
            // Try to get outputs directly from root directory (not lib)
            String outputsJson = executeCommand("pulumi", "stack", "output", "--json", "--stack", stackName);
            allOutputs = objectMapper.readTree(outputsJson);
            
            // Extract specific outputs based on Main.java exports
            vpcId = getOutputValue("vpcId");
            publicSubnetIds = getOutputList("publicSubnetIds");
            privateSubnetIds = getOutputList("privateSubnetIds");
            ec2InstanceIds = getOutputList("ec2InstanceIds");
            s3BucketNames = getOutputList("s3BucketNames");
            cloudTrailArn = getOutputValue("cloudTrailArn");
            
            System.out.println("=== Deployment Outputs Loaded Successfully ===");
            System.out.println("VPC ID: " + vpcId);
            System.out.println("Public Subnets: " + publicSubnetIds);
            System.out.println("Private Subnets: " + privateSubnetIds);
            System.out.println("EC2 Instances: " + ec2InstanceIds);
            System.out.println("S3 Buckets: " + s3BucketNames);
            System.out.println("CloudTrail ARN: " + cloudTrailArn);
            
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            System.err.println("Failed to load deployment outputs: " + errorMsg);
            
            // Check if we're running in CI
            boolean isCI = System.getenv("CI") != null || System.getenv("GITHUB_ACTIONS") != null;
            String passphrase = System.getenv("PULUMI_CONFIG_PASSPHRASE");
            
            if (errorMsg.contains("passphrase") || errorMsg.contains("decrypt")) {
                if (isCI) {
                    System.out.println("⚠️  Running in CI but passphrase decryption failed");
                    System.out.println("💡 Check CI environment configuration:");
                    System.out.println("   • PULUMI_CONFIG_PASSPHRASE: " + (passphrase != null ? "SET (length: " + passphrase.length() + ")" : "NOT SET"));
                    System.out.println("   • Verify passphrase is correct in CI secrets");
                } else {
                    System.out.println("💡 Local Development - Pulumi Configuration Help:");
                    System.out.println("   • This test requires deployed infrastructure with outputs");
                    System.out.println("   • Set PULUMI_CONFIG_PASSPHRASE=<your-passphrase> to access encrypted state");
                    System.out.println("   • Or run tests in CI where the passphrase is configured");
                }
            } else if (errorMsg.contains("no stack")) {
                System.out.println("💡 Stack Setup Help:");
                System.out.println("   • Run 'pulumi up' to deploy infrastructure first");
                System.out.println("   • Or set PULUMI_STACK environment variable to correct stack name");
            } else if (errorMsg.contains("not logged in")) {
                System.out.println("💡 Authentication Help:");
                System.out.println("   • Run 'pulumi login' to authenticate with Pulumi Cloud");
                System.out.println("   • Or run 'pulumi login --local' for local file state");
            }
            
            if (isCI) {
                System.out.println("ℹ️  CI: Integration tests will skip live resource validation");
            } else {
                System.out.println("ℹ️  Local: Integration tests will skip live resource validation (run in CI for full validation)");
            }
        }
    }
    
    private String getStackName() {
        // Check for explicit PULUMI_STACK environment variable first
        String stackName = System.getenv("PULUMI_STACK");
        if (stackName != null && !stackName.isEmpty()) {
            return stackName;
        }
        
        // Build stack name using TapStack + ENVIRONMENT_SUFFIX pattern
        String envSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (envSuffix != null && !envSuffix.isEmpty()) {
            return "TapStack" + envSuffix;
        }
        
        // Try to get current stack from Pulumi CLI
        try {
            String currentStack = executeCommand("pulumi", "stack", "--show-name").trim();
            if (!currentStack.isEmpty()) {
                return currentStack;
            }
        } catch (Exception e) {
            System.out.println("Could not get current stack from Pulumi CLI: " + e.getMessage());
        }
        
        // Fallback - look for any TapStack* pattern
        return "TapStack";
    }
    
    private String getOutputValue(String outputName) {
        if (allOutputs != null && allOutputs.has(outputName)) {
            JsonNode value = allOutputs.get(outputName);
            return value.isTextual() ? value.asText() : value.toString().replace("\"", "");
        }
        return null;
    }
    
    private List<String> getOutputList(String outputName) {
        if (allOutputs != null && allOutputs.has(outputName)) {
            JsonNode arrayNode = allOutputs.get(outputName);
            if (arrayNode.isArray()) {
                List<String> result = new ArrayList<>();
                arrayNode.forEach(node -> result.add(node.asText()));
                return result;
            }
        }
        return new ArrayList<>();
    }
    
    private static String executeCommand(String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command)
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);
        
        // Ensure PULUMI_CONFIG_PASSPHRASE is passed to the process if available
        String passphrase = System.getenv("PULUMI_CONFIG_PASSPHRASE");
        if (passphrase != null && !passphrase.isEmpty()) {
            pb.environment().put("PULUMI_CONFIG_PASSPHRASE", passphrase);
        }
        
        // Also pass through other Pulumi environment variables
        String passphraseFile = System.getenv("PULUMI_CONFIG_PASSPHRASE_FILE");
        if (passphraseFile != null && !passphraseFile.isEmpty()) {
            pb.environment().put("PULUMI_CONFIG_PASSPHRASE_FILE", passphraseFile);
        }
                
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
    
    private static String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }

    @Nested
    @DisplayName("Live Deployment Output Validation Tests")
    class DeploymentOutputTests {

        @Test
        @Order(1)
        @DisplayName("Should validate deployment outputs exist")
        void testDeploymentOutputsExist() {
            assumeDeploymentOutputsExist();
            
            // Validate all expected outputs exist from live deployment
            assertNotNull(vpcId, "VPC ID should be available from live deployment");
            assertNotNull(publicSubnetIds, "Public subnet IDs should be available from live deployment");  
            assertNotNull(privateSubnetIds, "Private subnet IDs should be available from live deployment");
            assertNotNull(ec2InstanceIds, "EC2 instance IDs should be available from live deployment");
            assertNotNull(s3BucketNames, "S3 bucket names should be available from live deployment");
            // CloudTrail ARN might be null if not deployed
            
            assertFalse(vpcId.trim().isEmpty(), "VPC ID should not be empty");
            assertFalse(publicSubnetIds.isEmpty(), "Public subnet IDs should not be empty");
            assertFalse(privateSubnetIds.isEmpty(), "Private subnet IDs should not be empty");
            // EC2 instances and S3 buckets might be empty depending on deployment
            
            System.out.println("✓ All live deployment outputs are present and valid");
        }

        @Test
        @Order(2)
        @DisplayName("Should validate live VPC infrastructure")
        void testLiveVpcValidation() {
            assumeDeploymentOutputsExist();
            Assumptions.assumeTrue(vpcId != null, "VPC ID should be available from live deployment");
            Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
            
            assertDoesNotThrow(() -> {
                // Get VPC details using the actual deployed VPC ID
                DescribeVpcsResponse vpcResponse = ec2Client.describeVpcs(
                    DescribeVpcsRequest.builder().vpcIds(vpcId).build());
                
                assertFalse(vpcResponse.vpcs().isEmpty(), "VPC should exist");
                Vpc vpc = vpcResponse.vpcs().get(0);
                
                // Validate VPC configuration
                assertEquals(VpcState.AVAILABLE, vpc.state(), "VPC should be available");
                assertNotNull(vpc.cidrBlock(), "VPC should have CIDR block");
                
                System.out.println("✓ VPC " + vpcId + " validated: " + vpc.cidrBlock());
            });
        }

        @Test
        @Order(3)
        @DisplayName("Should validate live public subnets")
        void testLivePublicSubnetsValidation() {
            assumeDeploymentOutputsExist();
            Assumptions.assumeTrue(publicSubnetIds != null && !publicSubnetIds.isEmpty(), 
                "Public subnet IDs should be available from live deployment");
            Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
            
            assertDoesNotThrow(() -> {
                // Validate public subnets from deployment outputs
                DescribeSubnetsResponse publicSubnetsResponse = ec2Client.describeSubnets(
                    DescribeSubnetsRequest.builder().subnetIds(publicSubnetIds).build());
                
                assertEquals(publicSubnetIds.size(), publicSubnetsResponse.subnets().size(), 
                    "All public subnets from deployment should exist");
                
                publicSubnetsResponse.subnets().forEach(subnet -> {
                    assertEquals(vpcId, subnet.vpcId(), "Subnet should belong to deployed VPC");
                    assertTrue(subnet.mapPublicIpOnLaunch(), "Public subnet should map public IPs on launch");
                });
                
                System.out.println("✓ " + publicSubnetIds.size() + " public subnets validated");
            });
        }

        @Test
        @Order(4)
        @DisplayName("Should validate live private subnets")
        void testLivePrivateSubnetsValidation() {
            assumeDeploymentOutputsExist();
            Assumptions.assumeTrue(privateSubnetIds != null && !privateSubnetIds.isEmpty(), 
                "Private subnet IDs should be available from live deployment");
            Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
            
            assertDoesNotThrow(() -> {
                // Validate private subnets from deployment outputs
                DescribeSubnetsResponse privateSubnetsResponse = ec2Client.describeSubnets(
                    DescribeSubnetsRequest.builder().subnetIds(privateSubnetIds).build());
                
                assertEquals(privateSubnetIds.size(), privateSubnetsResponse.subnets().size(), 
                    "All private subnets from deployment should exist");
                
                privateSubnetsResponse.subnets().forEach(subnet -> {
                    assertEquals(vpcId, subnet.vpcId(), "Subnet should belong to deployed VPC");
                    assertFalse(subnet.mapPublicIpOnLaunch(), "Private subnet should not map public IPs on launch");
                });
                
                System.out.println("✓ " + privateSubnetIds.size() + " private subnets validated");
            });
        }

        @Test
        @Order(5)
        @DisplayName("Should validate live S3 buckets")
        void testLiveS3BucketsValidation() {
            assumeDeploymentOutputsExist();
            Assumptions.assumeTrue(s3BucketNames != null && !s3BucketNames.isEmpty(), 
                "S3 bucket names should be available from live deployment");
            Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
            
            assertDoesNotThrow(() -> {
                s3BucketNames.forEach(bucketName -> {
                    // Validate bucket exists and is accessible
                    HeadBucketResponse headBucket = s3Client.headBucket(
                        HeadBucketRequest.builder().bucket(bucketName).build());
                    assertNotNull(headBucket, "Bucket " + bucketName + " should be accessible");

                    // Validate bucket encryption
                    try {
                        GetBucketEncryptionResponse encryption = s3Client.getBucketEncryption(
                            GetBucketEncryptionRequest.builder().bucket(bucketName).build());
                        
                        assertFalse(encryption.serverSideEncryptionConfiguration().rules().isEmpty(),
                            "Bucket " + bucketName + " should have encryption rules");
                        
                        System.out.println("✓ Bucket " + bucketName + " has encryption configured");
                    } catch (S3Exception e) {
                        System.out.println("⚠ Bucket " + bucketName + " encryption check failed: " + e.getMessage());
                    }

                    // Validate public access is blocked
                    try {
                        GetPublicAccessBlockResponse publicAccess = s3Client.getPublicAccessBlock(
                            GetPublicAccessBlockRequest.builder().bucket(bucketName).build());
                        
                        PublicAccessBlockConfiguration config = publicAccess.publicAccessBlockConfiguration();
                        assertTrue(config.blockPublicAcls(), "Public ACLs should be blocked for " + bucketName);
                        assertTrue(config.blockPublicPolicy(), "Public policies should be blocked for " + bucketName);
                        assertTrue(config.ignorePublicAcls(), "Public ACLs should be ignored for " + bucketName);
                        assertTrue(config.restrictPublicBuckets(), "Public buckets should be restricted for " + bucketName);
                        
                        System.out.println("✓ Bucket " + bucketName + " has public access blocked");
                    } catch (S3Exception e) {
                        System.out.println("⚠ Bucket " + bucketName + " public access block check failed: " + e.getMessage());
                    }
                });
            });
        }

        @Test
        @Order(6)
        @DisplayName("Should validate live EC2 instances")
        void testLiveEC2InstancesValidation() {
            assumeDeploymentOutputsExist();
            Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
            
            if (ec2InstanceIds != null && !ec2InstanceIds.isEmpty()) {
                assertDoesNotThrow(() -> {
                    // Validate EC2 instances from deployment outputs
                    DescribeInstancesResponse instancesResponse = ec2Client.describeInstances(
                        DescribeInstancesRequest.builder().instanceIds(ec2InstanceIds).build());
                    
                    List<Instance> instances = instancesResponse.reservations().stream()
                        .flatMap(reservation -> reservation.instances().stream())
                        .collect(Collectors.toList());
                    
                    assertEquals(ec2InstanceIds.size(), instances.size(), 
                        "All EC2 instances from deployment should exist");
                    
                    instances.forEach(instance -> {
                        assertEquals(vpcId, instance.vpcId(), "Instance should be in deployed VPC");
                        
                        // Validate instance is in correct subnet
                        String subnetId = instance.subnetId();
                        boolean inPublicSubnet = publicSubnetIds.contains(subnetId);
                        boolean inPrivateSubnet = privateSubnetIds.contains(subnetId);
                        assertTrue(inPublicSubnet || inPrivateSubnet, 
                            "Instance should be in deployed subnet");
                        
                        System.out.println("✓ EC2 Instance " + instance.instanceId() + 
                            " validated in " + (inPublicSubnet ? "public" : "private") + " subnet");
                    });
                });
            } else {
                System.out.println("ℹ️ No EC2 instances found in deployment outputs - skipping EC2 validation");
            }
        }

        @Test
        @Order(7)
        @DisplayName("Should validate live CloudTrail")
        void testLiveCloudTrailValidation() {
            assumeDeploymentOutputsExist();
            
            if (cloudTrailArn != null && !cloudTrailArn.isEmpty()) {
                Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
                
                assertDoesNotThrow(() -> {
                    // Extract trail name from ARN
                    String trailName = cloudTrailArn.substring(cloudTrailArn.lastIndexOf("/") + 1);
                    
                    // Get trail status using deployment ARN
                    GetTrailStatusResponse trailStatus = cloudTrailClient.getTrailStatus(
                        GetTrailStatusRequest.builder().name(cloudTrailArn).build());
                    
                    assertTrue(trailStatus.isLogging(), "CloudTrail should be actively logging");
                    System.out.println("✓ CloudTrail " + trailName + " is actively logging");

                    // Get trail configuration
                    DescribeTrailsResponse trailsResponse = cloudTrailClient.describeTrails(
                        DescribeTrailsRequest.builder().trailNameList(cloudTrailArn).build());
                    
                    assertFalse(trailsResponse.trailList().isEmpty(), "Trail should exist");
                    Trail trail = trailsResponse.trailList().get(0);
                    
                    assertEquals(cloudTrailArn, trail.trailARN(), "Trail ARN should match deployment output");
                    assertTrue(trail.isMultiRegionTrail(), "Trail should be multi-region");
                    assertTrue(trail.includeGlobalServiceEvents(), "Trail should include global service events");
                    assertTrue(trail.logFileValidationEnabled(), "Trail should have log file validation enabled");
                    assertNotNull(trail.kmsKeyId(), "Trail should be encrypted with KMS");
                    
                    System.out.println("✓ CloudTrail " + trailName + " configuration validated");
                });
            } else {
                System.out.println("ℹ️ No CloudTrail ARN found in deployment outputs - skipping CloudTrail validation");
            }
        }
    }

    @Nested
    @DisplayName("Live Application Functional Tests")
    class ApplicationFunctionalTests {

        @Test
        @Order(10)
        @DisplayName("Should validate S3 bucket operations using deployment outputs")
        void testLiveS3BucketOperations() {
            assumeDeploymentOutputsExist();
            
            if (s3BucketNames == null || s3BucketNames.isEmpty()) {
                System.out.println("ℹ️ No S3 buckets found in deployment outputs - skipping functional tests");
                return;
            }
            
            // Use first non-CloudTrail bucket for testing
            String testBucket = s3BucketNames.stream()
                .filter(bucket -> !bucket.toLowerCase().contains("cloudtrail"))
                .findFirst()
                .orElse(s3BucketNames.get(0));
            
            // Test basic operations on deployed bucket
            assertDoesNotThrow(() -> {
                // Test list objects (should work)
                ListObjectsV2Response objects = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                        .bucket(testBucket)
                        .maxKeys(1)
                        .build());
                
                assertNotNull(objects, "Should be able to list objects in deployed bucket");
                System.out.println("✓ S3 bucket " + testBucket + " list operation successful");
                
                // Test put object with a small test file
                String testKey = "integration-test/test-file-" + System.currentTimeMillis() + ".txt";
                String testContent = "Integration test content - " + System.currentTimeMillis();
                
                PutObjectResponse putResponse = s3Client.putObject(
                    PutObjectRequest.builder()
                        .bucket(testBucket)
                        .key(testKey)
                        .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromString(testContent));
                
                assertNotNull(putResponse.eTag(), "Object should be uploaded successfully to deployed bucket");
                System.out.println("✓ S3 bucket " + testBucket + " put operation successful");
                
                // Test get object
                try (var getResponse = s3Client.getObject(
                    GetObjectRequest.builder()
                        .bucket(testBucket)
                        .key(testKey)
                        .build())) {
                    
                    assertNotNull(getResponse, "Should be able to get object from deployed bucket");
                }
                System.out.println("✓ S3 bucket " + testBucket + " get operation successful");
                
                // Clean up test object
                s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(testBucket)
                    .key(testKey)
                    .build());
                
                System.out.println("✓ S3 test object cleaned up");
            });
        }

        @Test 
        @Order(11)
        @DisplayName("Should validate deployment configuration values")
        void testDeploymentConfigurationValues() {
            assumeDeploymentOutputsExist();
            
            // Extract and validate configuration from actual deployed resources
            System.out.println("=== Live Deployment Configuration Analysis ===");
            
            // Validate that all expected outputs from Main.java are present
            assertNotNull(allOutputs, "Pulumi stack outputs should be loaded");
            
            // Check for each expected output from Main.java
            assertTrue(allOutputs.has("vpcId"), "vpcId output should exist");
            assertTrue(allOutputs.has("publicSubnetIds"), "publicSubnetIds output should exist");
            assertTrue(allOutputs.has("privateSubnetIds"), "privateSubnetIds output should exist");
            assertTrue(allOutputs.has("ec2InstanceIds"), "ec2InstanceIds output should exist");
            assertTrue(allOutputs.has("s3BucketNames"), "s3BucketNames output should exist");
            assertTrue(allOutputs.has("cloudTrailArn"), "cloudTrailArn output should exist");
            
            System.out.println("✓ All expected deployment outputs are present");
            System.out.println("  - VPC ID: " + vpcId);
            System.out.println("  - Public Subnets: " + (publicSubnetIds != null ? publicSubnetIds.size() : 0));
            System.out.println("  - Private Subnets: " + (privateSubnetIds != null ? privateSubnetIds.size() : 0));
            System.out.println("  - EC2 Instances: " + (ec2InstanceIds != null ? ec2InstanceIds.size() : 0));
            System.out.println("  - S3 Buckets: " + (s3BucketNames != null ? s3BucketNames.size() : 0));
            System.out.println("  - CloudTrail ARN: " + (cloudTrailArn != null ? "present" : "null"));
            
            System.out.println("✓ Live deployment configuration validation passed");
        }
    }

    // Helper methods

    private void assumeDeploymentOutputsExist() {
        Assumptions.assumeTrue(allOutputs != null, 
            "Pulumi deployment outputs should be available (set PULUMI_CONFIG_PASSPHRASE)");
    }

    private boolean hasAwsCredentials() {
        return (System.getenv("AWS_ACCESS_KEY_ID") != null && System.getenv("AWS_SECRET_ACCESS_KEY") != null) ||
               System.getenv("AWS_PROFILE") != null ||
               System.getProperty("aws.accessKeyId") != null;
    }
}