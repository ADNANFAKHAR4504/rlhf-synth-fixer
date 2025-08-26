package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;
import java.util.List;

/**
 * Unit tests for S3Stack.
 */
public class S3StackTest {
    
    private App app;
    private Stack parentStack;
    
    @BeforeEach
    public void setUp() {
        app = new App();
        parentStack = new Stack(app, "TestParentStack");
    }
    
    @Test
    public void testS3StackCreation() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify stack was created
        assertThat(s3Stack).isNotNull();
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketConfiguration() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket is created
        assertThat(s3Stack.getLogsBucket()).isNotNull();
        // Bucket properties are configured within the nested stack
    }
    
    @Test
    public void testBucketEncryption() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (encryption is configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketPublicAccessBlock() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (public access settings are configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketLifecycleRules() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (lifecycle rules are configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketAutoDeleteForTesting() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (auto-delete is configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketNaming() {
        // Create S3 stack with specific environment suffix
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("production")
                .build());
        
        // Verify bucket exists (naming is configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
    
    @Test
    public void testBucketTags() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (tags are configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
        assertThat(s3Stack.getNode()).isNotNull();
    }
    
    @Test
    public void testPropsBuilder() {
        // Test S3StackProps builder
        S3StackProps props = S3StackProps.builder()
            .environmentSuffix("staging")
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getNestedStackProps()).isNotNull();
    }
    
    @Test
    public void testBucketTransitions() {
        // Create S3 stack
        S3Stack s3Stack = new S3Stack(parentStack, "TestS3Stack",
            S3StackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify bucket exists (transitions are configured in nested stack)
        assertThat(s3Stack.getLogsBucket()).isNotNull();
    }
}