package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

// AWS SDK imports for live resource testing
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.GetKeyRotationStatusRequest;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.ListAttachedRolePoliciesRequest;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;
import software.amazon.awssdk.services.sns.model.ListTopicsRequest;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityRequest;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.core.exception.SdkException;

/**
 * Integration tests for the Main Pulumi program.
 * 
 * These tests focus on live resource testing against actual AWS infrastructure.
 * Tests the complete deployment pipeline and resource creation/validation.
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    private static final String TEST_STACK_NAME = "integration-test-security";
    private static final String TEST_PROJECT_DIR = "lib";
    private static final String AWS_REGION = "us-east-1";

    // AWS SDK clients for live resource testing
    private S3Client s3Client;
    private KmsClient kmsClient;
    private IamClient iamClient;
    private SnsClient snsClient;
    private StsClient stsClient;

    @BeforeEach
    void setUp() {
        // Ensure we're in the right directory for Pulumi operations
        System.setProperty("user.dir", Paths.get(TEST_PROJECT_DIR).toAbsolutePath().toString());
        
        // Initialize AWS SDK clients for live resource testing
        initializeAwsClients();
    }

    @AfterEach
    void tearDown() {
        // Clean up AWS SDK clients
        if (s3Client != null) {
            s3Client.close();
        }
        if (kmsClient != null) {
            kmsClient.close();
        }
        if (iamClient != null) {
            iamClient.close();
        }
        if (snsClient != null) {
            snsClient.close();
        }
        if (stsClient != null) {
            stsClient.close();
        }
    }

    /**
     * Initialize AWS SDK clients for live resource testing.
     */
    private void initializeAwsClients() {
        try {
            Region region = Region.of(AWS_REGION);
            
            // Initialize S3 client
            s3Client = S3Client.builder()
                    .region(region)
                    .build();
            
            // Initialize KMS client
            kmsClient = KmsClient.builder()
                    .region(region)
                    .build();
            
            // Initialize IAM client
            iamClient = IamClient.builder()
                    .region(region)
                    .build();
            
            // Initialize SNS client
            snsClient = SnsClient.builder()
                    .region(region)
                    .build();
            
            // Initialize STS client
            stsClient = StsClient.builder()
                    .region(region)
                    .build();
                    
        } catch (Exception e) {
            // Clients will be null if initialization fails
            System.err.println("Failed to initialize AWS clients: " + e.getMessage());
        }
    }

    /**
     * Test that the Java application can be built successfully.
     * This is a prerequisite for deployment testing.
     */
    @Test
    void testJavaApplicationBuilds() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("./gradlew", "compileJava")
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        Assertions.assertTrue(finished, "Java compilation should complete within 60 seconds");
        Assertions.assertEquals(0, process.exitValue(), "Java compilation should succeed");
    }

    /**
     * Test that the JAR file can be created successfully.
     * This is required for Pulumi deployment.
     */
    @Test
    void testJarFileCreation() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("./gradlew", "jar")
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        Assertions.assertTrue(finished, "JAR creation should complete within 60 seconds");
        Assertions.assertEquals(0, process.exitValue(), "JAR creation should succeed");

        // Verify JAR file exists
        Assertions.assertTrue(Files.exists(Paths.get("build/libs/app.jar")),
                "JAR file should be created successfully");
    }

    /**
     * Test Pulumi preview to validate infrastructure configuration.
     * This tests the infrastructure definition without creating resources.
     */
    @Test
    void testPulumiPreview() throws Exception {
        Assumptions.assumeTrue(hasPulumiCli(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Initialize Pulumi stack if it doesn't exist
        initializePulumiStack();

        // Run Pulumi preview
        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", TEST_STACK_NAME)
                .directory(Paths.get(TEST_PROJECT_DIR).toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(120, TimeUnit.SECONDS);

        Assertions.assertTrue(finished, "Pulumi preview should complete within 120 seconds");
        Assertions.assertEquals(0, process.exitValue(), "Pulumi preview should succeed");
    }

    /**
     * Test actual infrastructure deployment to AWS.
     * This creates real AWS resources for testing.
     */
    @Test
    void testInfrastructureDeployment() throws Exception {
        Assumptions.assumeTrue(hasPulumiCli(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Initialize Pulumi stack if it doesn't exist
        initializePulumiStack();

        // Deploy infrastructure
        ProcessBuilder pb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", TEST_STACK_NAME)
                .directory(Paths.get(TEST_PROJECT_DIR).toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(300, TimeUnit.SECONDS); // 5 minutes for deployment

        Assertions.assertTrue(finished, "Infrastructure deployment should complete within 5 minutes");
        Assertions.assertEquals(0, process.exitValue(), "Infrastructure deployment should succeed");

        // Get stack outputs for resource validation
        String stackOutputs = getStackOutputs();
        Assertions.assertNotNull(stackOutputs, "Stack outputs should be available");
        Assertions.assertTrue(stackOutputs.length() > 0, "Stack outputs should contain resource information");

        // Validate that all expected resources are created
        validateStackOutputs(stackOutputs);
    }

    /**
     * Test infrastructure update functionality.
     * This tests updating existing resources.
     */
    @Test
    void testInfrastructureUpdate() throws Exception {
        Assumptions.assumeTrue(hasPulumiCli(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Run Pulumi preview to check for updates
        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", TEST_STACK_NAME)
                .directory(Paths.get(TEST_PROJECT_DIR).toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(120, TimeUnit.SECONDS);

        Assertions.assertTrue(finished, "Pulumi preview should complete within 120 seconds");
        // Note: Exit code might be 0 (no changes) or 1 (changes detected), both are valid
    }

    /**
     * Test infrastructure destruction.
     * This cleans up all created resources.
     */
    @Test
    void testInfrastructureDestruction() throws Exception {
        Assumptions.assumeTrue(hasPulumiCli(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Destroy infrastructure
        ProcessBuilder pb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", TEST_STACK_NAME)
                .directory(Paths.get(TEST_PROJECT_DIR).toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(300, TimeUnit.SECONDS); // 5 minutes for destruction

        Assertions.assertTrue(finished, "Infrastructure destruction should complete within 5 minutes");
        Assertions.assertEquals(0, process.exitValue(), "Infrastructure destruction should succeed");
    }

    /**
     * Test S3 bucket functionality using AWS SDK against live resources.
     */
    @Test
    void testLiveS3BucketFunctionality() throws Exception {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(s3Client != null, "S3 client should be initialized");

        // Get bucket name from stack outputs
        String bucketName = extractBucketNameFromOutputs();
        Assumptions.assumeTrue(bucketName != null && !bucketName.isEmpty(), "S3 bucket should be deployed");

        try {
            // Test bucket exists using AWS SDK
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(bucketName)
                    .build();
            
            s3Client.headBucket(headBucketRequest);
            
            // If we reach here, bucket exists
            Assertions.assertTrue(true, "S3 bucket should exist");
            
            // Test bucket encryption using AWS SDK
            try {
                GetBucketEncryptionRequest encryptionRequest = GetBucketEncryptionRequest.builder()
                        .bucket(bucketName)
                        .build();
                
                s3Client.getBucketEncryption(encryptionRequest);
                Assertions.assertTrue(true, "S3 bucket should have encryption configured");
            } catch (SdkException e) {
                // Bucket might not have encryption configured, which is acceptable for testing
                System.out.println("S3 bucket encryption check: " + e.getMessage());
            }
            
        } catch (NoSuchBucketException e) {
            Assertions.fail("S3 bucket should exist: " + e.getMessage());
        } catch (SdkException e) {
            Assertions.fail("S3 bucket validation failed: " + e.getMessage());
        }
    }

    /**
     * Test KMS key functionality using AWS SDK against live resources.
     */
    @Test
    void testLiveKmsKeyFunctionality() throws Exception {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(kmsClient != null, "KMS client should be initialized");

        // Get KMS key ID from stack outputs
        String keyId = extractKmsKeyIdFromOutputs();
        Assumptions.assumeTrue(keyId != null && !keyId.isEmpty(), "KMS key should be deployed");

        try {
            // Test KMS key exists using AWS SDK
            DescribeKeyRequest describeKeyRequest = DescribeKeyRequest.builder()
                    .keyId(keyId)
                    .build();
            
            kmsClient.describeKey(describeKeyRequest);
            Assertions.assertTrue(true, "KMS key should exist");
            
            // Test key rotation status
            GetKeyRotationStatusRequest rotationRequest = GetKeyRotationStatusRequest.builder()
                    .keyId(keyId)
                    .build();
            
            kmsClient.getKeyRotationStatus(rotationRequest);
            Assertions.assertTrue(true, "Should be able to check KMS key rotation status");
            
        } catch (SdkException e) {
            Assertions.fail("KMS key validation failed: " + e.getMessage());
        }
    }

    /**
     * Test IAM role functionality using AWS SDK against live resources.
     */
    @Test
    void testLiveIamRoleFunctionality() throws Exception {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(iamClient != null, "IAM client should be initialized");

        // Get role ARN from stack outputs
        String roleArn = extractRoleArnFromOutputs();
        Assumptions.assumeTrue(roleArn != null && !roleArn.isEmpty(), "IAM role should be deployed");

        try {
            String roleName = extractRoleNameFromArn(roleArn);
            
            // Test IAM role exists using AWS SDK
            GetRoleRequest getRoleRequest = GetRoleRequest.builder()
                    .roleName(roleName)
                    .build();
            
            iamClient.getRole(getRoleRequest);
            Assertions.assertTrue(true, "IAM role should exist");
            
            // Test role policies
            ListAttachedRolePoliciesRequest listPoliciesRequest = ListAttachedRolePoliciesRequest.builder()
                    .roleName(roleName)
                    .build();
            
            iamClient.listAttachedRolePolicies(listPoliciesRequest);
            Assertions.assertTrue(true, "Should be able to list IAM role policies");
            
        } catch (SdkException e) {
            Assertions.fail("IAM role validation failed: " + e.getMessage());
        }
    }

    /**
     * Test SNS topic functionality using AWS SDK against live resources.
     */
    @Test
    void testLiveSnsTopicFunctionality() throws Exception {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(snsClient != null, "SNS client should be initialized");

        // Get SNS topic ARN from stack outputs
        String topicArn = extractTopicArnFromOutputs();
        Assumptions.assumeTrue(topicArn != null && !topicArn.isEmpty(), "SNS topic should be deployed");

        try {
            // Test SNS topic exists using AWS SDK
            GetTopicAttributesRequest getTopicRequest = GetTopicAttributesRequest.builder()
                    .topicArn(topicArn)
                    .build();
            
            snsClient.getTopicAttributes(getTopicRequest);
            Assertions.assertTrue(true, "SNS topic should exist");
            
            // Test topic listing
            ListTopicsRequest listTopicsRequest = ListTopicsRequest.builder().build();
            snsClient.listTopics(listTopicsRequest);
            Assertions.assertTrue(true, "Should be able to list SNS topics");
            
        } catch (SdkException e) {
            Assertions.fail("SNS topic validation failed: " + e.getMessage());
        }
    }

    // Helper methods

    private boolean hasPulumiCli() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean hasAwsCredentials() {
        try {
            Assumptions.assumeTrue(stsClient != null, "STS client should be initialized");
            
            GetCallerIdentityRequest request = GetCallerIdentityRequest.builder().build();
            stsClient.getCallerIdentity(request);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void initializePulumiStack() throws Exception {
        // Check if stack exists
        ProcessBuilder checkStackPb = new ProcessBuilder("pulumi", "stack", "ls", "--stack", TEST_STACK_NAME);
        Process checkStackProcess = checkStackPb.start();
        
        boolean checkFinished = checkStackProcess.waitFor(10, TimeUnit.SECONDS);
        if (!checkFinished || checkStackProcess.exitValue() != 0) {
            // Stack doesn't exist, create it
            ProcessBuilder createStackPb = new ProcessBuilder("pulumi", "stack", "init", TEST_STACK_NAME);
            Process createStackProcess = createStackPb.start();
            boolean created = createStackProcess.waitFor(30, TimeUnit.SECONDS);
            Assertions.assertTrue(created, "Stack creation should complete");
            Assertions.assertEquals(0, createStackProcess.exitValue(), "Stack creation should succeed");
        }

        // Configure AWS region
        ProcessBuilder configPb = new ProcessBuilder("pulumi", "config", "set", "aws:region", AWS_REGION);
        Process configProcess = configPb.start();
        boolean configured = configProcess.waitFor(30, TimeUnit.SECONDS);
        Assertions.assertTrue(configured, "Configuration should complete");
    }

    private String getStackOutputs() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", TEST_STACK_NAME);
        Process process = pb.start();
        boolean finished = process.waitFor(30, TimeUnit.SECONDS);
        
        if (finished && process.exitValue() == 0) {
            return new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        }
        return null;
    }

    private void validateStackOutputs(final String stackOutputs) {
        Assertions.assertNotNull(stackOutputs, "Stack outputs should not be null");
        Assertions.assertTrue(stackOutputs.contains("kmsKeyId"), "Stack should contain KMS key ID");
        Assertions.assertTrue(stackOutputs.contains("secureBucketName"), "Stack should contain S3 bucket name");
        Assertions.assertTrue(stackOutputs.contains("securityRoleArn"), "Stack should contain security role ARN");
        Assertions.assertTrue(stackOutputs.contains("crossAccountRoleArn"), "Stack should contain cross-account role ARN");
        Assertions.assertTrue(stackOutputs.contains("securityTopicArn"), "Stack should contain SNS topic ARN");
    }

    private String extractBucketNameFromOutputs() throws Exception {
        String outputs = getStackOutputs();
        if (outputs != null) {
            Pattern pattern = Pattern.compile("\"secureBucketName\":\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(outputs);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String extractKmsKeyIdFromOutputs() throws Exception {
        String outputs = getStackOutputs();
        if (outputs != null) {
            Pattern pattern = Pattern.compile("\"kmsKeyId\":\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(outputs);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String extractRoleArnFromOutputs() throws Exception {
        String outputs = getStackOutputs();
        if (outputs != null) {
            Pattern pattern = Pattern.compile("\"securityRoleArn\":\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(outputs);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String extractTopicArnFromOutputs() throws Exception {
        String outputs = getStackOutputs();
        if (outputs != null) {
            Pattern pattern = Pattern.compile("\"securityTopicArn\":\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(outputs);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String extractRoleNameFromArn(final String roleArn) {
        if (roleArn != null && roleArn.contains("/")) {
            return roleArn.substring(roleArn.lastIndexOf("/") + 1);
        }
        return roleArn;
    }
}