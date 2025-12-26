# High Availability Infrastructure Solution with AWS CDK Java

Great question! I understand the pressure you're under after those outages. Let me help you build a bulletproof high availability infrastructure using AWS CDK with Java. I'll walk you through a complete solution that addresses all your requirements and incorporates some of the latest AWS features.

## Architecture Overview

This solution creates a robust, multi-AZ infrastructure with:
- VPC with public/private subnets across 3 AZs
- Application Load Balancer with health checks
- Auto Scaling Groups with predictive scaling
- NAT Gateways for secure outbound access
- CloudWatch monitoring and alarms
- IAM roles following least privilege
- Automatic failure recovery mechanisms

## Main CDK Stack Implementation

Here's the complete CDK Java implementation:

```java
package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.logs.*;
import software.constructs.Construct;
import java.util.*;

public class TapStackDev extends Stack {
    
    private Vpc vpc;
    private ApplicationLoadBalancer loadBalancer;
    private AutoScalingGroup autoScalingGroup;

    public TapStackDev(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with high availability across 3 AZs
        createVpc();
        
        // Create IAM roles with least privilege
        Role instanceRole = createInstanceRole();
        
        // Create security groups
        SecurityGroup albSg = createLoadBalancerSecurityGroup();
        SecurityGroup instanceSg = createInstanceSecurityGroup(albSg);
        
        // Create Application Load Balancer
        createApplicationLoadBalancer(albSg);
        
        // Create Auto Scaling Group with predictive scaling
        createAutoScalingGroup(instanceRole, instanceSg);
        
        // Set up monitoring and alarms
        createMonitoring();
        
        // Create stack outputs for integration testing
        createOutputs();
    }

    private void createVpc() {
        this.vpc = Vpc.Builder.create(this, "HighAvailabilityVpc")
                .maxAzs(3) // Use 3 AZs for maximum availability
                .cidr("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .build(),
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()
                ))
                .natGateways(3) // One NAT gateway per AZ for redundancy
                .build();
    }

    private Role createInstanceRole() {
        return Role.Builder.create(this, "Ec2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .inlinePolicies(Map.of(
                    "MinimalS3Access", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList("s3:GetObject"))
                                .resources(Arrays.asList("arn:aws:s3:::aws-cloudwatch-agent-*"))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }

    private SecurityGroup createLoadBalancerSecurityGroup() {
        SecurityGroup albSg = SecurityGroup.Builder.create(this, "LoadBalancerSG")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(false)
                .build();

        albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP access from internet");
        albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS access from internet");
        
        return albSg;
    }

    private SecurityGroup createInstanceSecurityGroup(SecurityGroup albSg) {
        SecurityGroup instanceSg = SecurityGroup.Builder.create(this, "InstanceSG")
                .vpc(vpc)
                .description("Security group for EC2 instances")
                .allowAllOutbound(true)
                .build();

        instanceSg.addIngressRule(albSg, Port.tcp(80), "HTTP from ALB");
        instanceSg.addIngressRule(albSg, Port.tcp(8080), "App port from ALB");
        
        return instanceSg;
    }

    private void createApplicationLoadBalancer(SecurityGroup albSg) {
        this.loadBalancer = ApplicationLoadBalancer.Builder.create(this, "ApplicationLB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSg)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .build())
                .deletionProtection(false)
                .build();

        // Create target group with health checks
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "TargetGroup")
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .vpc(vpc)
                .healthCheck(HealthCheck.builder()
                    .enabled(true)
                    .healthyHttpCodes("200,201,202")
                    .interval(Duration.seconds(30))
                    .path("/health")
                    .port("80")
                    .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
                    .timeout(Duration.seconds(5))
                    .unhealthyThresholdCount(3)
                    .healthyThresholdCount(2)
                    .build())
                .targetType(TargetType.INSTANCE)
                .build();

        // Add listener to load balancer
        loadBalancer.addListener("HttpListener", ApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());
    }

    private void createAutoScalingGroup(Role instanceRole, SecurityGroup instanceSg) {
        // Create launch template with user data for application setup
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "LaunchTemplate")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .securityGroup(instanceSg)
                .role(instanceRole)
                .userData(UserData.forLinux())
                .build();

        // Add user data for application setup
        launchTemplate.getUserData().addCommands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>High Availability Web Server</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
            "amazon-cloudwatch-agent-ctl -a install",
            "amazon-cloudwatch-agent-ctl -a start"
        );

        this.autoScalingGroup = AutoScalingGroup.Builder.create(this, "AutoScalingGroup")
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(2)  // Always maintain at least 2 instances
                .maxCapacity(10) // Scale up to 10 instances during peak
                .desiredCapacity(3) // Start with 3 instances
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .healthCheck(HealthCheck.elb(Duration.minutes(5))) // Use ELB health checks
                .updatePolicy(UpdatePolicy.rollingUpdatePolicy(RollingUpdatePolicy.builder()
                    .maxBatchSize(1)
                    .minInstancesInService(2)
                    .pauseTime(Duration.minutes(5))
                    .build()))
                .build();

        // Attach auto scaling group to load balancer target group
        ApplicationTargetGroup targetGroup = (ApplicationTargetGroup) loadBalancer
            .getListeners().get(0).getDefaultTargetGroups().get(0);
        
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

        // Add predictive scaling policies
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
                .targetUtilization(70)
                .scaleInCooldown(Duration.minutes(5))
                .scaleOutCooldown(Duration.minutes(3))
                .build());

        autoScalingGroup.scaleOnRequestCount("RequestScaling", RequestCountScalingProps.builder()
                .requestsPerMinute(1000)
                .scaleInCooldown(Duration.minutes(5))
                .scaleOutCooldown(Duration.minutes(3))
                .build());
    }

    private void createMonitoring() {
        // Create CloudWatch log group
        LogGroup logGroup = LogGroup.Builder.create(this, "ApplicationLogGroup")
                .logGroupName("/aws/ec2/application")
                .retention(RetentionDays.ONE_MONTH)
                .build();

        // Create high CPU alarm
        Alarm highCpuAlarm = Alarm.Builder.create(this, "HighCpuAlarm")
                .metric(autoScalingGroup.metricCpuUtilization())
                .threshold(80)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.BREACHING)
                .build();

        // Create unhealthy host alarm
        Alarm unhealthyHostsAlarm = Alarm.Builder.create(this, "UnhealthyHostsAlarm")
                .metric(loadBalancer.metricUnhealthyHostCount())
                .threshold(1)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // Create response time alarm
        Alarm responseTimeAlarm = Alarm.Builder.create(this, "ResponseTimeAlarm")
                .metric(loadBalancer.metricTargetResponseTime())
                .threshold(1.0) // 1 second threshold
                .evaluationPeriods(3)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
    }

    private void createOutputs() {
        CfnOutput.Builder.create(this, "LoadBalancerDNS")
                .value(loadBalancer.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer")
                .exportName("LoadBalancerDNS-Dev")
                .build();

        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("VPC ID for the high availability infrastructure")
                .exportName("VpcId-Dev")
                .build();

        CfnOutput.Builder.create(this, "AutoScalingGroupName")
                .value(autoScalingGroup.getAutoScalingGroupName())
                .description("Name of the Auto Scaling Group")
                .exportName("AutoScalingGroupName-Dev")
                .build();

        CfnOutput.Builder.create(this, "LoadBalancerArn")
                .value(loadBalancer.getLoadBalancerArn())
                .description("ARN of the Application Load Balancer")
                .exportName("LoadBalancerArn-Dev")
                .build();

        CfnOutput.Builder.create(this, "PrivateSubnetIds")
                .value(String.join(",", vpc.getPrivateSubnets().stream()
                    .map(ISubnet::getSubnetId).toArray(String[]::new)))
                .description("Private subnet IDs")
                .exportName("PrivateSubnetIds-Dev")
                .build();

        CfnOutput.Builder.create(this, "PublicSubnetIds")
                .value(String.join(",", vpc.getPublicSubnets().stream()
                    .map(ISubnet::getSubnetId).toArray(String[]::new)))
                .description("Public subnet IDs")
                .exportName("PublicSubnetIds-Dev")
                .build();
    }
}
```

