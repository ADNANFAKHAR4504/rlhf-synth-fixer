package app.stacks;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;

/**
 * Unit tests for NetworkStack
 */
public class NetworkStackTest {

    @Test
    public void testNetworkStackCreation() {
        App app = new App();
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
        
        NetworkStack stack = new NetworkStack(app, "TestNetworkStack", stackProps);
        
        assertThat(stack).isNotNull();
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getEcsSecurityGroup()).isNotNull();
        assertThat(stack.getRdsSecurityGroup()).isNotNull();
    }
}