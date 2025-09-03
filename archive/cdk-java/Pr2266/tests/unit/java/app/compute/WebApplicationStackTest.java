package app.compute;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;

import app.networking.VpcStack;
import app.networking.SecurityGroupStack;

import java.util.Map;

public class WebApplicationStackTest {

    private App app;
    private Vpc vpc;
    private SecurityGroup albSecurityGroup;
    private SecurityGroup webServerSecurityGroup;

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
        albSecurityGroup = securityStack.getAlbSecurityGroup();
        webServerSecurityGroup = securityStack.getWebServerSecurityGroup();
    }

    @Test
    public void testApplicationLoadBalancerCreation() {
        WebApplicationStack stack = new WebApplicationStack(app, "TestWebAppStack",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, albSecurityGroup, webServerSecurityGroup);

        Template template = Template.fromStack(stack);

        // Verify ALB is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
                "Scheme", "internet-facing",
                "Type", "application"
        ));

        // Verify target group is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
                "Port", 80,
                "Protocol", "HTTP",
                "TargetType", "instance"
        ));

        // Verify listener is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Map.of(
                "Port", 80,
                "Protocol", "HTTP"
        ));

        // Verify getters work
        assertThat(stack.getAlb()).isNotNull();
        assertThat(stack.getTargetGroup()).isNotNull();
    }

    @Test
    public void testHealthCheckConfiguration() {
        WebApplicationStack stack = new WebApplicationStack(app, "TestWebAppStack2",
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build(),
                vpc, albSecurityGroup, webServerSecurityGroup);

        Template template = Template.fromStack(stack);

        // Verify health check configuration on target group
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
                "HealthCheckPath", "/health",
                "HealthCheckProtocol", "HTTP",
                "HealthCheckPort", "80",
                "HealthyThresholdCount", 2,
                "UnhealthyThresholdCount", 5,
                "HealthCheckTimeoutSeconds", 30,
                "HealthCheckIntervalSeconds", 60
        ));
    }
}