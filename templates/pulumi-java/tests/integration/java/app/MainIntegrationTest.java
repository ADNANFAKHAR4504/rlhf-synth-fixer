package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the Main Pulumi program.
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    @Test
    void testBucketConfigIntegration() {
        String bucketName = BucketConfig.getDefaultBucketName();
        assertTrue(BucketConfig.isValidBucketName(bucketName));
        
        assertEquals("AES256", BucketConfig.getEncryptionAlgorithm());
        
        var tags = BucketConfig.getDefaultTags();
        assertTrue(tags.containsKey("Environment"));
        assertTrue(tags.containsKey("Project"));
        assertTrue(tags.containsKey("ManagedBy"));
    }

    /**
     * Test actual infrastructure deployment.
     * Disabled by default to prevent accidental resource creation.
     */
    @Test
    @Disabled("Enable for actual infrastructure testing")
    void testInfrastructureDeployment() {
        // Add actual pulumi up/destroy test here
        assertTrue(true);
    }
}