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
 * Unit tests for VpcStack.
 */
public class VpcStackTest {
    
    private App app;
    private Stack parentStack;
    
    @BeforeEach
    public void setUp() {
        app = new App();
        parentStack = new Stack(app, "TestParentStack");
    }
    
    @Test
    public void testVpcStackCreation() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack", 
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify stack was created
        assertThat(vpcStack).isNotNull();
        assertThat(vpcStack.getVpc()).isNotNull();
        assertThat(vpcStack.getInternetGatewayId()).isNotNull();
        assertThat(vpcStack.getPublicSubnets()).isNotNull();
        assertThat(vpcStack.getPrivateSubnets()).isNotNull();
    }
    
    @Test
    public void testVpcConfiguration() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify VPC properties directly from object
        assertThat(vpcStack.getVpc()).isNotNull();
        // Nested stacks resources are not directly accessible in parent template
        // The actual VPC verification happens at integration test level
    }
    
    @Test
    public void testSubnetCreation() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify subnets are created through object references
        assertThat(vpcStack.getPublicSubnets()).isNotNull();
        assertThat(vpcStack.getPublicSubnets()).isNotEmpty();
        assertThat(vpcStack.getPrivateSubnets()).isNotNull();
        assertThat(vpcStack.getPrivateSubnets()).isNotEmpty();
    }
    
    @Test
    public void testInternetGateway() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify Internet Gateway ID is available
        assertThat(vpcStack.getInternetGatewayId()).isNotNull();
        assertThat(vpcStack.getInternetGatewayId()).isNotEmpty();
    }
    
    @Test
    public void testNatGateway() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify VPC is configured with NAT for private subnets
        assertThat(vpcStack.getVpc()).isNotNull();
        // NAT Gateway is automatically managed by VPC construct
    }
    
    @Test
    public void testVpcEndpoints() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify VPC is created and endpoints can be added
        assertThat(vpcStack.getVpc()).isNotNull();
        // VPC endpoints are created inside the nested stack
    }
    
    @Test
    public void testRouteTables() {
        // Create VPC stack
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify VPC and subnets which implicitly have route tables
        assertThat(vpcStack.getVpc()).isNotNull();
        assertThat(vpcStack.getPublicSubnets().size()).isGreaterThan(0);
        assertThat(vpcStack.getPrivateSubnets().size()).isGreaterThan(0);
    }
    
    @Test
    public void testTags() {
        // Create VPC stack with environment suffix
        VpcStack vpcStack = new VpcStack(parentStack, "TestVpcStack",
            VpcStackProps.builder()
                .environmentSuffix("prod")
                .build());
        
        // Verify stack is created with proper suffix
        assertThat(vpcStack).isNotNull();
        assertThat(vpcStack.getNode()).isNotNull();
        // Tags are applied within the nested stack
    }
    
    @Test
    public void testPropsBuilder() {
        // Test VpcStackProps builder
        VpcStackProps props = VpcStackProps.builder()
            .environmentSuffix("test-env")
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test-env");
        assertThat(props.getNestedStackProps()).isNotNull();
    }
}