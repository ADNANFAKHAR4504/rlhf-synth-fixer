package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;
import java.util.Arrays;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStackDev
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test TapStackProps builder functionality.
     */
    @Test
    public void testTapStackPropsBuilder() {
        // Test with environment suffix
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .stackProps(StackProps.builder().build())
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull();
        
        // Test without environment suffix
        TapStackProps propsNoSuffix = TapStackProps.builder()
            .stackProps(StackProps.builder().build())
            .build();
        
        assertThat(propsNoSuffix).isNotNull();
        assertThat(propsNoSuffix.getEnvironmentSuffix()).isNull();
        assertThat(propsNoSuffix.getStackProps()).isNotNull();
        
        // Test with null stackProps
        TapStackProps propsNullStack = TapStackProps.builder()
            .environmentSuffix("prod")
            .build();
        
        assertThat(propsNullStack).isNotNull();
        assertThat(propsNullStack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(propsNullStack.getStackProps()).isNotNull(); // Should default to non-null
    }
    
    /**
     * Test that the TapStackDev can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        // Verify stack was created
        assertThat(stack).isNotNull();
    }

    /**
     * Test that the TapStackDev synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that VPC is created with correct configuration.
     */
    @Test
    public void testVpcCreation() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify VPC is created with correct properties
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
    }

    /**
     * Test that Auto Scaling Group is configured correctly.
     */
    @Test
    public void testAutoScalingGroupConfiguration() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify Auto Scaling Group exists with proper capacity settings
        // Note: Configuration depends on whether LocalStack is detected via AWS_ENDPOINT_URL
        // In LocalStack: MinSize=1, MaxSize=2, DesiredCapacity=1
        // In AWS: MinSize=2, MaxSize=10, DesiredCapacity=3
        // CloudFormation template stores these as strings
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = endpointUrl != null &&
            (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

        if (isLocalStack) {
            template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
                "MinSize", "1",
                "MaxSize", "2",
                "DesiredCapacity", "1"
            ));
        } else {
            template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
                "MinSize", "2",
                "MaxSize", "10",
                "DesiredCapacity", "3"
            ));
        }
    }

    /**
     * Test that Application Load Balancer is created.
     */
    @Test
    public void testLoadBalancerCreation() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify Application Load Balancer is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
            "Type", "application",
            "Scheme", "internet-facing"
        ));
    }

    /**
     * Test that IAM role for EC2 instances is created with proper policies.
     */
    @Test
    public void testIamRoleCreation() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify IAM role is created for EC2 instances
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of(
                            "Service", "ec2.amazonaws.com"
                        ),
                        "Action", "sts:AssumeRole"
                    )
                ))
            ))
        ));
    }

    /**
     * Test that CloudWatch alarms are configured.
     */
    @Test
    public void testCloudWatchAlarmsConfiguration() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify CloudWatch alarms based on environment
        // LocalStack Community Edition: 0 alarms (not supported)
        // AWS: 3 alarms (CPU, UnhealthyHosts, ResponseTime)
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = endpointUrl != null &&
            (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

        int expectedAlarms = isLocalStack ? 0 : 3;
        template.resourceCountIs("AWS::CloudWatch::Alarm", expectedAlarms);
    }

    /**
     * Test that security groups are properly configured.
     */
    @Test
    public void testSecurityGroupsConfiguration() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify security groups exist (we should have at least ALB and Instance security groups)
        // Note: CDK creates additional security groups for VPC endpoints and other resources
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.anyValue());
    }

    /**
     * Test that stack outputs are defined for integration testing.
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify essential outputs are defined
        template.hasOutput("LoadBalancerDNS", Match.anyValue());
        template.hasOutput("VpcId", Match.anyValue());
        template.hasOutput("AutoScalingGroupName", Match.anyValue());
        template.hasOutput("LoadBalancerArn", Match.anyValue());
    }

    /**
     * Test that NAT Gateways are configured for high availability.
     */
    @Test
    public void testNatGatewayConfiguration() {
        App app = new App();
        TapStackDev stack = new TapStackDev(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        // Verify NAT gateways based on environment
        // LocalStack Community Edition: 0 NAT Gateways (not well supported)
        // AWS: At least 2 for high availability (one per AZ)
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = endpointUrl != null &&
            (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

        int natGatewayCount = template.toJSON().get("Resources").toString()
            .split("AWS::EC2::NatGateway").length - 1;

        if (isLocalStack) {
            assertThat(natGatewayCount).isEqualTo(0);
        } else {
            assertThat(natGatewayCount).isGreaterThanOrEqualTo(2);
        }
    }
}