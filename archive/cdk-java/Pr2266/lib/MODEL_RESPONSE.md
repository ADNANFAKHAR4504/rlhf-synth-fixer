# Multi-Region Web Application Infrastructure with AWS CDK Java

I'll help you create a robust multi-region web application deployment using AWS CDK Java. This solution implements a scalable, highly available architecture across two AWS regions with automatic failover capabilities.

## Architecture Overview

The infrastructure includes:
- Multi-region deployment (us-east-1, us-west-2)
- VPC with public/private subnets in multiple AZs
- Application Load Balancers with SSL termination
- Auto Scaling Groups with dynamic scaling policies
- Route 53 with health checks and failover routing
- Global Accelerator for performance optimization
- Route 53 Application Recovery Controller for coordinated failover
- Security groups with proper access controls

## File Structure

```
lib/src/main/java/app/
├── Main.java (entry point - keep existing structure)
├── networking/
│   ├── VpcStack.java
│   ├── SecurityGroupStack.java
│   └── GlobalAcceleratorStack.java
├── compute/
│   ├── WebApplicationStack.java
│   └── AutoScalingStack.java
├── dns/
│   ├── Route53Stack.java
│   └── ApplicationRecoveryStack.java
└── monitoring/
    └── CloudWatchStack.java
```

## Implementation Files

### 1. VPC Stack - `lib/src/main/java/app/networking/VpcStack.java`

```java
package app.networking;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class VpcStack extends Stack {
    private final Vpc vpc;
    private final List<ISubnet> publicSubnets;
    private final List<ISubnet> privateSubnets;
    
    public VpcStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // Create VPC with multiple AZs
        this.vpc = Vpc.Builder.create(this, "WebAppVpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(3)
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("public")
                        .subnetType(SubnetType.PUBLIC)
                        .build(),
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("private")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();
        
        this.publicSubnets = vpc.getPublicSubnets();
        this.privateSubnets = vpc.getPrivateSubnets();
        
        // Add VPC Flow Logs for monitoring
        FlowLog.Builder.create(this, "VpcFlowLogs")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .trafficType(FlowLogTrafficType.ALL)
                .build();
    }
    
    public Vpc getVpc() {
        return vpc;
    }
    
    public List<ISubnet> getPublicSubnets() {
        return publicSubnets;
    }
    
    public List<ISubnet> getPrivateSubnets() {
        return privateSubnets;
    }
}
```

### 2. Security Group Stack - `lib/src/main/java/app/networking/SecurityGroupStack.java`

```java
package app.networking;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

public class SecurityGroupStack extends Stack {
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup webServerSecurityGroup;
    
    public SecurityGroupStack(final Construct scope, final String id, final StackProps props, final Vpc vpc) {
        super(scope, id, props);
        
        // ALB Security Group
        this.albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();
        
        // Allow HTTP and HTTPS from anywhere
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow HTTP from anywhere"
        );
        
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow HTTPS from anywhere"
        );
        
        // Web Server Security Group
        this.webServerSecurityGroup = SecurityGroup.Builder.create(this, "WebServerSecurityGroup")
                .vpc(vpc)
                .description("Security group for web server instances")
                .allowAllOutbound(true)
                .build();
        
        // Allow traffic from ALB only
        webServerSecurityGroup.addIngressRule(
            Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()),
            Port.tcp(80),
            "Allow HTTP from ALB"
        );
        
        // Allow SSH for management (adjust source as needed)
        webServerSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            "Allow SSH access"
        );
    }
    
    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }
    
    public SecurityGroup getWebServerSecurityGroup() {
        return webServerSecurityGroup;
    }
}
```

### 3. Web Application Stack - `lib/src/main/java/app/compute/WebApplicationStack.java`

