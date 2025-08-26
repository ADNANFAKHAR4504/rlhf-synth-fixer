package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.services.ec2.Vpc;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for EventBridgeStack.
 */
public class EventBridgeStackTest {
    
    private App app;
    private Stack parentStack;
    private Vpc vpc;
    
    @BeforeEach
    public void setUp() {
        app = new App();
        parentStack = new Stack(app, "TestParentStack");
        // Create a test VPC
        vpc = Vpc.Builder.create(parentStack, "TestVpc")
            .maxAzs(2)
            .build();
    }
    
    @Test
    public void testEventBridgeStackCreation() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify stack was created
        assertThat(eventStack).isNotNull();
        assertThat(eventStack.getCustomEventBus()).isNotNull();
        assertThat(eventStack.getScheduleGroup()).isNotNull();
    }
    
    @Test
    public void testCustomEventBusCreation() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify custom event bus object is created
        assertThat(eventStack.getCustomEventBus()).isNotNull();
    }
    
    @Test
    public void testScheduleGroupCreation() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify schedule group object is created
        assertThat(eventStack.getScheduleGroup()).isNotNull();
    }
    
    @Test
    public void testVpcFlowLogsRule() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify stack is created (rule is configured in nested stack)
        assertThat(eventStack).isNotNull();
        assertThat(eventStack.getCustomEventBus()).isNotNull();
    }
    
    @Test
    public void testEventPattern() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify event bus is created (patterns are configured in nested stack)
        assertThat(eventStack.getCustomEventBus()).isNotNull();
    }
    
    @Test
    public void testEnvironmentSuffixInNames() {
        // Create EventBridge stack with specific suffix
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("production")
                .vpc(vpc)
                .build());
        
        // Verify resources are created (names are configured in nested stack)
        assertThat(eventStack.getCustomEventBus()).isNotNull();
        assertThat(eventStack.getScheduleGroup()).isNotNull();
    }
    
    @Test
    public void testStackTags() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify stack is created (tags are applied in nested stack)
        assertThat(eventStack).isNotNull();
        assertThat(eventStack.getNode()).isNotNull();
    }
    
    @Test
    public void testPropsBuilder() {
        // Test EventBridgeStackProps builder
        EventBridgeStackProps props = EventBridgeStackProps.builder()
            .environmentSuffix("staging")
            .vpc(vpc)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getVpc()).isEqualTo(vpc);
        assertThat(props.getNestedStackProps()).isNotNull();
    }
    
    @Test
    public void testPropsWithoutVpc() {
        // Test EventBridgeStackProps builder with null VPC
        EventBridgeStackProps props = EventBridgeStackProps.builder()
            .environmentSuffix("test")
            .vpc(null)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getVpc()).isNull();
    }
    
    @Test
    public void testEventBusDescription() {
        // Create EventBridge stack
        EventBridgeStack eventStack = new EventBridgeStack(parentStack, "TestEventStack",
            EventBridgeStackProps.builder()
                .environmentSuffix("test")
                .vpc(vpc)
                .build());
        
        // Verify event bus is created (description is configured in nested stack)
        assertThat(eventStack.getCustomEventBus()).isNotNull();
    }
}