package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Map;

/**
 * Unit tests for the Main class.
 * Run with: ./gradlew test
 */
public class MainTest {

    /**
     * Verify the Main class can be loaded.
     */
    @Test
    void testMainClassExists() {
        assertNotNull(Main.class);
    }

    /**
     * Verify the main method exists with correct signature.
     */
    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Main.class.getDeclaredMethod("main", String[].class);
        });
    }

    /**
     * Test BucketConfig default bucket name.
     */
    @Test
    void testDefaultBucketName() {
        String bucketName = BucketConfig.getDefaultBucketName();
        assertNotNull(bucketName);
        assertEquals("java-app-bucket", bucketName);
    }

    /**
     * Test BucketConfig default tags.
     */
    @Test
    void testDefaultTags() {
        Map<String, String> tags = BucketConfig.getDefaultTags();
        assertNotNull(tags);
        assertEquals("development", tags.get("Environment"));
        assertEquals("pulumi-java-template", tags.get("Project"));
        assertEquals("pulumi", tags.get("ManagedBy"));
    }

    /**
     * Test bucket name validation.
     */
    @Test
    void testBucketNameValidation() {
        assertTrue(BucketConfig.isValidBucketName("valid-bucket-name"));
        assertFalse(BucketConfig.isValidBucketName(null));
        assertFalse(BucketConfig.isValidBucketName(""));
        assertFalse(BucketConfig.isValidBucketName("InvalidBucket"));
    }

    /**
     * Test encryption algorithm.
     */
    @Test
    void testEncryptionAlgorithm() {
        String algorithm = BucketConfig.getEncryptionAlgorithm();
        assertEquals("AES256", algorithm);
    }
}