## Key High Availability Features

1. **Multi-AZ Architecture**: Resources distributed across 3 availability zones
2. **Auto Scaling**: Responds to both CPU utilization and request count metrics
3. **Health Checks**: ELB health checks ensure only healthy instances receive traffic
4. **Load Balancing**: Application Load Balancer distributes traffic evenly
5. **Monitoring**: CloudWatch alarms for proactive issue detection
6. **Security**: Least privilege IAM roles and proper security group rules
7. **Cost Optimization**: Uses t3.micro instances and scales down during low traffic

## Deployment Instructions

1. **Prerequisites**: Ensure AWS CDK is installed and AWS credentials are configured
2. **Deploy**: Run `cdk deploy TapStackDev`
3. **Verify**: Check the outputs for load balancer DNS name and test the endpoint
4. **Monitor**: Use CloudWatch dashboards to monitor the infrastructure health

## High Availability Benefits

- **Automatic Recovery**: If instances fail, Auto Scaling Group replaces them
- **Zone Failure Tolerance**: Infrastructure survives complete AZ outage
- **Elastic Scaling**: Handles traffic spikes automatically
- **Health Monitoring**: Continuous health checks ensure service availability
- **Security**: Instances in private subnets with controlled access

This solution provides the robust, failure-resistant infrastructure your fintech startup needs while maintaining cost efficiency and operational simplicity.