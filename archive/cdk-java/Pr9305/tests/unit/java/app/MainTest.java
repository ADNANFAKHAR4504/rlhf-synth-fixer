package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {
    
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }
    
    /**
     * Test that the TapStack handles null props.
     */
    @Test
    public void testNullPropsHandling() {
        TapStack stack = new TapStack(app, "TestStack", null);

        // Should use default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
        
        // Verify nested stack is created
        template.hasResource("AWS::CloudFormation::Stack", Match.anyValue());
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }
    
    /**
     * Test that the TapStack prioritizes props over context.
     */
    @Test
    public void testEnvironmentSuffixPriority() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("production")
                .build());

        // Verify props takes precedence over context
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("production");
    }
    
    /**
     * Test that TapStackProps builder works correctly.
     */
    @Test
    public void testTapStackPropsBuilder() {
        Environment env = Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build();
        
        StackProps stackProps = StackProps.builder()
                .env(env)
                .build();
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull();
        assertThat(props.getStackProps().getEnv()).isEqualTo(env);
    }
    
    /**
     * Test that TapStackProps handles null stack props.
     */
    @Test
    public void testTapStackPropsNullStackProps() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(null)
                .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull(); // Should create default StackProps
    }
    
    /**
     * Test that the stack creates CloudEnvironmentStack with correct props.
     */
    @Test
    public void testCloudEnvironmentStackCreation() {
        String suffix = "integration";
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix(suffix)
                .build());
        
        Template template = Template.fromStack(stack);
        
        // Verify nested stack is created with correct logical ID
        template.hasResource("AWS::CloudFormation::Stack", Match.anyValue());
        
        assertThat(stack.getEnvironmentSuffix()).isEqualTo(suffix);
    }
    
    /**
     * Test the Main class entry point components.
     */
    @Test
    public void testMainClassComponents() {
        // Test that Main class has private constructor (utility class pattern)
        assertThat(Main.class.getDeclaredConstructors()).hasSize(1);
        assertThat(Main.class.getDeclaredConstructors()[0].getModifiers())
                .isEqualTo(java.lang.reflect.Modifier.PRIVATE);
    }
    
    /**
     * Test stack with environment configuration.
     */
    @Test
    public void testStackWithEnvironmentConfiguration() {
        Environment env = Environment.builder()
                .account("987654321098")
                .region("us-west-2")
                .build();
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(StackProps.builder()
                        .env(env)
                        .build())
                .build());
        
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        // Stack environment is set internally, we can just verify the stack was created with the right props
    }
}