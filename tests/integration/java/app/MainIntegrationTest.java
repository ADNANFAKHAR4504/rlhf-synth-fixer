package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the Main Pulumi program.
 */
public final class MainIntegrationTest {

    @Test
    void testBucketConfigIntegration() {
        // Test configuration integration
        String bucketName = BucketConfig.getDefaultBucketName();
        assertTrue(BucketConfig.isValidBucketName(bucketName));
        
        // Test encryption algorithm is set
        assertEquals("AES256", BucketConfig.getEncryptionAlgorithm());
        
        // Test tags contain required keys
        var tags = BucketConfig.getDefaultTags();
        assertTrue(tags.containsKey("Environment"));
        assertTrue(tags.containsKey("Project"));
        assertTrue(tags.containsKey("ManagedBy"));
    }

    @Test
    @Disabled("Enable for actual infrastructure testing")
    void testInfrastructureDeployment() {
        // Add actual pulumi up/destroy test here
        assertTrue(true);
    }
}