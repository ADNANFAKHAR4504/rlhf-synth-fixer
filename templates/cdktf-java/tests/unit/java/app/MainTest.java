package app;

import com.hashicorp.cdktf.Testing;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.constructs.Construct;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CDKTF Java MainStack template.
 * 
 * These tests validate the stack configuration and resource creation
 * without deploying actual infrastructure using CDKTF's Testing framework.
 */
@DisplayName("CDKTF MainStack Unit Tests")
public class MainTest {

    private MainStack stack;
    private Construct scope;

    @BeforeEach
    void setUp() {
        // Create a test scope using CDKTF Testing framework
        scope = Testing.app();
        stack = new MainStack(scope, "test-stack");
    }

    @Test
    @DisplayName("Should create stack with S3 bucket resource")
    void shouldCreateStackWithS3Bucket() {
        // Test that the stack creates an S3 bucket
        assertNotNull(stack.getBucket(), "Stack should create an S3 bucket");
        
        // Verify bucket configuration
        String bucketName = stack.getBucketName();
        assertNotNull(bucketName, "Bucket should have a name");
        assertTrue(bucketName.contains("cdktf-java-template-bucket"), 
                "Bucket name should contain expected prefix");
        
        // Verify the bucket is properly initialized with construct tree
        assertNotNull(stack.getBucket().getFriendlyUniqueId(), 
                "Bucket should have a unique identifier");
        assertEquals("test-stack", stack.getNode().getId(), 
                "Stack should have correct construct ID");
    }

    @Test
    @DisplayName("Should configure stack with proper resource naming")
    void shouldConfigureProperResourceNaming() {
        // Test that resources follow naming conventions
        String bucketConstructId = stack.getBucket().getNode().getId();
        assertEquals("app-storage-bucket", bucketConstructId, 
                "Bucket construct should have expected ID");
        
        // Test bucket name format with timestamp pattern
        String bucketName = stack.getBucketName();
        assertTrue(bucketName.matches("cdktf-java-template-bucket-\\d+"), 
                "Bucket name should follow expected pattern with timestamp");
        
        // Verify stack can synthesize without errors
        assertDoesNotThrow(() -> {
            Testing.synth(stack);
        }, "Stack should synthesize successfully");
    }
}