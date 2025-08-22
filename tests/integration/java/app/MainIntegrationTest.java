package app;

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
import software.amazon.awssdk.services.iam.model.*;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.*;
import software.amazon.awssdk.services.cloudtrail.CloudTrailClient;
import software.amazon.awssdk.services.cloudtrail.model.*;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityRequest;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Comprehensive Integration tests for deployed infrastructure components.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String TEST_REGION = System.getenv("AWS_DEFAULT_REGION") != null ? 
        System.getenv("AWS_DEFAULT_REGION") : "us-east-1";
    private static final String PROJECT_TAG_VALUE = System.getenv("PROJECT_NAME") != null ?
        System.getenv("PROJECT_NAME") : "SecureInfrastructure";
    
    // AWS SDK Clients
    private S3Client s3Client;
    private Ec2Client ec2Client;
    private IamClient iamClient;
    private KmsClient kmsClient;
    private CloudTrailClient cloudTrailClient;

    // Discovered resources
    private List<String> discoveredVpcs;
    private List<String> discoveredBuckets;
    private List<String> discoveredKmsKeys;
    private List<String> discoveredCloudTrails;

    @BeforeAll
    void setUp() {
        // Skip all tests if live testing is not explicitly enabled
        Assumptions.assumeTrue(isLiveTestingEnabled(), 
            "Live AWS testing not enabled. Set ENABLE_LIVE_TESTS=true to run these tests.");
        
        // Skip tests if AWS credentials are not configured
        Assumptions.assumeTrue(isAwsConfigured(), 
            "AWS credentials not configured - skipping integration tests");
        
        System.out.println("=== Starting AWS Resource Validation Tests ===");
        System.out.println("Region: " + TEST_REGION);
        System.out.println("Project Tag: " + PROJECT_TAG_VALUE);

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

        CloudWatchLogsClient cloudWatchLogsClient = CloudWatchLogsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        StsClient stsClient = StsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        // Get current account ID
        String currentAccountId = stsClient.getCallerIdentity(GetCallerIdentityRequest.builder().build())
                .account();
        System.out.println("Current AWS Account ID: " + currentAccountId);

        // Discover existing resources
        discoverExistingResources();
    }

    private void discoverExistingResources() {
        System.out.println("\n--- Discovering Existing Resources ---");
        
        // Discover VPCs
        discoveredVpcs = ec2Client.describeVpcs(DescribeVpcsRequest.builder()
            .filters(Filter.builder()
                .name("tag:Project")
                .values(PROJECT_TAG_VALUE)
                .build())
            .build())
            .vpcs()
            .stream()
            .map(Vpc::vpcId)
            .collect(Collectors.toList());
        System.out.println("Discovered VPCs: " + discoveredVpcs);

        // Discover S3 buckets
        discoveredBuckets = s3Client.listBuckets()
            .buckets()
            .stream()
            .map(Bucket::name)
            .filter(bucketName -> {
                try {
                    GetBucketTaggingResponse tagging = s3Client.getBucketTagging(
                        GetBucketTaggingRequest.builder().bucket(bucketName).build());
                    return tagging.tagSet().stream()
                        .anyMatch(tag -> "Project".equals(tag.key()) && 
                                PROJECT_TAG_VALUE.equals(tag.value()));
                } catch (Exception e) {
                    return false; // No tags or access denied
                }
            })
            .collect(Collectors.toList());
        System.out.println("Discovered S3 Buckets: " + discoveredBuckets);

        // Discover KMS keys
        discoveredKmsKeys = kmsClient.listKeys().keys().stream()
            .map(KeyListEntry::keyId)
            .filter(keyId -> {
                try {
                    ListResourceTagsResponse tags = kmsClient.listResourceTags(
                        ListResourceTagsRequest.builder().keyId(keyId).build());
                    return tags.tags().stream()
                        .anyMatch(tag -> "Project".equals(tag.tagKey()) && 
                                PROJECT_TAG_VALUE.equals(tag.tagValue()));
                } catch (Exception e) {
                    return false;
                }
            })
            .collect(Collectors.toList());
        System.out.println("Discovered KMS Keys: " + discoveredKmsKeys);

        // Discover CloudTrails
        discoveredCloudTrails = cloudTrailClient.describeTrails().trailList().stream()
            .filter(trail -> trail.name().contains(PROJECT_TAG_VALUE.toLowerCase()) ||
                           (trail.trailARN() != null && trail.trailARN().contains(PROJECT_TAG_VALUE)))
            .map(Trail::name)
            .collect(Collectors.toList());
        System.out.println("Discovered CloudTrails: " + discoveredCloudTrails);

        // Discover EC2 instances
        List<String> discoveredInstances = ec2Client.describeInstances(DescribeInstancesRequest.builder()
                        .filters(Filter.builder()
                                        .name("tag:Project")
                                        .values(PROJECT_TAG_VALUE)
                                        .build(),
                                Filter.builder()
                                        .name("instance-state-name")
                                        .values("running", "pending", "stopping", "stopped")
                                        .build())
                        .build())
                .reservations()
                .stream()
                .flatMap(reservation -> reservation.instances().stream())
                .map(Instance::instanceId)
                .toList();
        System.out.println("Discovered EC2 Instances: " + discoveredInstances);

        System.out.println("--- Resource Discovery Complete ---\n");
    }

    @Nested
    @DisplayName("Resource Existence Validation Tests")
    class ResourceExistenceTests {

        @Test
        @Order(1)
        @DisplayName("Should validate VPC infrastructure exists and is properly configured")
        void shouldValidateVpcInfrastructure() {
            assumeResourcesExist();
            assertFalse(discoveredVpcs.isEmpty(), "At least one VPC should exist with project tag");

            discoveredVpcs.forEach(vpcId -> {
                // Get VPC details
                DescribeVpcsResponse vpcResponse = ec2Client.describeVpcs(
                    DescribeVpcsRequest.builder().vpcIds(vpcId).build());
                
                assertFalse(vpcResponse.vpcs().isEmpty(), "VPC should exist");
                Vpc vpc = vpcResponse.vpcs().get(0);
                
                // Validate VPC configuration
                assertEquals(VpcState.AVAILABLE, vpc.state(), "VPC should be available");
                assertNotNull(vpc.cidrBlock(), "VPC should have CIDR block");
                
                System.out.println("✓ VPC " + vpcId + " validated: " + vpc.cidrBlock());

                // Validate subnets exist in this VPC
                DescribeSubnetsResponse subnetsResponse = ec2Client.describeSubnets(
                    DescribeSubnetsRequest.builder()
                        .filters(Filter.builder().name("vpc-id").values(vpcId).build())
                        .build());
                
                assertFalse(subnetsResponse.subnets().isEmpty(), "VPC should have subnets");
                System.out.println("✓ VPC " + vpcId + " has " + subnetsResponse.subnets().size() + " subnets");
            });
        }

        @Test
        @Order(2)
        @DisplayName("Should validate S3 storage infrastructure with proper encryption")
        void shouldValidateS3Storage() {
            assumeResourcesExist();
            assertFalse(discoveredBuckets.isEmpty(), "At least one S3 bucket should exist with project tag");

            discoveredBuckets.forEach(bucketName -> {
                // Validate bucket exists and is accessible
                HeadBucketResponse headBucket = s3Client.headBucket(
                    HeadBucketRequest.builder().bucket(bucketName).build());
                assertNotNull(headBucket, "Bucket should be accessible");

                // Validate bucket encryption
                try {
                    GetBucketEncryptionResponse encryption = s3Client.getBucketEncryption(
                        GetBucketEncryptionRequest.builder().bucket(bucketName).build());
                    
                    assertFalse(encryption.serverSideEncryptionConfiguration().rules().isEmpty(),
                        "Bucket should have encryption rules");
                    
                    encryption.serverSideEncryptionConfiguration().rules().forEach(rule -> {
                        assertNotNull(rule.applyServerSideEncryptionByDefault(),
                            "Bucket should have default encryption");
                        System.out.println("✓ Bucket " + bucketName + " has encryption: " + 
                            rule.applyServerSideEncryptionByDefault().sseAlgorithm());
                    });
                } catch (S3Exception e) {
                    fail("Bucket " + bucketName + " should have encryption configured: " + e.getMessage());
                }

                // Validate bucket versioning
                try {
                    GetBucketVersioningResponse versioning = s3Client.getBucketVersioning(
                        GetBucketVersioningRequest.builder().bucket(bucketName).build());
                    assertEquals(BucketVersioningStatus.ENABLED, versioning.status(),
                        "Bucket versioning should be enabled");
                    System.out.println("✓ Bucket " + bucketName + " has versioning enabled");
                } catch (S3Exception e) {
                    System.out.println("⚠ Bucket " + bucketName + " versioning check failed: " + e.getMessage());
                }

                // Validate public access is blocked
                try {
                    GetPublicAccessBlockResponse publicAccess = s3Client.getPublicAccessBlock(
                        GetPublicAccessBlockRequest.builder().bucket(bucketName).build());
                    
                    PublicAccessBlockConfiguration config = publicAccess.publicAccessBlockConfiguration();
                    assertTrue(config.blockPublicAcls(), "Public ACLs should be blocked");
                    assertTrue(config.blockPublicPolicy(), "Public policies should be blocked");
                    assertTrue(config.ignorePublicAcls(), "Public ACLs should be ignored");
                    assertTrue(config.restrictPublicBuckets(), "Public buckets should be restricted");
                    
                    System.out.println("✓ Bucket " + bucketName + " has public access blocked");
                } catch (S3Exception e) {
                    System.out.println("⚠ Bucket " + bucketName + " public access block check failed: " + e.getMessage());
                }
            });
        }

        @Test
        @Order(3)
        @DisplayName("Should validate KMS keys exist with proper configuration")
        void shouldValidateKmsKeys() {
            assumeResourcesExist();
            assertFalse(discoveredKmsKeys.isEmpty(), "At least one KMS key should exist with project tag");

            discoveredKmsKeys.forEach(keyId -> {
                // Validate key exists and is enabled
                DescribeKeyResponse keyResponse = kmsClient.describeKey(
                    DescribeKeyRequest.builder().keyId(keyId).build());
                
                KeyMetadata keyMetadata = keyResponse.keyMetadata();
                assertNotNull(keyMetadata, "Key metadata should exist");
                assertEquals(KeyState.ENABLED, keyMetadata.keyState(), "Key should be enabled");
                assertEquals(KeyUsageType.ENCRYPT_DECRYPT, keyMetadata.keyUsage(), "Key should support encryption/decryption");
                
                // Check key rotation status separately
                try {
                    GetKeyRotationStatusResponse rotationStatus = kmsClient.getKeyRotationStatus(
                        GetKeyRotationStatusRequest.builder().keyId(keyId).build());
                    assertTrue(rotationStatus.keyRotationEnabled(), "Key rotation should be enabled");
                } catch (Exception e) {
                    System.out.println("⚠ Could not check rotation for key " + keyId + ": " + e.getMessage());
                }
                
                System.out.println("✓ KMS Key " + keyId + " validated: " + keyMetadata.description());
            });
        }

        @Test
        @Order(4)
        @DisplayName("Should validate CloudTrail audit logging configuration")
        void shouldValidateCloudTrailConfiguration() {
            assumeResourcesExist();
            assertFalse(discoveredCloudTrails.isEmpty(), "At least one CloudTrail should exist");

            discoveredCloudTrails.forEach(trailName -> {
                // Get trail status
                GetTrailStatusResponse trailStatus = cloudTrailClient.getTrailStatus(
                    GetTrailStatusRequest.builder().name(trailName).build());
                
                assertTrue(trailStatus.isLogging(), "CloudTrail should be actively logging");
                System.out.println("✓ CloudTrail " + trailName + " is actively logging");

                // Get trail configuration
                DescribeTrailsResponse trailsResponse = cloudTrailClient.describeTrails(
                    DescribeTrailsRequest.builder().trailNameList(trailName).build());
                
                assertFalse(trailsResponse.trailList().isEmpty(), "Trail should exist");
                Trail trail = trailsResponse.trailList().get(0);
                
                assertTrue(trail.isMultiRegionTrail(), "Trail should be multi-region");
                assertTrue(trail.includeGlobalServiceEvents(), "Trail should include global service events");
                assertTrue(trail.logFileValidationEnabled(), "Trail should have log file validation enabled");
                assertNotNull(trail.kmsKeyId(), "Trail should be encrypted with KMS");
                
                System.out.println("✓ CloudTrail " + trailName + " configuration validated");
            });
        }

        @Test
        @Order(5)
        @DisplayName("Should validate IAM roles and policies exist with least privilege")
        void shouldValidateIamConfiguration() {
            assumeResourcesExist();

            // Look for IAM roles created by our infrastructure
            ListRolesResponse rolesResponse = iamClient.listRoles();
            List<Role> projectRoles = rolesResponse.roles().stream()
                .filter(role -> role.roleName().toLowerCase().contains(PROJECT_TAG_VALUE.toLowerCase()) ||
                              role.description() != null && role.description().contains(PROJECT_TAG_VALUE))
                .toList();
            
            assertFalse(projectRoles.isEmpty(), "At least one IAM role should exist for the project");

            projectRoles.forEach(role -> {
                System.out.println("Found IAM Role: " + role.roleName());
                
                // Validate role has assume role policy
                assertNotNull(role.assumeRolePolicyDocument(), "Role should have assume role policy");
                
                // Get attached policies
                ListAttachedRolePoliciesResponse attachedPolicies = iamClient.listAttachedRolePolicies(
                    ListAttachedRolePoliciesRequest.builder().roleName(role.roleName()).build());
                
                assertFalse(attachedPolicies.attachedPolicies().isEmpty(), 
                    "Role should have at least one attached policy");
                
                System.out.println("✓ IAM Role " + role.roleName() + " has " + 
                    attachedPolicies.attachedPolicies().size() + " attached policies");
            });
        }
    }

    @Nested
    @DisplayName("Resource Interaction and Functional Tests")
    class ResourceInteractionTests {

        @Test
        @Order(10)
        @DisplayName("Should validate S3 bucket operations and access controls")
        void shouldValidateS3BucketOperations() {
            assumeResourcesExist();
            
            String testBucket = discoveredBuckets.stream()
                .filter(bucket -> !bucket.toLowerCase().contains("cloudtrail"))
                .findFirst()
                .orElse(discoveredBuckets.get(0));
            
            // Test basic operations
            try {
                // Test list objects (should work)
                ListObjectsV2Response objects = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                        .bucket(testBucket)
                        .maxKeys(1)
                        .build());
                
                assertNotNull(objects, "Should be able to list objects");
                System.out.println("✓ S3 bucket " + testBucket + " list operation successful");
                
                // Test put object with a small test file
                String testKey = "integration-test/test-file.txt";
                String testContent = "Integration test content - " + System.currentTimeMillis();
                
                PutObjectResponse putResponse = s3Client.putObject(
                    PutObjectRequest.builder()
                        .bucket(testBucket)
                        .key(testKey)
                        .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromString(testContent));
                
                assertNotNull(putResponse.eTag(), "Object should be uploaded successfully");
                System.out.println("✓ S3 bucket " + testBucket + " put operation successful");
                
                // Test get object
                try (var getResponse = s3Client.getObject(
                    GetObjectRequest.builder()
                        .bucket(testBucket)
                        .key(testKey)
                        .build())) {
                    
                    assertNotNull(getResponse, "Should be able to get object");
                }
                System.out.println("✓ S3 bucket " + testBucket + " get operation successful");
                
                // Clean up test object
                s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(testBucket)
                    .key(testKey)
                    .build());
                
                System.out.println("✓ S3 test object cleaned up");
                
            } catch (Exception e) {
                fail("S3 bucket operations should work: " + e.getMessage());
            }
        }
    }

    // Helper methods

    private void assumeResourcesExist() {
        Assumptions.assumeTrue(!discoveredVpcs.isEmpty() || 
                             !discoveredBuckets.isEmpty() || 
                             !discoveredKmsKeys.isEmpty() || 
                             !discoveredCloudTrails.isEmpty(),
            "At least some infrastructure resources should exist for testing");
    }

    private boolean isLiveTestingEnabled() {
        return "true".equalsIgnoreCase(System.getenv("ENABLE_LIVE_TESTS"));
    }

    private boolean isAwsConfigured() {
        return System.getenv("AWS_ACCESS_KEY_ID") != null && 
               System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }
}