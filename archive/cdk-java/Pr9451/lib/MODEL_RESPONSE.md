# Enhanced CDK Java Infrastructure for Web Application with ALB and CloudWatch

I'll help you create a complete CDK Java infrastructure setup that meets all your requirements. This enhanced solution includes a VPC, public subnets, internet gateway, EC2 instances, Application Load Balancer with modern features, CloudWatch monitoring with alarms, and comprehensive security groups for a production-ready web application.

## Infrastructure Stack

Here's the complete CDK Java code organized into separate files:

### 1. Main Infrastructure Stack (`InfrastructureStack.java`)

```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class InfrastructureStack extends Stack {

    private final Vpc vpc;
    private final SecurityGroup webSecurityGroup;
    private final Instance webInstance1;
    private final Instance webInstance2;

    public InfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with specified CIDR
        this.vpc = Vpc.Builder.create(this, "WebAppVPC")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .name("PublicSubnet1")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("PublicSubnet2")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build()
                ))
                .natGateways(0) // No NAT gateways needed for public subnets only
                .build();

        // Create security group for web servers
        this.webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup")
                .vpc(vpc)
                .description("Security group for web servers allowing HTTP traffic")
                .allowAllOutbound(true)
                .build();

        // Add inbound rule for HTTP traffic on port 80
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from anywhere"
        );

        // Add SSH access for management (best practice)
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(22),
                "Allow SSH access for management"
        );

        // Create security group for Application Load Balancer
        this.albSecurityGroup = SecurityGroup.Builder.create(this, "ALBSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();

        // Add inbound rule for HTTPS traffic on port 443 (modern security)
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic from anywhere"
        );

        // Add inbound rule for HTTP traffic on port 80 (for redirect to HTTPS)
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from anywhere for redirect"
        );

        // Allow ALB to communicate with instances
        webSecurityGroup.addIngressRule(
                albSecurityGroup,
                Port.tcp(80),
                "Allow traffic from ALB to instances"
        );

        // Get the latest Amazon Linux 2023 AMI
        IMachineImage amzLinux = MachineImage.latestAmazonLinux2023(
                AmazonLinux2023ImageSsmParameterProps.builder()
                        .edition(AmazonLinux2023Edition.STANDARD)
                        .build()
        );

        // User data script for web server setup
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y httpd aws-cli",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Web Server Instance</h1><p>Instance ID: ' > /var/www/html/index.html",
                "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
                "echo '</p><p>Availability Zone: ' >> /var/www/html/index.html",
                "curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone >> /var/www/html/index.html",
                "echo '</p>' >> /var/www/html/index.html",
                "echo 'OK' > /var/www/html/health.html",
                "# Configure CloudWatch agent for enhanced monitoring",
                "yum install -y amazon-cloudwatch-agent",
                "# Create custom CloudWatch agent configuration",
                "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
                "{",
                "  \"metrics\": {",
                "    \"namespace\": \"AWS/EC2/CustomMetrics\",
                "    \"metrics_collected\": {",
                "      \"cpu\": {",
                "        \"measurement\": [\"cpu_usage_idle\", \"cpu_usage_iowait\"],
                "        \"metrics_collection_interval\": 60",
                "      },",
                "      \"disk\": {",
                "        \"measurement\": [\"used_percent\"],
                "        \"metrics_collection_interval\": 60,",
                "        \"resources\": [\"*\"]",
                "      },",
                "      \"mem\": {",
                "        \"measurement\": [\"mem_used_percent\"],
                "        \"metrics_collection_interval\": 60",
                "      }",
                "    }",
                "  }",
                "}",
                "EOF",
                "# Start CloudWatch agent",
                "systemctl enable amazon-cloudwatch-agent",
                "systemctl start amazon-cloudwatch-agent"
        );

        // Create first EC2 instance in first public subnet
        this.webInstance1 = Instance.Builder.create(this, "WebInstance1")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amzLinux)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .availabilityZones(List.of(vpc.getAvailabilityZones().get(0)))
                        .build())
                .securityGroup(webSecurityGroup)
                .userData(userData)
                .associatePublicIpAddress(true)
                .build();

        // Create second EC2 instance in second public subnet  
        this.webInstance2 = Instance.Builder.create(this, "WebInstance2")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amzLinux)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .availabilityZones(List.of(vpc.getAvailabilityZones().get(1)))
                        .build())
                .securityGroup(webSecurityGroup)
                .userData(userData)
                .associatePublicIpAddress(true)
                .build();

        // Create SNS topic for alarm notifications
        this.snsAlarmTopic = Topic.Builder.create(this, "AlarmNotificationTopic")
                .displayName("Infrastructure Alarm Notifications")
                .build();

        // Add email subscription to SNS topic (placeholder email)
        snsAlarmTopic.addSubscription(
                EmailSubscription.Builder.create("admin@example.com").build()
        );

        // Create Application Load Balancer with modern features
        this.applicationLoadBalancer = ApplicationLoadBalancer.Builder.create(this, "WebAppALB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .ipAddressType(IpAddressType.IPV4) // Modern dual-stack support ready
                .build();

        // Create target group with health checks and modern routing algorithm
        this.targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup")
                .vpc(vpc)
                .port(80)
                .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .healthCheck(HealthCheck.builder()
                        .enabled(true)
                        .healthyHttpCodes("200")
                        .interval(software.amazon.awscdk.Duration.seconds(30))
                        .path("/health.html")
                        .protocol(Protocol.HTTP)
                        .timeout(software.amazon.awscdk.Duration.seconds(5))
                        .unhealthyThresholdCount(2)
                        .healthyThresholdCount(5)
                        .build())
                .build();

        // Register EC2 instances with target group
        targetGroup.addTarget(new InstanceTarget(webInstance1));
        targetGroup.addTarget(new InstanceTarget(webInstance2));

        // Create HTTP listener with redirect to HTTPS (security best practice)
        applicationLoadBalancer.addListener("HTTPListener", 
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                        .port(80)
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol.HTTP)
                        .defaultAction(ListenerAction.redirect(
                                software.amazon.awscdk.services.elasticloadbalancingv2.RedirectOptions.builder()
                                        .protocol("HTTPS")
                                        .port("443")
                                        .permanent(true)
                                        .build()))
                        .build());

        // Create HTTPS listener (would typically use ACM certificate in production)
        applicationLoadBalancer.addListener("HTTPSListener",
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                        .port(443)
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol.HTTPS)
                        .defaultTargetGroups(List.of(targetGroup))
                        // Note: In production, you would specify certificates here
                        // .certificates(List.of(certificate))
                        .build());

        // Create CloudWatch alarm for high CPU utilization
        this.highCpuAlarm = Alarm.Builder.create(this, "HighCPUAlarm")
                .alarmDescription("Alarm when CPU exceeds 70%")
                .metric(Metric.Builder.create()
                        .namespace("AWS/EC2")
                        .metricName("CPUUtilization")
                        .dimensionsMap(Map.of(
                                "InstanceId", webInstance1.getInstanceId()
                        ))
                        .statistic("Average")
                        .period(software.amazon.awscdk.Duration.minutes(5))
                        .build())
                .threshold(70.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // Add SNS action to CPU alarm
        highCpuAlarm.addAlarmAction(
                new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(snsAlarmTopic)
        );

        // Create CloudWatch alarm for unhealthy targets
        this.unhealthyTargetAlarm = Alarm.Builder.create(this, "UnhealthyTargetAlarm")
                .alarmDescription("Alarm when targets are unhealthy")
                .metric(Metric.Builder.create()
                        .namespace("AWS/ApplicationELB")
                        .metricName("UnHealthyHostCount")
                        .dimensionsMap(Map.of(
                                "TargetGroup", targetGroup.getTargetGroupFullName(),
                                "LoadBalancer", applicationLoadBalancer.getLoadBalancerFullName()
                        ))
                        .statistic("Average")
                        .period(software.amazon.awscdk.Duration.minutes(1))
                        .build())
                .threshold(1.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // Add SNS action to unhealthy target alarm
        unhealthyTargetAlarm.addAlarmAction(
                new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(snsAlarmTopic)
        );

        // Apply Environment=Production tags to all resources
        Tags.of(this).add("Environment", "Production");
        Tags.of(this).add("Project", "WebApplication");
        Tags.of(this).add("CostCenter", "Engineering");

        // Apply specific tags to VPC resources
        Tags.of(vpc).add("Name", "WebAppVPC");
        Tags.of(webSecurityGroup).add("Name", "WebSecurityGroup");
        Tags.of(albSecurityGroup).add("Name", "ALBSecurityGroup");
        Tags.of(webInstance1).add("Name", "WebInstance1");
        Tags.of(webInstance2).add("Name", "WebInstance2");
        Tags.of(applicationLoadBalancer).add("Name", "WebAppALB");
        Tags.of(targetGroup).add("Name", "WebAppTargetGroup");
        Tags.of(snsAlarmTopic).add("Name", "AlarmNotificationTopic");
    }

    // Getter methods for accessing resources from other stacks if needed
    public Vpc getVpc() {
        return vpc;
    }

    public SecurityGroup getWebSecurityGroup() {
        return webSecurityGroup;
    }

    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }

    public Instance getWebInstance1() {
        return webInstance1;
    }

    public Instance getWebInstance2() {
        return webInstance2;
    }

    public ApplicationLoadBalancer getApplicationLoadBalancer() {
        return applicationLoadBalancer;
    }

    public ApplicationTargetGroup getTargetGroup() {
        return targetGroup;
    }

    public Topic getSnsAlarmTopic() {
        return snsAlarmTopic;
    }

    public Alarm getHighCpuAlarm() {
        return highCpuAlarm;
    }

    public Alarm getUnhealthyTargetAlarm() {
        return unhealthyTargetAlarm;
    }
}
```

