package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.constructs.Construct;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

/**
 * Unit tests for the TapStack class.
 * 
 * These tests verify the TapStack's functionality, including environment suffix handling,
 * nested stack creation, and proper resource configuration.
 */
public class TapStackTest {
    
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }
    
    @Test
    public void testTapStackCreationWithProps() {
        // Test stack creation with explicit props
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("custom")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, "TestTapStack", props);
        
        // Verify stack properties
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("custom");
        assertThat(stack.getAccount()).isEqualTo("123456789012");
        assertThat(stack.getRegion()).isEqualTo("us-east-1");
        
        // Verify template
        Template template = Template.fromStack(stack);
        
        // Verify nested WebAppStack is created with the correct suffix
        assertThat(stack.getNode().findChild("WebAppStackcustom")).isNotNull();
    }
    
    @Test
    public void testTapStackWithContextEnvironmentSuffix() {
        // Test stack with environment suffix from context
        App contextApp = new App();
        contextApp.getNode().setContext("environmentSuffix", "context-test");
        
        TapStack stack = new TapStack(contextApp, "TestTapStackContext", null);
        
        // Verify environment suffix from context
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("context-test");
        
        // Verify template
        Template template = Template.fromStack(stack);
        
        // Verify nested WebAppStack is created with the correct suffix
        assertThat(stack.getNode().findChild("WebAppStackcontext-test")).isNotNull();
    }
    
    @Test
    public void testTapStackDefaultEnvironmentSuffix() {
        // Test stack with default environment suffix when neither props nor context provide one
        TapStack stack = new TapStack(app, "TestTapStackDefault", null);
        
        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        
        // Verify template
        Template template = Template.fromStack(stack);
        
        // Verify nested WebAppStack is created with the default suffix
        assertThat(stack.getNode().findChild("WebAppStackdev")).isNotNull();
    }
    
    @Test
    public void testTapStackWithNullProps() {
        // Test stack creation with null props
        TapStack stack = new TapStack(app, "TestTapStackNullProps", null);
        
        // Verify stack properties with default values
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }
    
    @Test
    public void testNestedWebAppStackConfiguration() {
        // Test proper configuration of nested WebAppStack
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("nested-test")
                .build();
        
        TapStack stack = new TapStack(app, "TestTapStackNested", props);
        
        // Verify nested stack is properly configured
        Template template = Template.fromStack(stack);
        
        // Verify existence of the nested WebAppStack
        assertThat(stack.getNode().findChild("WebAppStacknested-test")).isNotNull();
    }
    
    @Test
    public void testPriorityOrder() {
        // Test that props have higher priority than context
        App contextApp = new App();
        contextApp.getNode().setContext("environmentSuffix", "context-value");
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("props-value")
                .build();
        
        TapStack stack = new TapStack(contextApp, "TestTapStackPriority", props);
        
        // Verify that props value is used instead of context
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("props-value");
    }
}
