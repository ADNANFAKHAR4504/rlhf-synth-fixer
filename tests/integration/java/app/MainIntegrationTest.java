package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.GetBucketTaggingRequest;
import software.amazon.awssdk.services.s3.model.Tag;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for CDKTF Java MainStack template.
 * 
 * These tests validate actual AWS resources deployed via Terraform/CDKTF.
 * They require the stack to be deployed before running tests.
 * 
 * To run these tests:
 * 1. Deploy the stack: cdktf deploy
 * 2. Run tests: ./gradlew integrationTest
 * 3. Destroy when done: cdktf destroy
 */
@DisplayName("CDKTF MainStack Integration Tests")
public class MainIntegrationTest {

    private S3Client s3Client;
    private String bucketName;

    @BeforeEach
    void setUp() {
        s3Client = S3Client.builder()
                .region(Region.US_EAST_1)
                .build();
        
        // In a real scenario, you would retrieve this from Terraform outputs
        // For template purposes, we'll use a pattern-based approach
        // This should be replaced with actual Terraform output retrieval
        bucketName = findDeployedBucket();
    }

    @Test
    @DisplayName("Should validate deployed S3 bucket accessibility")
    void shouldValidateDeployedBucketAccessibility() {
        // Skip test if no bucket found (stack not deployed)
        org.junit.jupiter.api.Assumptions.assumeTrue(bucketName != null, 
            "No deployed CDKTF stack found - skipping integration test");

        // Test that the bucket exists and is accessible
        assertDoesNotThrow(() -> {
            s3Client.headBucket(HeadBucketRequest.builder()
                .bucket(bucketName)
                .build());
        }, "Deployed S3 bucket should be accessible via AWS API");

        // Verify bucket name follows expected pattern
        assertTrue(bucketName.startsWith("cdktf-java-template-bucket-"), 
            "Bucket name should follow CDKTF template naming convention");
    }

    @Test
    @DisplayName("Should validate bucket tags match CDKTF configuration")
    void shouldValidateBucketTags() {
        // Skip test if no bucket found
        org.junit.jupiter.api.Assumptions.assumeTrue(bucketName != null, 
            "No deployed CDKTF stack found - skipping integration test");

        // Retrieve actual bucket tags from AWS
        List<Tag> tags = assertDoesNotThrow(() -> {
            return s3Client.getBucketTagging(GetBucketTaggingRequest.builder()
                .bucket(bucketName)
                .build()).tagSet();
        }, "Should be able to retrieve bucket tags");

        // Convert tags to map for easier validation
        Map<String, String> tagMap = tags.stream()
            .collect(Collectors.toMap(Tag::key, Tag::value));

        // Validate expected tags from MainStack configuration
        assertEquals("development", tagMap.get("Environment"), 
            "Environment tag should match CDKTF configuration");
        assertEquals("cdktf-java-template", tagMap.get("Project"), 
            "Project tag should match CDKTF configuration");
        assertEquals("cdktf", tagMap.get("ManagedBy"), 
            "ManagedBy tag should indicate CDKTF management");
        assertEquals("ApplicationStorage", tagMap.get("Purpose"), 
            "Purpose tag should match CDKTF configuration");
    }

    /**
     * Helper method to find the deployed bucket.
     * In a real implementation, this would query Terraform state or outputs.
     * For template purposes, this is a simplified approach.
     */
    private String findDeployedBucket() {
        try {
            // In practice, you would use Terraform CLI or state queries here
            // This is a simplified pattern matching approach for the template
            var response = s3Client.listBuckets();
            return response.buckets().stream()
                .filter(bucket -> bucket.name().startsWith("cdktf-java-template-bucket-"))
                .map(bucket -> bucket.name())
                .findFirst()
                .orElse(null);
        } catch (Exception e) {
            // If AWS credentials not configured or other issues
            return null;
        }
    }
}