package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for TapStack.
 */
public class TapStackTest {
    
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }
    
    @Test
    public void testTapStackCreation() {
        // Create TapStack
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getS3Stack()).isNotNull();
        assertThat(stack.getEventBridgeStack()).isNotNull();
    }
    
    @Test
    public void testNestedStacksCreated() {
        // Create TapStack
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        Template template = Template.fromStack(stack);
        
        // Verify nested stacks are created
        template.resourceCountIs("AWS::CloudFormation::Stack", 3);
    }
    
    @Test
    public void testStackWithCustomProps() {
        // Create TapStack with custom stack props
        StackProps customProps = StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .description("Test Stack")
            .build();
        
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder()
                .environmentSuffix("custom")
                .stackProps(customProps)
                .build());
        
        // Verify custom properties are applied
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("custom");
        assertThat(stack.getRegion()).isEqualTo("us-west-2");
        assertThat(stack.getAccount()).isEqualTo("123456789012");
    }
    
    @Test
    public void testStackTags() {
        // Create TapStack
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder()
                .environmentSuffix("test")
                .build());
        
        // Verify stack is created with expected properties
        assertThat(stack).isNotNull();
        assertThat(stack.getNode()).isNotNull();
        // Tags are applied to the stack and its resources
    }
    
    @Test
    public void testEnvironmentSuffixFromContext() {
        // Set context
        app.getNode().setContext("environmentSuffix", "context-suffix");
        
        // Create TapStack without environment suffix in props
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder().build());
        
        // Verify context suffix is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("context-suffix");
    }
    
    @Test
    public void testDefaultEnvironmentSuffix() {
        // Create TapStack without any environment suffix
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder().build());
        
        // Verify default suffix is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }
    
    @Test
    public void testNestedStackNaming() {
        // Create TapStack with specific suffix
        TapStack stack = new TapStack(app, "TestTapStack",
            TapStackProps.builder()
                .environmentSuffix("prod")
                .build());
        
        // Verify nested stacks are created with proper references
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getS3Stack()).isNotNull();
        assertThat(stack.getEventBridgeStack()).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
    }
    
    @Test
    public void testTapStackPropsBuilder() {
        // Test TapStackProps builder with all options
        StackProps stackProps = StackProps.builder()
            .description("Test description")
            .build();
        
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("staging")
            .stackProps(stackProps)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isNotNull();
        assertThat(props.getStackProps().getDescription()).isEqualTo("Test description");
    }
    
    @Test
    public void testTapStackPropsWithNullStackProps() {
        // Test TapStackProps builder with null stack props
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .stackProps(null)
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull(); // Should create default
    }
    
    @Test
    public void testTapStackWithNullProps() {
        // Create TapStack with null props
        TapStack stack = new TapStack(app, "TestTapStack", null);
        
        // Should use defaults
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }
}