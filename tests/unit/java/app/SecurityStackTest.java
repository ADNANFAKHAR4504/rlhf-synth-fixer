package app;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Unit tests for the SecurityStack CDK stack.
 * 
 * These tests verify the SecurityStack can be instantiated and has the expected structure.
 */
public class SecurityStackTest {

    /**
     * Test that SecurityStack can be instantiated without throwing exceptions.
     */
    @Test
    public void testSecurityStackCreation() {
        App app = new App();
        String environmentSuffix = "test";
        
        assertDoesNotThrow(() -> {
            SecurityStack stack = new SecurityStack(app, "TestStack", 
                StackProps.builder()
                    .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                    .build(), 
                environmentSuffix);
            
            // Verify the stack was created
            assertNotNull(stack);
        });
    }
    
    /**
     * Test SecurityStack getter methods.
     */
    @Test
    public void testSecurityStackGetters() {
        App app = new App();
        String environmentSuffix = "test";
        
        SecurityStack stack = new SecurityStack(app, "TestStack", 
            StackProps.builder()
                .env(Environment.builder()
                    .account("123456789012")
                    .region("us-east-1")
                    .build())
                .build(), 
            environmentSuffix);
        
        // Test getter methods exist and return non-null values
        assertNotNull(stack.getVpc());
        assertNotNull(stack.getEcsKmsKey());
        assertNotNull(stack.getRdsKmsKey());
        assertNotNull(stack.getS3KmsKey());
    }
    
    /**
     * Test SecurityStack inheritance.
     */
    @Test
    public void testSecurityStackInheritance() {
        // Verify SecurityStack extends Stack
        assertTrue(software.amazon.awscdk.Stack.class.isAssignableFrom(SecurityStack.class));
    }
    
    /**
     * Test SecurityStack with different environment suffixes.
     */
    @Test
    public void testSecurityStackWithDifferentSuffixes() {
        App app = new App();
        String[] suffixes = {"dev", "staging", "prod"};
        
        for (String suffix : suffixes) {
            assertDoesNotThrow(() -> {
                SecurityStack stack = new SecurityStack(app, "TestStack-" + suffix, 
                    StackProps.builder()
                        .env(Environment.builder()
                            .account("123456789012")
                            .region("us-east-1")
                            .build())
                        .build(), 
                    suffix);
                
                assertNotNull(stack);
            }, "SecurityStack should be created successfully with suffix: " + suffix);
        }
    }
}