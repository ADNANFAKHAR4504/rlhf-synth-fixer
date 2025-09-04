package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.services.route53.ARecordProps;
import software.amazon.awscdk.services.route53.CfnHealthCheck;
import software.amazon.awscdk.services.route53.HostedZone;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.HashMap;
import java.util.List;
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
        
        // Verify the account and region were properly passed through
        assertEquals("123456789012", stack.getAccount());
        assertEquals("us-east-1", stack.getRegion());
    }

    @Test
    public void testRoute53StackPropsBuilder() {
        // Test props builder with only environment suffix
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
        
        // Test builder chaining
        Route53StackProps.Builder builder = Route53StackProps.builder();
        assertNotNull(builder);
        
        // Test creating a different builder and chaining methods
        Route53StackProps propsChained = Route53StackProps.builder()
                .environmentSuffix("chain-test")
                .stackProps(null)
                .build();
        
        assertEquals("chain-test", propsChained.getEnvironmentSuffix());
        assertNotNull(propsChained.getStackProps()); // Should still create default stack props
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
        
        // Test with null environment suffix (edge case)
        Route53StackProps propsWithNullSuffix = Route53StackProps.builder()
                .environmentSuffix(null)
                .stackProps(stackProps)
                .build();
                
        assertThat(propsWithNullSuffix.getEnvironmentSuffix()).isNull();
        assertThat(propsWithNullSuffix.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    public void testRoute53StackPropsNullCheck() {
        // Test builder with null values
        Route53StackProps props = Route53StackProps.builder()
                .build();
        
        // Should not fail even with nulls
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull(); // Default StackProps
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
                Map.of(
                    "Name", Match.stringLikeRegexp("myapp-test\\.example\\.org"),
                    "HostedZoneConfig", Match.objectLike(Map.of(
                        "Comment", "Hosted zone for multi-region web application"
                    ))
                ));
        
        // Check for primary health check
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
        
        // Check for secondary health check
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
        
        // Check for A records (primary record)
        template.hasResourceProperties("AWS::Route53::RecordSet",
                Map.of(
                    "Name", Match.stringLikeRegexp("www\\.myapp-test\\.example\\.org\\."),
                    "Type", "A",
                    "SetIdentifier", "primary",
                    "Region", "us-east-1",
                    "ResourceRecords", Match.arrayWith(List.of("192.0.2.1"))
                ));
        
        // Check for A records (secondary record)
        template.hasResourceProperties("AWS::Route53::RecordSet",
                Map.of(
                    "Name", Match.stringLikeRegexp("www\\.myapp-test\\.example\\.org\\."),
                    "Type", "A",
                    "SetIdentifier", "secondary",
                    "Region", "us-west-2",
                    "ResourceRecords", Match.arrayWith(List.of("192.0.2.2"))
                ));
        
        // Verify the number of resources created
        Map<String, Map<String, Object>> recordSetResources = template.findResources("AWS::Route53::RecordSet");
        assertEquals(2, recordSetResources.size());
        
        Map<String, Map<String, Object>> healthCheckResources = template.findResources("AWS::Route53::HealthCheck");
        assertEquals(2, healthCheckResources.size());
        
        Map<String, Map<String, Object>> hostedZoneResources = template.findResources("AWS::Route53::HostedZone");
        assertEquals(1, hostedZoneResources.size());
    }

    @Test
    public void testRoute53StackDefaultEnvironmentSuffix() {
        // Test with null props
        Route53Stack stack = new Route53Stack(app, "TestRoute53Stack", null);

        assertThat(stack).isNotNull();
        
        // Verify default suffix is used
        Template template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", Match.stringLikeRegexp("myapp-dev\\.example\\.org")));
                
        // Verify health checks with default suffix
        template.hasResourceProperties("AWS::Route53::HealthCheck", 
                Map.of("HealthCheckConfig", Match.objectLike(
                        Map.of("FullyQualifiedDomainName", "primary-alb-dev.us-east-1.elb.amazonaws.com")
                )));
                
        template.hasResourceProperties("AWS::Route53::HealthCheck", 
                Map.of("HealthCheckConfig", Match.objectLike(
                        Map.of("FullyQualifiedDomainName", "secondary-alb-dev.us-west-2.elb.amazonaws.com")
                )));
    }
    
    @Test
    public void testRoute53StackWithCustomEnvironmentSuffix() {
        // Test with a custom environment suffix to verify different values
        String customSuffix = "custom-env";
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix(customSuffix)
                .build();
                
        Route53Stack stack = new Route53Stack(app, "TestRoute53Stack", props);
        
        // Verify template with custom suffix
        Template template = Template.fromStack(stack);
        
        // Check domain name has custom suffix
        template.hasResourceProperties("AWS::Route53::HostedZone",
                Map.of("Name", "myapp-" + customSuffix + ".example.org."));
                
        // Check health check domain names have custom suffix
        template.hasResourceProperties("AWS::Route53::HealthCheck", 
                Map.of("HealthCheckConfig", Match.objectLike(
                        Map.of("FullyQualifiedDomainName", "primary-alb-" + customSuffix + ".us-east-1.elb.amazonaws.com")
                )));
                
        // Instead of checking logical IDs, which might be different in CloudFormation,
        // verify the RecordSet contents have the expected values
        template.resourceCountIs("AWS::Route53::RecordSet", 2);
        
        // Check that both primary and secondary records exist with the correct region values
        template.hasResourceProperties("AWS::Route53::RecordSet", 
            Map.of(
                "Region", "us-east-1",
                "SetIdentifier", "primary"
            )
        );
        
        template.hasResourceProperties("AWS::Route53::RecordSet", 
            Map.of(
                "Region", "us-west-2",
                "SetIdentifier", "secondary"
            )
        );
    }
}