package app.compute;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;

import app.networking.VpcStack;
import app.networking.SecurityGroupStack;

import java.util.Map;

public class AutoScalingStackTest {

    private App app;
    private Vpc vpc;
    private SecurityGroup webServerSecurityGroup;
    private ApplicationTargetGroup targetGroup;

    @BeforeEach
    public void setUp() {
        app = new App();
        
        // Create VPC
        VpcStack vpcStack = new VpcStack(app, "TestVpc", StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build());
        vpc = vpcStack.getVpc();
        
        // Create Security Groups
        SecurityGroupStack securityStack = new SecurityGroupStack(app, "TestSecurityGroups",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc);
        webServerSecurityGroup = securityStack.getWebServerSecurityGroup();
        
        // Create Web Application Stack for target group
        WebApplicationStack webAppStack = new WebApplicationStack(app, "TestWebApp",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, securityStack.getAlbSecurityGroup(), webServerSecurityGroup);
        targetGroup = webAppStack.getTargetGroup();
    }

    @Test
    public void testAutoScalingGroupCreation() {
        AutoScalingStack stack = new AutoScalingStack(app, "TestAutoScalingStack",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, webServerSecurityGroup, targetGroup);

        Template template = Template.fromStack(stack);

        // Verify Launch Template is created
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", Map.of(
                "LaunchTemplateData", Match.objectLike(Map.of(
                        "InstanceType", "t3.medium"
                ))
        ));

        // Verify Auto Scaling Group is created
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
                "MinSize", "2",
                "MaxSize", "10",
                "DesiredCapacity", "2"
        ));

        // Verify getter works
        assertThat(stack.getAutoScalingGroup()).isNotNull();
    }

    @Test
    public void testScalingPolicies() {
        AutoScalingStack stack = new AutoScalingStack(app, "TestAutoScalingStack2",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, webServerSecurityGroup, targetGroup);

        Template template = Template.fromStack(stack);

        // Verify scaling policies are created
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy", Map.of(
                "PolicyType", "TargetTrackingScaling"
        ));

        // Verify at least one policy has CPU utilization target
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy", Map.of(
                "TargetTrackingConfiguration", Match.objectLike(Map.of(
                        "TargetValue", 70.0
                ))
        ));
    }

    @Test
    public void testUserDataConfiguration() {
        AutoScalingStack stack = new AutoScalingStack(app, "TestAutoScalingStack3",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, webServerSecurityGroup, targetGroup);

        Template template = Template.fromStack(stack);

        // Verify launch template has user data
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", Map.of(
                "LaunchTemplateData", Match.objectLike(Map.of(
                        "UserData", Match.anyValue()
                ))
        ));
    }
}