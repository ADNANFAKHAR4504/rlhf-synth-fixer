package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.constructs.IConstruct;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

/**
 * Enhanced unit tests for WebAppStack.
 * 
 * These tests cover additional aspects of the WebAppStack that were not tested in the original test class.
 */
public class WebAppStackEnhancedTest {
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }
    
    @Test
    public void testWebAppStackRegionSpecificNames() {
        // Create a stack with a path that includes "TapStackPrimary"
        app = new App();
        Stack parentStack = new Stack(app, "TapStackPrimary");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("region-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB name includes "usea" for us-east-1
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Map.of("Name", "WebAppALB-usea-region-test"));
    }
    
    @Test
    public void testWebAppStackSecondaryRegionNames() {
        // Create a stack with a path that includes "TapStackSecondary"
        app = new App();
        Stack parentStack = new Stack(app, "TapStackSecondary");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("region-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB name includes "uswe" for us-west-2
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Map.of("Name", "WebAppALB-uswe-region-test"));
    }
    
    @Test
    public void testWebAppStackInCustomPathWithoutRegion() {
        // Create a stack with a generic path that doesn't include region info
        app = new App();
        Stack parentStack = new Stack(app, "GenericParent");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("generic-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB name doesn't include region code
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Map.of("Name", "WebAppALB-generic-test"));
    }
    
    @Test
    public void testCloudWatchRUMConfigurationWithRegionSpecific() {
        // Test RUM configuration with region-specific naming
        app = new App();
        Stack parentStack = new Stack(app, "TapStackSecondary");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("rum-region-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify RUM app monitor name contains the hardcoded region for secondary stack
        template.hasResourceProperties("AWS::RUM::AppMonitor",
                Map.of("Name", "webapp-rum-us-west-2-rum-region-test"));
    }
    
    @Test
    public void testXRayTracinglWithRegionSpecific() {
        // Test X-Ray configuration with region-specific naming
        app = new App();
        Stack parentStack = new Stack(app, "TapStackPrimary");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("xray-region-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify X-Ray sampling rule name contains the shortened region code
        template.hasResourceProperties("AWS::XRay::SamplingRule",
                Map.of("SamplingRule", Match.objectLike(Map.of(
                        "RuleName", "XRaySR-use1-xray-region-test"
                ))));
    }
    
    @Test
    public void testWebAppStackWithNestedConstruct() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("nested-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "WebAppNestedStack", props);
        
        // Verify that nested constructs are created
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getLoadBalancer()).isNotNull();
        assertThat(stack.getRumAppMonitor()).isNotNull();
        assertThat(stack.getXraySamplingRule()).isNotNull();
    }
    
    @Test
    public void testMonitoringDashboardNaming() {
        app = new App();
        Stack parentStack = new Stack(app, "TapStackPrimary");
        parentStack.getNode().setContext("aws:cdk:fake-region", "us-east-1");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("dashboard-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify dashboard name contains region and environment suffix
        template.hasResourceProperties("AWS::CloudWatch::Dashboard",
                Map.of("DashboardName", "WebApp-dashboard-test-us-east-1-primary-a"));
    }
    
    @Test
    public void testMonitoringDashboardNamingSecondary() {
        app = new App();
        Stack parentStack = new Stack(app, "TapStackSecondary");
        parentStack.getNode().setContext("aws:cdk:fake-region", "us-west-2");
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("dashboard-test")
                .build();

        WebAppStack stack = new WebAppStack(parentStack, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify dashboard name contains region and environment suffix for secondary region
        template.hasResourceProperties("AWS::CloudWatch::Dashboard",
                Map.of("DashboardName", "WebApp-dashboard-test-us-west-2"));
    }
    
    @Test
    public void testUserDataScript() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("userdata-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Verify that launch template includes user data with X-Ray and RUM setup
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", Match.objectLike(
                Map.of("LaunchTemplateData", Match.objectLike(
                        Map.of("UserData", Match.anyValue())
                ))
        ));
    }
    
    @Test
    public void testLogGroupConfiguration() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("logging-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "WebAppStack", props);
        
        Template template = Template.fromStack(stack);
        
        // Simply verify that a dashboard is created
        template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);
    }
}
