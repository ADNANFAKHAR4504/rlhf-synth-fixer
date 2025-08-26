package app.compute;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.certificatemanager.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceTarget;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.route53.*;
import software.amazon.awscdk.services.s3.*;
import software.constructs.Construct;

import java.util.List;

public class WebApplicationStack extends Stack {
    private final ApplicationLoadBalancer alb;
    private final ApplicationTargetGroup targetGroup;
    
    public WebApplicationStack(final Construct scope, final String id, final StackProps props,
                             final Vpc vpc, final SecurityGroup albSecurityGroup, 
                             final SecurityGroup webServerSecurityGroup) {
        super(scope, id, props);
        
        // Create Application Load Balancer
        this.alb = ApplicationLoadBalancer.Builder.create(this, "WebAppALB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .build())
                .build();
        
        // Create Target Group
        this.targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargets")
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                    .enabled(true)
                    .path("/health")
                    .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
                    .port("80")
                    .healthyThresholdCount(2)
                    .unhealthyThresholdCount(5)
                    .timeout(software.amazon.awscdk.Duration.seconds(30))
                    .interval(software.amazon.awscdk.Duration.seconds(60))
                    .build())
                .build();
        
        // HTTP Listener
        ApplicationListener httpListener = alb.addListener("HttpListener",
            BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .build());
        
        httpListener.addTargetGroups("HttpTargets",
            AddApplicationTargetGroupsProps.builder()
                .targetGroups(List.of(targetGroup))
                .build());
        
        // Note: ALB access logging can be configured but requires a bucket with proper permissions
        // To enable logging, create an S3 bucket with the appropriate policy for ALB access logs
    }
    
    public ApplicationLoadBalancer getAlb() {
        return alb;
    }
    
    public ApplicationTargetGroup getTargetGroup() {
        return targetGroup;
    }
}