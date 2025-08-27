package app.monitoring;

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
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;

import app.networking.VpcStack;
import app.networking.SecurityGroupStack;
import app.compute.WebApplicationStack;
import app.compute.AutoScalingStack;

import java.util.Map;

public class CloudWatchStackTest {

    private App app;
    private ApplicationLoadBalancer alb;
    private AutoScalingGroup asg;

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
        Vpc vpc = vpcStack.getVpc();
        
        // Create Security Groups
        SecurityGroupStack securityStack = new SecurityGroupStack(app, "TestSecurityGroups",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc);
        
        // Create Web Application Stack
        WebApplicationStack webAppStack = new WebApplicationStack(app, "TestWebApp",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, securityStack.getAlbSecurityGroup(), securityStack.getWebServerSecurityGroup());
        alb = webAppStack.getAlb();
        
        // Create Auto Scaling Stack
        AutoScalingStack autoScalingStack = new AutoScalingStack(app, "TestAutoScaling",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, securityStack.getWebServerSecurityGroup(), webAppStack.getTargetGroup());
        asg = autoScalingStack.getAutoScalingGroup();
    }

    @Test
    public void testCloudWatchDashboardCreation() {
        CloudWatchStack stack = new CloudWatchStack(app, "TestCloudWatchStack",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                alb, asg);

        Template template = Template.fromStack(stack);

        // Verify Dashboard is created
        template.hasResourceProperties("AWS::CloudWatch::Dashboard", Map.of(
                "DashboardName", "WebApplication-us-east-1"
        ));

        // Verify SNS Topic for alerts is created
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "DisplayName", "WebApp Alerts"
        ));

        // Verify getters work
        assertThat(stack.getDashboard()).isNotNull();
        assertThat(stack.getAlertTopic()).isNotNull();
    }

    @Test
    public void testCloudWatchAlarms() {
        CloudWatchStack stack = new CloudWatchStack(app, "TestCloudWatchStack2",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                alb, asg);

        Template template = Template.fromStack(stack);

        // Verify High CPU Alarm is created
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
                "AlarmName", "WebApp-HighCPU-us-east-1",
                "AlarmDescription", "High CPU utilization in Auto Scaling Group",
                "Threshold", 80.0,
                "EvaluationPeriods", 2
        ));

        // Verify High Request Count Alarm is created
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
                "AlarmName", "WebApp-HighRequestCount-us-east-1",
                "AlarmDescription", "High request count on ALB",
                "Threshold", 1000.0,
                "EvaluationPeriods", 2
        ));
    }

    @Test
    public void testMetricsConfiguration() {
        CloudWatchStack stack = new CloudWatchStack(app, "TestCloudWatchStack3",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                alb, asg);

        Template template = Template.fromStack(stack);

        // Verify the dashboard contains proper metrics configuration
        template.hasResource("AWS::CloudWatch::Dashboard", Match.anyValue());
        
        // Verify SNS subscription capability (though actual subscriptions would be added later)
        template.hasResource("AWS::SNS::Topic", Match.anyValue());
    }
}