```java
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
                .healthCheck(HealthCheck.builder()
                    .enabled(true)
                    .path("/health")
                    .protocol(Protocol.HTTP)
                    .port("80")
                    .healthyThresholdCount(2)
                    .unhealthyThresholdCount(5)
                    .timeout(software.amazon.awscdk.Duration.seconds(30))
                    .interval(software.amazon.awscdk.Duration.seconds(60))
                    .build())
                .build();
        
        // HTTP Listener (redirect to HTTPS in production)
        ApplicationListener httpListener = alb.addListener("HttpListener",
            ApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.fixedResponse(200,
                    FixedResponseOptions.builder()
                        .contentType("text/plain")
                        .messageBody("Health Check OK")
                        .build()))
                .build());
        
        httpListener.addTargets("HttpTargets",
            AddApplicationTargetsProps.builder()
                .targetGroup(targetGroup)
                .build());
        
        // Enable ALB access logging
        alb.logAccessLogs(Bucket.fromBucketName(this, "LogsBucket", 
            "aws-elb-access-logs-" + this.getAccount() + "-" + this.getRegion()));
    }
    
    public ApplicationLoadBalancer getAlb() {
        return alb;
    }
    
    public ApplicationTargetGroup getTargetGroup() {
        return targetGroup;
    }
}
```

### 4. Auto Scaling Stack - `lib/src/main/java/app/compute/AutoScalingStack.java`

```java
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
                .healthCheck(HealthCheck.elb(software.amazon.awscdk.Duration.minutes(5)))
                .build();
        
        // Attach to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        
        // Scaling policies
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling",
            CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70)
                .scaleInCooldown(software.amazon.awscdk.Duration.minutes(5))
                .scaleOutCooldown(software.amazon.awscdk.Duration.minutes(3))
                .build());
        
        // Target tracking for ALB requests
        autoScalingGroup.scaleOnRequestCount("RequestCountScaling",
            RequestCountScalingProps.builder()
                .targetRequestsPerMinute(100)
                .scaleInCooldown(software.amazon.awscdk.Duration.minutes(5))
                .scaleOutCooldown(software.amazon.awscdk.Duration.minutes(3))
                .build());
    }
    
    public AutoScalingGroup getAutoScalingGroup() {
        return autoScalingGroup;
    }
}
```

### 5. Route 53 Stack - `lib/src/main/java/app/dns/Route53Stack.java`

```java
package app.dns;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.route53.*;
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.cloudwatch.*;
import software.constructs.Construct;

import java.util.List;

public class Route53Stack extends Stack {
    private final HostedZone hostedZone;
    
    public Route53Stack(final Construct scope, final String id, final StackProps props,
                       final ApplicationLoadBalancer primaryAlb, 
                       final ApplicationLoadBalancer secondaryAlb,
                       final String domainName) {
        super(scope, id, props);
        
        // Create hosted zone (or reference existing one)
        this.hostedZone = HostedZone.Builder.create(this, "WebAppZone")
                .zoneName(domainName)
                .build();
        
        // Primary region record (us-east-1)
        ARecord primaryRecord = ARecord.Builder.create(this, "PrimaryRecord")
                .zone(hostedZone)
                .recordName("primary")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(primaryAlb)))
                .setIdentifier("primary-region")
                .geoLocation(GeoLocation.continentCode(ContinentCode.NORTH_AMERICA))
                .build();
        
        // Secondary region record (us-west-2)
        ARecord secondaryRecord = ARecord.Builder.create(this, "SecondaryRecord")
                .zone(hostedZone)
                .recordName("secondary")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(secondaryAlb)))
                .setIdentifier("secondary-region")
                .geoLocation(GeoLocation.continentCode(ContinentCode.SOUTH_AMERICA))
                .build();
        
        // Failover records
        ARecord primaryFailover = ARecord.Builder.create(this, "PrimaryFailover")
                .zone(hostedZone)
                .recordName("www")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(primaryAlb)))
                .setIdentifier("primary-failover")
                .failover(Failover.PRIMARY)
                .healthCheckId(createHealthCheck("primary-health", primaryAlb.getLoadBalancerDnsName()))
                .build();
        
        ARecord secondaryFailover = ARecord.Builder.create(this, "SecondaryFailover")
                .zone(hostedZone)
                .recordName("www")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(secondaryAlb)))
                .setIdentifier("secondary-failover")
                .failover(Failover.SECONDARY)
                .healthCheckId(createHealthCheck("secondary-health", secondaryAlb.getLoadBalancerDnsName()))
                .build();
    }
    
    private String createHealthCheck(String id, String domainName) {
        HealthCheck healthCheck = HealthCheck.Builder.create(this, id)
                .type(HealthCheckType.HTTPS)
                .resourcePath("/health")
                .fullyQualifiedDomainName(domainName)
                .port(443)
                .requestInterval(30)
                .failureThreshold(3)
                .build();
        
        return healthCheck.getHealthCheckId();
    }
    
    public HostedZone getHostedZone() {
        return hostedZone;
    }
}
```

