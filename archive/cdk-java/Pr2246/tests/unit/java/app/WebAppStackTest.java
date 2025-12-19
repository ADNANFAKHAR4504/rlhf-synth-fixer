package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

public class WebAppStackTest {
    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @Test
    public void testWebAppStackCreation() {
        // Create stack with properties
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build())
                .build();

        WebAppStack stack = new WebAppStack(app, "TestWebAppStack", props);

        // Assert that stack is created
        assertThat(stack).isNotNull();
        assertThat(stack.getNode().getId()).isEqualTo("TestWebAppStack");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getLoadBalancer()).isNotNull();
    }

    @Test
    public void testWebAppStackPropsBuilder() {
        // Test props builder
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    public void testWebAppStackSynthesis() {
        // Create and synthesize stack
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestWebAppStack", props);

        // Synthesize and verify template
        Template template = Template.fromStack(stack);
        
        // Check for VPC
        template.hasResourceProperties("AWS::EC2::VPC", Match.anyValue());
        
        // Check for ALB
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", 
                Map.of("Type", "application"));
        
        // Check for Auto Scaling Group
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Match.anyValue());
        
        // Check for Launch Template
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", Match.anyValue());
    }

    @Test
    public void testXRayTracingConfiguration() {
        // Test X-Ray configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("xray-test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build())
                .build();

        WebAppStack stack = new WebAppStack(app, "TestXRayStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for X-Ray sampling rule with CloudFormation property names and region code in name
        // Using partial matching since the rule name now includes the region code
        template.hasResourceProperties("AWS::XRay::SamplingRule", 
                Map.of("SamplingRule", Match.objectLike(
                        new java.util.HashMap<String, Object>() {{
                            put("RuleName", Match.stringLikeRegexp("XRaySR-.*-xray-test"));
                            put("Priority", 9000);
                            put("FixedRate", 0.1);
                            put("ReservoirSize", 1);
                            put("ServiceName", "webapp-xray-test");
                            put("ServiceType", "*");
                            put("Host", "*");
                            put("HTTPMethod", "*");
                            put("URLPath", "*");
                            put("Version", 1);
                            put("ResourceARN", "*");
                        }}
                )));
        
        // Verify that the name contains a shortened region code for us-east-1
        // The implementation uses substring logic which results in "usea" for "us-east-1"
        template.hasResource("AWS::XRay::SamplingRule", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "SamplingRule", Match.objectLike(Map.of(
                                "RuleName", "XRaySR-usea-xray-test"
                        ))
                ))
        )));
    }

    @Test
    public void testCloudWatchRUMConfiguration() {
        // Test CloudWatch RUM configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("rum-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestRUMStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for CloudWatch RUM App Monitor with region in name
        template.hasResourceProperties("AWS::RUM::AppMonitor",
                Map.of(
                       "Domain", "myapp-rum-test-primary-1.example.org",
                       "AppMonitorConfiguration", Match.objectLike(Map.of(
                               "AllowCookies", true,
                               "EnableXRay", true,
                               "SessionSampleRate", 1.0,
                               "Telemetries", Match.arrayWith(java.util.Arrays.asList("errors", "performance", "http"))
                       ))));
                       
        // Verify that the name contains the region
        template.hasResource("AWS::RUM::AppMonitor", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "Name", Match.objectLike(Map.of(
                                "Fn::Join", Match.arrayWith(List.of("", Match.arrayWith(List.of("webapp-rum-"))))
                        ))
                ))
        )));
    }

    @Test
    public void testMonitoringDashboard() {
        // Test monitoring dashboard creation
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("dashboard-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestDashboardStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for CloudWatch Dashboard
        template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.anyValue());
    }

    @Test
    public void testSecurityGroups() {
        // Test security group configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("sg-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestSGStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for ALB security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup",
                Map.of("GroupDescription", "Security group for Application Load Balancer"));
        
        // Check for instance security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup",
                Map.of("GroupDescription", "Security group for EC2 instances"));
    }

    @Test
    public void testAutoScalingPolicies() {
        // Test auto scaling configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("scaling-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestScalingStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for target tracking scaling policy
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy",
                Map.of("PolicyType", "TargetTrackingScaling"));
    }

    @Test
    public void testIAMRoles() {
        // Test IAM role configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("iam-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestIAMStack", props);
        Template template = Template.fromStack(stack);
        
        // Check for EC2 instance role
        template.hasResourceProperties("AWS::IAM::Role",
                Map.of("AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Effect", "Allow",
                                        "Principal", Match.objectLike(Map.of(
                                                "Service", "ec2.amazonaws.com"
                                        ))
                                ))
                        ))
                ))));
    }

    @Test
    public void testDefaultEnvironmentSuffix() {
        // Test with null props
        WebAppStack stack = new WebAppStack(app, "TestWebAppStack", null);

        assertThat(stack).isNotNull();
        
        // Verify default suffix is used
        Template template = Template.fromStack(stack);
        
        // Check that resources have default 'dev' suffix
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Map.of("Name", Match.stringLikeRegexp("WebAppALB-dev")));
    }

    @Test
    public void testEnhancedMonitoringIntegration() {
        // Test integration between X-Ray and RUM
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("monitoring-integration")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestMonitoringIntegrationStack", props);
        Template template = Template.fromStack(stack);
        
        // Verify both X-Ray and RUM are configured
        template.hasResourceProperties("AWS::XRay::SamplingRule", Match.anyValue());
        template.hasResourceProperties("AWS::RUM::AppMonitor", Match.anyValue());
        
        // Verify RUM has X-Ray enabled for trace correlation
        template.hasResourceProperties("AWS::RUM::AppMonitor",
                Map.of("AppMonitorConfiguration", Match.objectLike(Map.of(
                        "EnableXRay", true
                ))));
    }
}