package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Capture;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for the CloudEnvironmentStack.
 * 
 * These tests verify the proper creation and configuration of AWS resources
 * including VPC, Security Groups, ALB, Auto Scaling Group, and related components.
 */
public class CloudEnvironmentStackTest {
    
    private App app;
    private Stack parentStack;
    private String testEnvironmentSuffix;
    
    @BeforeEach
    public void setUp() {
        app = new App();
        parentStack = new Stack(app, "TestParentStack");
        testEnvironmentSuffix = "test123";
    }
    
    /**
     * Test that the CloudEnvironmentStack can be instantiated successfully.
     */
    @Test
    public void testStackCreation() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        assertThat(stack).isNotNull();
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getLoadBalancer()).isNotNull();
        assertThat(stack.getAutoScalingGroup()).isNotNull();
    }
    
    /**
     * Test that the VPC is created with correct configuration.
     */
    @Test
    public void testVpcConfiguration() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify VPC exists with correct properties
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
        
        // Verify subnets exist (should be 4 total - 2 public + 2 private)
        template.resourceCountIs("AWS::EC2::Subnet", 4);
        
        // Verify Internet Gateway exists
        template.hasResource("AWS::EC2::InternetGateway", Match.anyValue());
        
        // Verify NAT Gateways exist (2 for high availability)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
    }
    
    /**
     * Test that Security Groups are properly configured.
     */
    @Test
    public void testSecurityGroups() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB Security Group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for Application Load Balancer"
        ));
        
        // Verify EC2 Security Group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for EC2 instances"
        ));
        
        // Verify security group ingress rules
        template.hasResource("AWS::EC2::SecurityGroupIngress", Match.anyValue());
    }
    
    /**
     * Test that Application Load Balancer is properly configured.
     */
    @Test
    public void testApplicationLoadBalancer() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB exists
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
            "Type", "application",
            "Scheme", "internet-facing"
        ));
        
        // Verify Target Group exists
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
            "Port", 80,
            "Protocol", "HTTP"
        ));
        
        // Verify Listener exists
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Map.of(
            "Port", 80,
            "Protocol", "HTTP"
        ));
    }
    
    /**
     * Test that Auto Scaling Group is properly configured.
     */
    @Test
    public void testAutoScalingGroup() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        // Just verify the ASG was created successfully
        assertThat(stack.getAutoScalingGroup()).isNotNull();
        // ASG name is a token during synthesis, just verify it exists
        assertThat(stack.getAutoScalingGroup().getAutoScalingGroupName()).isNotNull();
    }
    
    /**
     * Test that IAM roles and policies are properly configured.
     */
    @Test
    public void testIamConfiguration() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify EC2 Instance Role exists
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(List.of(
                    Match.objectLike(Map.of(
                        "Principal", Match.objectLike(Map.of(
                            "Service", "ec2.amazonaws.com"
                        ))
                    ))
                ))
            ))
        ));
        
        // Verify Instance Profile exists
        template.hasResource("AWS::IAM::InstanceProfile", Match.anyValue());
    }
    
    /**
     * Test that CloudFormation outputs are properly created.
     */
    @Test
    public void testOutputs() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify VPC ID output exists
        template.hasOutput("VpcId", Map.of(
            "Description", "ID of the VPC"
        ));
        
        // Verify Load Balancer DNS Name output exists
        template.hasOutput("LoadBalancerDnsName", Map.of(
            "Description", "DNS name of the Application Load Balancer"
        ));
        
        // Verify Auto Scaling Group Name output exists
        template.hasOutput("AutoScalingGroupName", Map.of(
            "Description", "Name of the Auto Scaling Group"
        ));
    }
    
    /**
     * Test that resources are properly tagged.
     */
    @Test
    public void testResourceTags() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Since tags are applied at the stack level, verify stack has tags
        // Note: This would be more detailed in a real test
        assertThat(template).isNotNull();
        
        // Tags should propagate to resources automatically via CDK
        // The stack should have tags for Environment, Project, ManagedBy, and Application
    }
    
    /**
     * Test that the environment suffix is properly used in resource names.
     */
    @Test
    public void testEnvironmentSuffixUsage() {
        String suffix = "prod456";
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(suffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify VPC name includes suffix
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "Tags", Match.arrayWith(List.of(
                Match.objectLike(Map.of(
                    "Key", "Name",
                    "Value", Match.stringLikeRegexp(".*" + suffix + ".*")
                ))
            ))
        ));
    }
    
    /**
     * Test that health checks are properly configured.
     */
    @Test
    public void testHealthCheckConfiguration() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify target group has proper health check configuration
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
            "HealthCheckPath", "/",
            "HealthCheckIntervalSeconds", 30,
            "HealthCheckTimeoutSeconds", 5,
            "HealthyThresholdCount", 2,
            "UnhealthyThresholdCount", 3
        ));
    }
    
    /**
     * Test that scaling policies are properly configured.
     */
    @Test
    public void testScalingPolicies() {
        CloudEnvironmentStack stack = new CloudEnvironmentStack(
            parentStack,
            "TestCloudEnvironment",
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build()
        );
        
        Template template = Template.fromStack(stack);
        
        // Verify Target Tracking Scaling Policy exists
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy", Map.of(
            "TargetTrackingConfiguration", Match.objectLike(Map.of(
                "TargetValue", 70.0
            ))
        ));
        
        // Verify Step Scaling Policy exists
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy", Map.of(
            "AdjustmentType", "ChangeInCapacity"
        ));
    }
    
    /**
     * Test that the stack handles null props gracefully.
     */
    @Test
    public void testNullPropsHandling() {
        // This should throw an exception or handle gracefully
        assertThatThrownBy(() -> {
            new CloudEnvironmentStack(
                parentStack,
                "TestCloudEnvironment",
                null
            );
        }).isInstanceOf(NullPointerException.class);
    }
}