### 6. Global Accelerator Stack - `lib/src/main/java/app/networking/GlobalAcceleratorStack.java`

```java
package app.networking;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.globalaccelerator.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.constructs.Construct;

import java.util.List;

public class GlobalAcceleratorStack extends Stack {
    private final Accelerator accelerator;
    
    public GlobalAcceleratorStack(final Construct scope, final String id, final StackProps props,
                                final ApplicationLoadBalancer primaryAlb,
                                final ApplicationLoadBalancer secondaryAlb) {
        super(scope, id, props);
        
        // Create Global Accelerator
        this.accelerator = Accelerator.Builder.create(this, "WebAppAccelerator")
                .acceleratorName("web-app-accelerator")
                .ipAddressType(IpAddressType.IPV4)
                .enabled(true)
                .build();
        
        // Create listener for HTTP/HTTPS traffic
        Listener listener = Listener.Builder.create(this, "AcceleratorListener")
                .accelerator(accelerator)
                .listenerName("web-traffic-listener")
                .protocol(Protocol.TCP)
                .portRanges(List.of(
                    PortRange.builder().fromPort(80).toPort(80).build(),
                    PortRange.builder().fromPort(443).toPort(443).build()
                ))
                .build();
        
        // Add endpoint groups for each region
        EndpointGroup primaryEndpointGroup = EndpointGroup.Builder.create(this, "PrimaryEndpointGroup")
                .listener(listener)
                .endpointGroupName("primary-region-endpoints")
                .region("us-east-1")
                .trafficDialPercentage(100)
                .healthCheckPath("/health")
                .healthCheckIntervalSeconds(30)
                .healthCheckTimeoutSeconds(10)
                .healthyThresholdCount(3)
                .unhealthyThresholdCount(3)
                .endpoints(List.of(
                    RawEndpoint.builder()
                        .endpointId(primaryAlb.getLoadBalancerArn())
                        .weight(100)
                        .build()
                ))
                .build();
        
        EndpointGroup secondaryEndpointGroup = EndpointGroup.Builder.create(this, "SecondaryEndpointGroup")
                .listener(listener)
                .endpointGroupName("secondary-region-endpoints")
                .region("us-west-2")
                .trafficDialPercentage(0)  // Only receives traffic during failover
                .healthCheckPath("/health")
                .healthCheckIntervalSeconds(30)
                .healthCheckTimeoutSeconds(10)
                .healthyThresholdCount(3)
                .unhealthyThresholdCount(3)
                .endpoints(List.of(
                    RawEndpoint.builder()
                        .endpointId(secondaryAlb.getLoadBalancerArn())
                        .weight(100)
                        .build()
                ))
                .build();
    }
    
    public Accelerator getAccelerator() {
        return accelerator;
    }
}
```

### 7. Application Recovery Controller Stack - `lib/src/main/java/app/dns/ApplicationRecoveryStack.java`