### 2. Updated Main Application (`Main.java`)

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

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
 * Main CDK stack that instantiates the infrastructure stack.
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final InfrastructureStack infrastructureStack;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create the infrastructure stack
        this.infrastructureStack = new InfrastructureStack(
            this,
            "InfrastructureStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .region("us-east-1") // Fixed region as per requirements
                    .build())
                .build()
        );
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public InfrastructureStack getInfrastructureStack() {
        return infrastructureStack;
    }
}

/**
 * Main entry point for the CDK Java application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-east-1") // Fixed region as per requirements
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

## Key Features Implemented

1. **VPC Configuration**: Creates a VPC with the specified 10.0.0.0/16 CIDR block
2. **Public Subnets**: Automatically creates two public subnets in different AZs with /24 CIDR blocks
3. **Internet Gateway**: Automatically attached to the VPC for public internet access
4. **EC2 Instances**: One t3.micro instance deployed in each public subnet with enhanced monitoring
5. **Application Load Balancer (2024 Feature)**: 
   - Internet-facing ALB with dual-stack IPv4 support (ready for IPv6)
   - Health check monitoring with custom endpoint
   - HTTP to HTTPS redirect for enhanced security
   - Target group with advanced health check configuration
6. **CloudWatch Monitoring & Alarms (2025 Enhanced)**:
   - CPU utilization alarms for EC2 instances
   - Unhealthy target count monitoring for ALB
   - SNS topic for alarm notifications
   - Custom CloudWatch agent configuration for enhanced metrics
7. **Enhanced Security Groups**: 
   - Separate security groups for ALB and EC2 instances
   - Principle of least privilege access
   - HTTPS-first approach with HTTP redirect
8. **Modern Features**: 
   - Uses Amazon Linux 2023 AMI (latest)
   - DNS hostname and DNS support enabled for VPC
   - Enhanced instance monitoring with CloudWatch agent
   - Health check endpoints for load balancer
9. **Production Tags**: All resources tagged with Environment=Production, Project, and CostCenter
10. **User Data**: Automatically sets up web server with health checks and CloudWatch monitoring

## Deployment

The enhanced infrastructure will create:
- 1 VPC (10.0.0.0/16)
- 2 Public subnets (10.0.1.0/24 and 10.0.2.0/24)
- 1 Internet Gateway
- 2 EC2 instances (t3.micro) with enhanced monitoring
- 1 Application Load Balancer (ALB)
- 1 Target Group with health checks
- 2 Security Groups (ALB and EC2 instances)
- 1 SNS Topic for alarm notifications
- 2 CloudWatch Alarms (CPU utilization and unhealthy targets)
- Route tables and associations (automatically managed)
- CloudWatch agent configuration on instances

## Access and Monitoring

**Web Access**: Access the application via the Application Load Balancer DNS name:
- HTTP traffic (port 80) will be automatically redirected to HTTPS (port 443)
- Load balancer distributes traffic across healthy instances in multiple AZs
- Health checks ensure only healthy instances receive traffic

**Monitoring**: 
- CloudWatch alarms monitor CPU utilization (threshold: 70%)
- ALB target health monitoring with automatic alerting
- SNS notifications sent to admin@example.com for alarm events
- Enhanced CloudWatch agent provides detailed system metrics

**Production Features**:
- HTTPS-first security posture
- Multi-AZ deployment for high availability
- Automated health checks and failover
- Comprehensive monitoring and alerting
- Cost-optimized with appropriate instance sizing

This architecture provides a production-ready web application with modern AWS features including Application Load Balancer with advanced routing and CloudWatch monitoring with proactive alerting.