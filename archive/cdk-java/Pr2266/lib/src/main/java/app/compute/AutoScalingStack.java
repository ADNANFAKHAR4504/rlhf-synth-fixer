package app.compute;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.cloudwatch.*;
import software.constructs.Construct;

import java.util.List;

public class AutoScalingStack extends Stack {
    private final AutoScalingGroup autoScalingGroup;
    
    public AutoScalingStack(final Construct scope, final String id, final StackProps props,
                          final Vpc vpc, final SecurityGroup webServerSecurityGroup,
                          final ApplicationTargetGroup targetGroup) {
        super(scope, id, props);
        
        // User data for web server setup
        UserData userData = UserData.forLinux();
        userData.addCommands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<html><body><h1>Web Server Running</h1><p>Region: " + this.getRegion() + "</p></body></html>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        );
        
        // Launch Template
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "WebServerTemplate")
                .machineImage(MachineImage.latestAmazonLinux2())
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                .securityGroup(webServerSecurityGroup)
                .userData(userData)
                .requireImdsv2(true)
                .build();
        
        // Auto Scaling Group
        this.autoScalingGroup = AutoScalingGroup.Builder.create(this, "WebAppASG")
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(2)
                .maxCapacity(10)
                .desiredCapacity(2)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .healthCheck(HealthCheck.elb(ElbHealthCheckOptions.builder()
                    .grace(software.amazon.awscdk.Duration.minutes(5))
                    .build()))
                .build();
        
        // Attach to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        
        // Scaling policies
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling",
            CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70)
                .cooldown(software.amazon.awscdk.Duration.minutes(3))
                .build());
        
        // Target tracking for ALB requests
        autoScalingGroup.scaleToTrackMetric("RequestCountScaling",
            MetricTargetTrackingProps.builder()
                .metric(targetGroup.metric("RequestCountPerTarget"))
                .targetValue(100)
                .cooldown(software.amazon.awscdk.Duration.minutes(3))
                .build());
    }
    
    public AutoScalingGroup getAutoScalingGroup() {
        return autoScalingGroup;
    }
}