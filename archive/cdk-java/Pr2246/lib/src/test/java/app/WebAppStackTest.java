package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.*;
import software.amazon.awscdk.assertions.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the WebAppStack class.
 */
public class WebAppStackTest {
    private App app;

    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @Test
    public void testWebAppStackCreation() {
        // Test basic stack creation
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestStack", props);
        assertNotNull(stack);
    }

    @Test
    public void testWebAppStackSynthesis() {
        // Test that the stack synthesizes without errors
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);
        assertNotNull(template);
    }

    @Test
    public void testWebAppStackPropsBuilder() {
        // Test the props builder
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder().build())
                .build();

        assertEquals("test", props.getEnvironmentSuffix());
        assertNotNull(props.getStackProps());
    }

    @Test
    public void testDefaultEnvironmentSuffix() {
        // Test default environment suffix
        WebAppStack stack = new WebAppStack(app, "TestStack", null);
        Template template = Template.fromStack(stack);

        // Check that resources are created with the default suffix
        template.hasResourceProperties("AWS::EC2::VPC", 
                Match.objectLike(Map.of(
                        "Tags", Match.arrayWith(
                                Match.objectLike(Map.of(
                                        "Key", "Name",
                                        "Value", Match.stringLikeRegexp(".*dev")
                                ))
                        )
                )));
    }

    @Test
    public void testIAMRoles() {
        // Test IAM role configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("iam-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestIAMStack", props);
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::IAM::Role",
                Match.objectLike(Map.of(
                        "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                                "Statement", Match.arrayWith(List.of(
                                        Match.objectLike(Map.of(
                                                "Action", "sts:AssumeRole",
                                                "Effect", "Allow",
                                                "Principal", Map.of(
                                                        "Service", "ec2.amazonaws.com"
                                                )
                                        ))
                                ))
                        )),
                        "ManagedPolicyArns", Match.arrayWith(List.of(
                                Match.stringLikeRegexp(".*CloudWatchAgentServerPolicy"),
                                Match.stringLikeRegexp(".*AmazonSSMManagedInstanceCore"),
                                Match.stringLikeRegexp(".*AWSXRayDaemonWriteAccess")
                        ))
                )));
    }

    @Test
    public void testSecurityGroups() {
        // Test security group configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("sg-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestSGStack", props);
        Template template = Template.fromStack(stack);

        // Check ALB security group allows HTTP and HTTPS
        template.hasResourceProperties("AWS::EC2::SecurityGroup",
                Match.objectLike(Map.of(
                        "SecurityGroupIngress", Match.arrayWith(Arrays.asList(
                                Match.objectLike(Map.of(
                                        "CidrIp", "0.0.0.0/0",
                                        "FromPort", 80,
                                        "IpProtocol", "tcp",
                                        "ToPort", 80
                                )),
                                Match.objectLike(Map.of(
                                        "CidrIp", "0.0.0.0/0",
                                        "FromPort", 443,
                                        "IpProtocol", "tcp",
                                        "ToPort", 443
                                ))
                        ))
                )));

        // Check instance security group allows traffic from ALB
        template.resourceCountIs("AWS::EC2::SecurityGroupIngress", 3); // 2 for ALB, 1 for instances
    }

    @Test
    public void testAutoScalingPolicies() {
        // Test auto scaling policies
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("asg-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestASGStack", props);
        Template template = Template.fromStack(stack);

        // Check CPU scaling policy
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy",
                Match.objectLike(Map.of(
                        "TargetTrackingConfiguration", Match.objectLike(Map.of(
                                "PredefinedMetricSpecification", Match.objectLike(Map.of(
                                        "PredefinedMetricType", "ASGAverageCPUUtilization"
                                )),
                                "TargetValue", 70.0
                        ))
                )));

        // Check request count scaling policy
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy",
                Match.objectLike(Map.of(
                        "TargetTrackingConfiguration", Match.objectLike(Map.of(
                                "PredefinedMetricSpecification", Match.objectLike(Map.of(
                                        "PredefinedMetricType", "ALBRequestCountPerTarget"
                                )),
                                "TargetValue", 1000.0
                        ))
                )));
    }

    @Test
    public void testMonitoringDashboard() {
        // Test CloudWatch dashboard configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("dash-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestDashboardStack", props);
        Template template = Template.fromStack(stack);

        // Check dashboard creation
        template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.anyValue());
        
        // Check that dashboard has expected widgets
        template.hasResource("AWS::CloudWatch::Dashboard",
                Match.objectLike(Map.of(
                        "Properties", Match.objectLike(Map.of(
                                "DashboardBody", Match.stringLikeRegexp(".*widgets.*")
                        ))
                )));
    }

    @Test
    public void testCloudWatchRUMConfiguration() {
        // Test CloudWatch RUM configuration
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("rum-test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build())
                .build();

        WebAppStack stack = new WebAppStack(app, "TestRUMStack", props);
        Template template = Template.fromStack(stack);

        // Check for CloudWatch RUM App Monitor with region in name
        template.hasResourceProperties("AWS::RUM::AppMonitor",
                Match.objectLike(Map.of(
                        "Domain", "myapp-rum-test-primary-1.example.org",
                        "AppMonitorConfiguration", Match.objectLike(Map.of(
                                "AllowCookies", true,
                                "EnableXRay", true,
                                "SessionSampleRate", 1.0,
                                "Telemetries", Match.arrayWith(Arrays.asList("errors", "performance", "http"))
                        ))
                )));

        // Verify that the name contains the region
        template.hasResource("AWS::RUM::AppMonitor", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "Name", Match.stringLikeRegexp(".*us-east-1.*")
                ))
        )));
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

        // Check for X-Ray sampling rule with CloudFormation property names
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

        // Verify that the name contains the shortened region code for us-east-1
        template.hasResource("AWS::XRay::SamplingRule", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "SamplingRule", Match.objectLike(Map.of(
                                "RuleName", "XRaySR-usea-xray-test"
                        ))
                ))
        )));
    }

    @Test
    public void testEnhancedMonitoringIntegration() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("monitor-test")
                .build();

        WebAppStack stack = new WebAppStack(app, "TestMonitorStack", props);
        Template template = Template.fromStack(stack);

        // Check that EC2 instances have CloudWatch agent and X-Ray daemon in user data
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", 
                Match.objectLike(Map.of(
                        "LaunchTemplateData", Match.objectLike(Map.of(
                                "UserData", Match.stringLikeRegexp(".*cloudwatch-agent.*"),
                                "UserData", Match.stringLikeRegexp(".*xray.*")
                        ))
                )));

        // Check that dashboard is properly set up with X-Ray metrics
        template.hasResourceProperties("AWS::CloudWatch::Dashboard", 
                Match.objectLike(Map.of(
                        "DashboardBody", Match.stringLikeRegexp(".*AWS/X-Ray.*")
                )));
    }
    
    @Test
    public void testLoadBalancerRegionalNaming() {
        // Test primary region ALB naming
        WebAppStackProps primaryProps = WebAppStackProps.builder()
                .environmentSuffix("alb-test")
                .build();

        // Create a stack with a name that contains "TapStackPrimary"
        WebAppStack primaryStack = new WebAppStack(
                new App().node.getChild("TapStackPrimary").getNode(), 
                "TestPrimaryALB", 
                primaryProps
        );
        
        Template primaryTemplate = Template.fromStack(primaryStack);

        // Verify that the ALB name for primary region includes the region code
        primaryTemplate.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Match.objectLike(Map.of(
                        "Name", "WebAppALB-usea-alb-test"
                )));
        
        // Test secondary region ALB naming
        WebAppStackProps secondaryProps = WebAppStackProps.builder()
                .environmentSuffix("alb-test")
                .build();

        // Create a stack with a name that contains "TapStackSecondary"
        WebAppStack secondaryStack = new WebAppStack(
                new App().node.getChild("TapStackSecondary").getNode(), 
                "TestSecondaryALB", 
                secondaryProps
        );
        
        Template secondaryTemplate = Template.fromStack(secondaryStack);

        // Verify that the ALB name for secondary region includes the region code
        secondaryTemplate.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer",
                Match.objectLike(Map.of(
                        "Name", "WebAppALB-uswe-alb-test"
                )));
    }
}