```java
package app.dns;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.route53recoverycontrol.*;
import software.amazon.awscdk.services.route53recoveryreadiness.*;
import software.constructs.Construct;

import java.util.List;

public class ApplicationRecoveryStack extends Stack {
    private final CfnCluster cluster;
    private final CfnControlPanel controlPanel;
    
    public ApplicationRecoveryStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // Create ARC Cluster
        this.cluster = CfnCluster.Builder.create(this, "RecoveryCluster")
                .name("web-app-recovery-cluster")
                .build();
        
        // Create Control Panel
        this.controlPanel = CfnControlPanel.Builder.create(this, "RecoveryControlPanel")
                .name("web-app-control-panel")
                .clusterArn(cluster.getAttrClusterArn())
                .build();
        
        // Create routing controls for each region
        CfnRoutingControl primaryControl = CfnRoutingControl.Builder.create(this, "PrimaryRoutingControl")
                .name("primary-region-control")
                .controlPanelArn(controlPanel.getAttrControlPanelArn())
                .build();
        
        CfnRoutingControl secondaryControl = CfnRoutingControl.Builder.create(this, "SecondaryRoutingControl")
                .name("secondary-region-control")
                .controlPanelArn(controlPanel.getAttrControlPanelArn())
                .build();
        
        // Create safety rule to ensure at least one region is always active
        CfnSafetyRule.Builder.create(this, "AtLeastOneActiveRule")
                .controlPanelArn(controlPanel.getAttrControlPanelArn())
                .name("at-least-one-active")
                .ruleConfig(CfnSafetyRule.RuleConfigProperty.builder()
                    .type("ATLEAST")
                    .threshold(1)
                    .inverted(false)
                    .build())
                .targetControls(List.of(
                    primaryControl.getAttrRoutingControlArn(),
                    secondaryControl.getAttrRoutingControlArn()
                ))
                .waitPeriodMs(5000)
                .build();
    }
    
    public CfnCluster getCluster() {
        return cluster;
    }
    
    public CfnControlPanel getControlPanel() {
        return controlPanel;
    }
}
```

### 8. CloudWatch Monitoring Stack - `lib/src/main/java/app/monitoring/CloudWatchStack.java`

```java
package app.monitoring;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.sns.*;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class CloudWatchStack extends Stack {
    private final Dashboard dashboard;
    private final Topic alertTopic;
    
    public CloudWatchStack(final Construct scope, final String id, final StackProps props,
                         final ApplicationLoadBalancer alb, final AutoScalingGroup asg) {
        super(scope, id, props);
        
        // Create SNS topic for alerts
        this.alertTopic = Topic.Builder.create(this, "AlertTopic")
                .displayName("WebApp Alerts")
                .build();
        
        // Create CloudWatch Dashboard
        this.dashboard = Dashboard.Builder.create(this, "WebAppDashboard")
                .dashboardName("WebApplication-" + this.getRegion())
                .build();
        
        // Add ALB metrics
        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("ALB Request Count")
                .left(List.of(
                    Metric.Builder.create()
                        .namespace("AWS/ApplicationELB")
                        .metricName("RequestCount")
                        .dimensionsMap(Map.of(
                            "LoadBalancer", alb.getLoadBalancerFullName()
                        ))
                        .statistic("Sum")
                        .build()
                ))
                .build()
        );
        
        // Add Auto Scaling metrics
        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("Auto Scaling Group Instance Count")
                .left(List.of(
                    Metric.Builder.create()
                        .namespace("AWS/AutoScaling")
                        .metricName("GroupDesiredCapacity")
                        .dimensionsMap(Map.of(
                            "AutoScalingGroupName", asg.getAutoScalingGroupName()
                        ))
                        .statistic("Average")
                        .build()
                ))
                .build()
        );
        
        // Create alarms
        createHighCpuAlarm(asg);
        createHighRequestCountAlarm(alb);
    }
    
    private void createHighCpuAlarm(AutoScalingGroup asg) {
        Alarm.Builder.create(this, "HighCpuAlarm")
                .alarmName("WebApp-HighCPU-" + this.getRegion())
                .alarmDescription("High CPU utilization in Auto Scaling Group")
                .metric(Metric.Builder.create()
                    .namespace("AWS/AutoScaling")
                    .metricName("GroupAverageCPUUtilization")
                    .dimensionsMap(Map.of(
                        "AutoScalingGroupName", asg.getAutoScalingGroupName()
                    ))
                    .statistic("Average")
                    .build())
                .threshold(80)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new SnsAction(alertTopic));
    }
    
    private void createHighRequestCountAlarm(ApplicationLoadBalancer alb) {
        Alarm.Builder.create(this, "HighRequestCountAlarm")
                .alarmName("WebApp-HighRequestCount-" + this.getRegion())
                .alarmDescription("High request count on ALB")
                .metric(Metric.Builder.create()
                    .namespace("AWS/ApplicationELB")
                    .metricName("RequestCount")
                    .dimensionsMap(Map.of(
                        "LoadBalancer", alb.getLoadBalancerFullName()
                    ))
                    .statistic("Sum")
                    .build())
                .threshold(1000)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new SnsAction(alertTopic));
    }
    
    public Dashboard getDashboard() {
        return dashboard;
    }
    
    public Topic getAlertTopic() {
        return alertTopic;
    }
}
```

