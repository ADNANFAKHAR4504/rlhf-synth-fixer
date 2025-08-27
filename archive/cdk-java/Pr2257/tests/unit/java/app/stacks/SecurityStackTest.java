package app.stacks;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.logs.ILogGroup;

/**
 * Unit tests for SecurityStack
 */
public class SecurityStackTest {

    private App app;
    private Stack stack;

    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new Stack(app, "TestStack");
    }

    @Test
    public void testSecurityStackCreation() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
        
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStack", stackProps);
        
        assertThat(securityStack).isNotNull();
        assertThat(securityStack.getKmsKey()).isNotNull();
        assertThat(securityStack.getRdsKmsKey()).isNotNull();
        assertThat(securityStack.getEcsTaskRole()).isNotNull();
        assertThat(securityStack.getEcsExecutionRole()).isNotNull();
        assertThat(securityStack.getEcsLogGroup()).isNotNull();
    }

    @Test
    public void testSecurityStackWithNullProps() {
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStack", null);
        
        assertThat(securityStack).isNotNull();
        assertThat(securityStack.getKmsKey()).isNotNull();
        assertThat(securityStack.getRdsKmsKey()).isNotNull();
        assertThat(securityStack.getEcsTaskRole()).isNotNull();
        assertThat(securityStack.getEcsExecutionRole()).isNotNull();
        assertThat(securityStack.getEcsLogGroup()).isNotNull();
    }

    @Test
    public void testSecurityStackProperties() {
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStack", null);
        
        IKey kmsKey = securityStack.getKmsKey();
        IKey rdsKmsKey = securityStack.getRdsKmsKey();
        Role ecsTaskRole = securityStack.getEcsTaskRole();
        Role ecsExecutionRole = securityStack.getEcsExecutionRole();
        ILogGroup ecsLogGroup = securityStack.getEcsLogGroup();
        
        assertThat(kmsKey).isNotNull();
        assertThat(rdsKmsKey).isNotNull();
        assertThat(ecsTaskRole).isNotNull();
        assertThat(ecsExecutionRole).isNotNull();
        assertThat(ecsLogGroup).isNotNull();
        
        // Verify that the keys are different
        assertThat(kmsKey).isNotEqualTo(rdsKmsKey);
        
        // Verify that the roles are different
        assertThat(ecsTaskRole).isNotEqualTo(ecsExecutionRole);
    }

    @Test
    public void testSecurityStackWithEnvironmentSuffix() {
        // Set environment variable
        System.setProperty("ENVIRONMENT_SUFFIX", "test");
        
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStack", null);
        
        assertThat(securityStack).isNotNull();
        assertThat(securityStack.getKmsKey()).isNotNull();
        assertThat(securityStack.getRdsKmsKey()).isNotNull();
        assertThat(securityStack.getEcsTaskRole()).isNotNull();
        assertThat(securityStack.getEcsExecutionRole()).isNotNull();
        assertThat(securityStack.getEcsLogGroup()).isNotNull();
        
        // Clean up
        System.clearProperty("ENVIRONMENT_SUFFIX");
    }

    @Test
    public void testSecurityStackWithEmptyEnvironmentSuffix() {
        // Set empty environment variable
        System.setProperty("ENVIRONMENT_SUFFIX", "");
        
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStack", null);
        
        assertThat(securityStack).isNotNull();
        assertThat(securityStack.getKmsKey()).isNotNull();
        assertThat(securityStack.getRdsKmsKey()).isNotNull();
        assertThat(securityStack.getEcsTaskRole()).isNotNull();
        assertThat(securityStack.getEcsExecutionRole()).isNotNull();
        assertThat(securityStack.getEcsLogGroup()).isNotNull();
        
        // Clean up
        System.clearProperty("ENVIRONMENT_SUFFIX");
    }
}