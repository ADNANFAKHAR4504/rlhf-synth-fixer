package app.stacks;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;

/**
 * Unit tests for SecurityStack
 */
public class SecurityStackTest {

    @Test
    public void testSecurityStackCreation() {
        App app = new App();
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
        
        SecurityStack stack = new SecurityStack(app, "TestSecurityStack", stackProps);
        
        assertThat(stack).isNotNull();
        assertThat(stack.getKmsKey()).isNotNull();
        assertThat(stack.getRdsKmsKey()).isNotNull();
        assertThat(stack.getEcsTaskRole()).isNotNull();
        assertThat(stack.getEcsExecutionRole()).isNotNull();
    }
}