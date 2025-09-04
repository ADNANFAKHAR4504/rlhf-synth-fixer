package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.services.ec2.Vpc;

/**
 * Unit tests for all builder classes to ensure complete coverage.
 */
public class BuildersTest {
    
    @Test
    public void testVpcStackPropsBuilderAllMethods() {
        // Test all builder methods
        NestedStackProps nestedProps = NestedStackProps.builder()
            .description("Test nested props")
            .build();
        
        VpcStackProps.Builder builder = VpcStackProps.builder();
        
        // Test chaining
        VpcStackProps props = builder
            .environmentSuffix("test-suffix")
            .nestedStackProps(nestedProps)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test-suffix");
        assertThat(props.getNestedStackProps()).isEqualTo(nestedProps);
        
        // Test with different values
        VpcStackProps props2 = VpcStackProps.builder()
            .environmentSuffix("another-suffix")
            .nestedStackProps(null)
            .build();
        
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("another-suffix");
        assertThat(props2.getNestedStackProps()).isNotNull(); // Default created
    }
    
    @Test
    public void testS3StackPropsBuilderAllMethods() {
        // Test all builder methods
        NestedStackProps nestedProps = NestedStackProps.builder()
            .description("S3 nested props")
            .build();
        
        S3StackProps.Builder builder = S3StackProps.builder();
        
        // Test chaining
        S3StackProps props = builder
            .environmentSuffix("s3-test")
            .nestedStackProps(nestedProps)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("s3-test");
        assertThat(props.getNestedStackProps()).isEqualTo(nestedProps);
        
        // Test with null nested props
        S3StackProps props2 = S3StackProps.builder()
            .environmentSuffix("s3-prod")
            .nestedStackProps(null)
            .build();
        
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("s3-prod");
        assertThat(props2.getNestedStackProps()).isNotNull();
    }
    
    @Test
    public void testEventBridgeStackPropsBuilderAllMethods() {
        App app = new App();
        Stack stack = new Stack(app, "TestStack");
        Vpc vpc = Vpc.Builder.create(stack, "TestVpc")
            .maxAzs(2)
            .build();
        
        NestedStackProps nestedProps = NestedStackProps.builder()
            .description("EventBridge nested props")
            .build();
        
        EventBridgeStackProps.Builder builder = EventBridgeStackProps.builder();
        
        // Test all methods
        EventBridgeStackProps props = builder
            .environmentSuffix("event-test")
            .vpc(vpc)
            .nestedStackProps(nestedProps)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("event-test");
        assertThat(props.getVpc()).isEqualTo(vpc);
        assertThat(props.getNestedStackProps()).isEqualTo(nestedProps);
        
        // Test with null nested props
        EventBridgeStackProps props2 = EventBridgeStackProps.builder()
            .environmentSuffix("event-prod")
            .vpc(null)
            .nestedStackProps(null)
            .build();
        
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("event-prod");
        assertThat(props2.getVpc()).isNull();
        assertThat(props2.getNestedStackProps()).isNotNull();
    }
    
    @Test
    public void testVpcStackPropsBuilderEdgeCases() {
        // Test empty string environment suffix
        VpcStackProps props1 = VpcStackProps.builder()
            .environmentSuffix("")
            .build();
        assertThat(props1.getEnvironmentSuffix()).isEqualTo("");
        
        // Test multiple calls to same setter (last one wins)
        VpcStackProps props2 = VpcStackProps.builder()
            .environmentSuffix("first")
            .environmentSuffix("second")
            .environmentSuffix("third")
            .build();
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("third");
        
        // Test builder reuse
        VpcStackProps.Builder builder = VpcStackProps.builder();
        builder.environmentSuffix("reused");
        
        VpcStackProps props3 = builder.build();
        assertThat(props3.getEnvironmentSuffix()).isEqualTo("reused");
    }
    
    @Test
    public void testS3StackPropsBuilderEdgeCases() {
        // Test empty string environment suffix
        S3StackProps props1 = S3StackProps.builder()
            .environmentSuffix("")
            .build();
        assertThat(props1.getEnvironmentSuffix()).isEqualTo("");
        
        // Test multiple calls to same setter
        S3StackProps props2 = S3StackProps.builder()
            .environmentSuffix("first")
            .environmentSuffix("second")
            .build();
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("second");
    }
    
    @Test
    public void testEventBridgeStackPropsBuilderEdgeCases() {
        // Test empty string environment suffix
        EventBridgeStackProps props1 = EventBridgeStackProps.builder()
            .environmentSuffix("")
            .vpc(null)
            .build();
        assertThat(props1.getEnvironmentSuffix()).isEqualTo("");
        assertThat(props1.getVpc()).isNull();
        
        // Test multiple calls to same setter
        EventBridgeStackProps props2 = EventBridgeStackProps.builder()
            .environmentSuffix("first")
            .environmentSuffix("second")
            .vpc(null)
            .build();
        assertThat(props2.getEnvironmentSuffix()).isEqualTo("second");
    }
}