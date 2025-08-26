package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.cxapi.CloudFormationStackArtifact;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

public class Route53StackTest {
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @Test
    public void testRoute53StackCreation() {
        // Create stack with properties
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build())
                .build();

        Route53Stack stack = new Route53Stack(app, "TestRoute53Stack", props);

        // Assert that stack is created
        assertThat(stack).isNotNull();
        assertThat(stack.getNode().getId()).isEqualTo("TestRoute53Stack");
    }

    @Test
    public void testRoute53StackPropsBuilder() {
        // Test props builder
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    public void testRoute53StackPropsWithStackProps() {
        // Test with explicit stack props
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("987654321098")
                        .region("eu-west-1")
                        .build())
                .build();

        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("staging")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    public void testRoute53StackSynthesis() {
        // Create and synthesize stack
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .build();

        Route53Stack stack = new Route53Stack(app, "TestRoute53Stack", props);

        // Synthesize and verify template
        Template template = Template.fromStack(stack);
        
        // Check for hosted zone
        template.hasResourceProperties("AWS::Route53::HostedZone", 
                Map.of("Name", Match.stringLikeRegexp("myapp-test\\.example\\.org")));
        
        // Check for health checks
        template.hasResourceProperties("AWS::Route53::HealthCheck", Match.anyValue());
    }

    @Test
    public void testRoute53StackDefaultEnvironmentSuffix() {
        // Test with null props
        Route53Stack stack = new Route53Stack(app, "TestRoute53Stack", null);

        assertThat(stack).isNotNull();
        
        // Verify default suffix is used
        Template template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", Match.stringLikeRegexp(".*dev.*")));
    }
}