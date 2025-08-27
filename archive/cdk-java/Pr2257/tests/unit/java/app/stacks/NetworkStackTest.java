package app.stacks;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;

/**
 * Unit tests for NetworkStack
 */
public class NetworkStackTest {

    private App app;
    private Stack stack;

    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new Stack(app, "TestStack");
    }

    @Test
    public void testNetworkStackCreation() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
        
        NetworkStack networkStack = new NetworkStack(app, "TestNetworkStack", stackProps);
        
        assertThat(networkStack).isNotNull();
        assertThat(networkStack.getVpc()).isNotNull();
        assertThat(networkStack.getEcsSecurityGroup()).isNotNull();
        assertThat(networkStack.getRdsSecurityGroup()).isNotNull();
    }

    @Test
    public void testNetworkStackWithNullProps() {
        NetworkStack networkStack = new NetworkStack(app, "TestNetworkStack", null);
        
        assertThat(networkStack).isNotNull();
        assertThat(networkStack.getVpc()).isNotNull();
        assertThat(networkStack.getEcsSecurityGroup()).isNotNull();
        assertThat(networkStack.getRdsSecurityGroup()).isNotNull();
    }

    @Test
    public void testNetworkStackProperties() {
        NetworkStack networkStack = new NetworkStack(app, "TestNetworkStack", null);
        
        IVpc vpc = networkStack.getVpc();
        ISecurityGroup ecsSecurityGroup = networkStack.getEcsSecurityGroup();
        ISecurityGroup rdsSecurityGroup = networkStack.getRdsSecurityGroup();
        
        assertThat(vpc).isNotNull();
        assertThat(ecsSecurityGroup).isNotNull();
        assertThat(rdsSecurityGroup).isNotNull();
        
        // Verify that the security groups are not null
        assertThat(ecsSecurityGroup).isNotEqualTo(rdsSecurityGroup);
    }

    @Test
    public void testNetworkStackWithEnvironmentSuffix() {
        // Set environment variable
        System.setProperty("ENVIRONMENT_SUFFIX", "test");
        
        NetworkStack networkStack = new NetworkStack(app, "TestNetworkStack", null);
        
        assertThat(networkStack).isNotNull();
        assertThat(networkStack.getVpc()).isNotNull();
        assertThat(networkStack.getEcsSecurityGroup()).isNotNull();
        assertThat(networkStack.getRdsSecurityGroup()).isNotNull();
        
        // Clean up
        System.clearProperty("ENVIRONMENT_SUFFIX");
    }
}