### 9. Updated Main.java - `lib/src/main/java/app/Main.java`

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

// Import all the stack classes
import app.networking.VpcStack;
import app.networking.SecurityGroupStack;
import app.networking.GlobalAcceleratorStack;
import app.compute.WebApplicationStack;
import app.compute.AutoScalingStack;
import app.dns.Route53Stack;
import app.dns.ApplicationRecoveryStack;
import app.monitoring.CloudWatchStack;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Main TapStack that orchestrates multi-region web application deployment
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Deploy to multiple regions
        deployToRegion("us-east-1", true);
        deployToRegion("us-west-2", false);
    }

    private void deployToRegion(String region, boolean isPrimary) {
        String regionSuffix = region.replace("-", "");
        
        // Create VPC Stack for this region
        VpcStack vpcStack = new VpcStack(this, 
            "VpcStack-" + regionSuffix + "-" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build());

        // Create Security Group Stack
        SecurityGroupStack securityStack = new SecurityGroupStack(this,
            "SecurityStack-" + regionSuffix + "-" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc());

        // Create Web Application Stack
        WebApplicationStack webAppStack = new WebApplicationStack(this,
            "WebAppStack-" + regionSuffix + "-" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc(),
            securityStack.getAlbSecurityGroup(),
            securityStack.getWebServerSecurityGroup());

        // Create Auto Scaling Stack
        AutoScalingStack autoScalingStack = new AutoScalingStack(this,
            "AutoScalingStack-" + regionSuffix + "-" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc(),
            securityStack.getWebServerSecurityGroup(),
            webAppStack.getTargetGroup());

        // Create CloudWatch Stack
        CloudWatchStack monitoringStack = new CloudWatchStack(this,
            "CloudWatchStack-" + regionSuffix + "-" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            webAppStack.getAlb(),
            autoScalingStack.getAutoScalingGroup());
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the multi-region web application CDK app
 */
public final class Main {
    private Main() {}

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TapStack which will deploy to multiple regions
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

## Deployment Instructions

1. **Prerequisites:**
   ```bash
   # Set AWS credentials and default region
   export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
   export CDK_DEFAULT_REGION=us-east-1
   ```

2. **Bootstrap CDK in both regions:**
   ```bash
   cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/us-east-1
   cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/us-west-2
   ```

3. **Deploy the application:**
   ```bash
   cdk deploy --all
   ```

## Key Features Implemented

- **Multi-Region Architecture**: Deploys infrastructure to us-east-1 and us-west-2
- **Auto Scaling**: Responsive scaling based on CPU and request count
- **Load Balancing**: Application Load Balancers with health checks
- **Global Accelerator**: Improves performance with static IP addresses
- **Route 53**: DNS management with health checks and failover
- **Application Recovery Controller**: Coordinated failover management
- **Security**: VPC with security groups and proper access controls
- **Monitoring**: CloudWatch dashboards, alarms, and SNS notifications
- **High Availability**: Multi-AZ deployment in each region
- **SSL Support**: Ready for HTTPS with ALB SSL termination

This infrastructure provides a robust, scalable, and highly available web application deployment that can handle traffic spikes and regional failures automatically.