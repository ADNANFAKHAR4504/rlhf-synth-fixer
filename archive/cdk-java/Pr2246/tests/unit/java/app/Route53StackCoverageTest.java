package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

/**
 * Comprehensive test class to ensure Route53Stack classes are covered by JaCoCo.
 * This test ensures that the minimum required coverage is met for the verification task.
 */
public class Route53StackCoverageTest {
    
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }
    
    @Test
    public void testRoute53StackPropsBuilder() {
        // Test builder pattern
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
                
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();
                
        // Assert all properties
        assertEquals("test", props.getEnvironmentSuffix());
        assertSame(stackProps, props.getStackProps());
        
        // Test builder methods explicitly
        Route53StackProps.Builder builder = Route53StackProps.builder();
        assertNotNull(builder);
        
        builder.environmentSuffix("another");
        builder.stackProps(stackProps);
        Route53StackProps builtProps = builder.build();
        assertEquals("another", builtProps.getEnvironmentSuffix());
        
        // Test null stackProps
        Route53StackProps.Builder builder2 = Route53StackProps.builder();
        builder2.environmentSuffix("test2");
        builder2.stackProps(null); // test null stackProps
        Route53StackProps props2 = builder2.build();
        assertNotNull(props2.getStackProps()); // Should create default StackProps
        
        // Test default builder
        Route53StackProps defaultProps = Route53StackProps.builder().build();
        assertNull(defaultProps.getEnvironmentSuffix());
        assertNotNull(defaultProps.getStackProps());
    }
    
    @Test
    public void testRoute53StackCreation() {
        // Create stack with minimal props
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .build();
                
        Route53Stack stack = new Route53Stack(app, "TestStack", props);
        
        // Synthesize the stack to trigger all code paths
        Template template = Template.fromStack(stack);
        
        // Verify basic resources
        template.resourceCountIs("AWS::Route53::HostedZone", 1);
        template.resourceCountIs("AWS::Route53::HealthCheck", 2);
        template.resourceCountIs("AWS::Route53::RecordSet", 2);
        
        // Verify hosted zone properties
        template.hasResourceProperties("AWS::Route53::HostedZone", 
                Map.of(
                    "Name", Match.stringLikeRegexp("myapp-test\\.example\\.org"),
                    "HostedZoneConfig", Match.objectLike(Map.of(
                        "Comment", "Hosted zone for multi-region web application"
                    ))
                ));
        
        // Verify health check properties for primary region
        template.hasResourceProperties("AWS::Route53::HealthCheck", 
                Map.of("HealthCheckConfig", Match.objectLike(
                        Map.of(
                            "Type", "HTTP",
                            "ResourcePath", "/",
                            "FullyQualifiedDomainName", "primary-alb-test.us-east-1.elb.amazonaws.com",
                            "Port", 80,
                            "RequestInterval", 30,
                            "FailureThreshold", 3
                        )
                )));
        
        // Verify health check properties for secondary region
        template.hasResourceProperties("AWS::Route53::HealthCheck", 
                Map.of("HealthCheckConfig", Match.objectLike(
                        Map.of(
                            "Type", "HTTP",
                            "ResourcePath", "/",
                            "FullyQualifiedDomainName", "secondary-alb-test.us-west-2.elb.amazonaws.com",
                            "Port", 80,
                            "RequestInterval", 30,
                            "FailureThreshold", 3
                        )
                )));
        
        // Verify DNS record properties for primary region
        template.hasResourceProperties("AWS::Route53::RecordSet",
                Map.of(
                    "Name", Match.stringLikeRegexp("www\\.myapp-test\\.example\\.org\\."),
                    "Type", "A",
                    "SetIdentifier", "primary",
                    "Region", "us-east-1"
                ));
        
        // Verify DNS record properties for secondary region
        template.hasResourceProperties("AWS::Route53::RecordSet",
                Map.of(
                    "Name", Match.stringLikeRegexp("www\\.myapp-test\\.example\\.org\\."),
                    "Type", "A",
                    "SetIdentifier", "secondary",
                    "Region", "us-west-2"
                ));
    }
    
    @Test
    public void testRoute53StackWithNullProps() {
        // Null case test
        Route53Stack stackWithNullProps = new Route53Stack(app, "NullPropsStack", null);
        assertNotNull(stackWithNullProps);
        
        // Synthesize the stack to trigger all code paths
        Template template = Template.fromStack(stackWithNullProps);
        
        // Should use default environment suffix
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", Match.stringLikeRegexp("myapp-dev\\.example\\.org")));
        
        // Should create all the default resources
        template.resourceCountIs("AWS::Route53::HostedZone", 1);
        template.resourceCountIs("AWS::Route53::HealthCheck", 2);
        template.resourceCountIs("AWS::Route53::RecordSet", 2);
    }
    
    @Test
    public void testRoute53StackWithEmptyEnvironmentSuffix() {
        // Empty environment suffix test
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("")
                .build();
                
        Route53Stack stack = new Route53Stack(app, "EmptySuffixStack", props);
        
        // Synthesize the stack to trigger all code paths
        Template template = Template.fromStack(stack);
        
        // Should use the empty environment suffix
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", Match.stringLikeRegexp("myapp-\\.example\\.org")));
    }
    
    @Test
    public void testRoute53StackWithCustomStackProps() {
        // Test with custom stack props
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("098765432109")
                        .region("eu-central-1")
                        .build())
                .build();
                
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("custom")
                .stackProps(stackProps)
                .build();
                
        Route53Stack stack = new Route53Stack(app, "CustomPropsStack", props);
        
        // Verify account and region were set correctly
        assertEquals("098765432109", stack.getAccount());
        assertEquals("eu-central-1", stack.getRegion());
        
        // Synthesize the stack to trigger all code paths
        Template template = Template.fromStack(stack);
        
        // Should use custom environment suffix
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", Match.stringLikeRegexp("myapp-custom\\.example\\.org")));
    }
}
