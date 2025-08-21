package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Map;

/**
 * Unit tests for the Main class and related utilities.
 */
public final class MainTest {

    @Test
    void testMainClassExists() {
        assertNotNull(Main.class);
    }

    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Main.class.getMethod("main", String[].class);
        });
    }

    @Test
    void testDefaultBucketName() {
        String bucketName = BucketConfig.getDefaultBucketName();
        assertNotNull(bucketName);
        assertEquals("java-app-bucket", bucketName);
    }

    @Test
    void testDefaultTags() {
        Map<String, String> tags = BucketConfig.getDefaultTags();
        assertNotNull(tags);
        assertEquals("development", tags.get("Environment"));
        assertEquals("pulumi-java-template", tags.get("Project"));
        assertEquals("pulumi", tags.get("ManagedBy"));
    }

    @Test
    void testBucketNameValidation() {
        assertTrue(BucketConfig.isValidBucketName("valid-bucket-name"));
        assertTrue(BucketConfig.isValidBucketName("test123"));
        
        assertFalse(BucketConfig.isValidBucketName(null));
        assertFalse(BucketConfig.isValidBucketName(""));
        assertFalse(BucketConfig.isValidBucketName("   "));
        assertFalse(BucketConfig.isValidBucketName("InvalidBucket"));
        assertFalse(BucketConfig.isValidBucketName("ab"));
    }

    @Test
    void testEncryptionAlgorithm() {
        String algorithm = BucketConfig.getEncryptionAlgorithm();
        assertEquals("AES256", algorithm);
    }
}