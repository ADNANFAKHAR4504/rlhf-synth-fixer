package app;

import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.IpAddressType;
import software.amazon.awscdk.services.elasticloadbalancingv2.Protocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceTarget;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.subscriptions.EmailSubscription;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class InfrastructureStack extends Stack {

    private final Vpc vpc;
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup albSecurityGroup;
    private final Instance webInstance1;
    private final Instance webInstance2;
    private final ApplicationLoadBalancer applicationLoadBalancer;
    private final ApplicationTargetGroup targetGroup;
    private final Topic snsAlarmTopic;
    private final Alarm highCpuAlarm;
    private final Alarm unhealthyTargetAlarm;
    private final String environmentSuffix;

    public InfrastructureStack(final Construct scope, final String id, final StackProps props) {
        this(scope, id, props, "");
    }

    public InfrastructureStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);
        this.environmentSuffix = environmentSuffix;

        // Detect LocalStack environment
        String awsEndpoint = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = awsEndpoint != null &&
            (awsEndpoint.contains("localhost") || awsEndpoint.contains("4566"));

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

        // Add inbound rule for HTTP traffic on port 80
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from anywhere"
        );

        // Allow ALB to communicate with instances
        webSecurityGroup.addIngressRule(
                albSecurityGroup,
                Port.tcp(80),
                "Allow traffic from ALB to instances"
        );

        // Create EC2 instances
        UserData userData = createUserData();
        // Use Amazon Linux 2023 AMI - LocalStack compatible
        // For LocalStack, the actual AMI ID doesn't matter as it uses mock instances
        IMachineImage amzLinux = MachineImage.latestAmazonLinux2023();

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
        Topic.Builder topicBuilder = Topic.Builder.create(this, "AlarmNotificationTopic")
                .displayName("Infrastructure Alarm Notifications");

        // Add RemovalPolicy for LocalStack cleanup
        if (isLocalStack) {
            topicBuilder = topicBuilder;
        }

        this.snsAlarmTopic = topicBuilder.build();

        // Apply removal policy to SNS topic for LocalStack
        if (isLocalStack) {
            this.snsAlarmTopic.applyRemovalPolicy(RemovalPolicy.DESTROY);
        }

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
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .onePerAz(true) // Ensure one subnet per AZ
                        .build())
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

        // Create HTTP listener - Note: In production, would redirect to HTTPS with proper certificates
        applicationLoadBalancer.addListener("HTTPListener", 
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                        .port(80)
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol.HTTP)
                        .defaultTargetGroups(List.of(targetGroup))
                        .build());

        // Create CloudWatch alarms
        this.highCpuAlarm = createHighCpuAlarm(webInstance1);
        this.unhealthyTargetAlarm = createUnhealthyTargetAlarm();

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

        // Export CloudFormation outputs for CI/CD validation
        software.amazon.awscdk.CfnOutput.Builder.create(this, "LoadBalancerDNS")
                .value(applicationLoadBalancer.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer")
                .exportName(String.format("WebAppALB-DNS-%s", environmentSuffix))
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName(String.format("WebAppVPC-ID-%s", environmentSuffix))
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "SNSTopicArn")
                .value(snsAlarmTopic.getTopicArn())
                .description("SNS Topic ARN for alarm notifications")
                .exportName(String.format("AlarmTopic-ARN-%s", environmentSuffix))
                .build();
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
    
    private UserData createUserData() {
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y httpd aws-cli amazon-cloudwatch-agent",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Web Server Instance</h1><p>Instance ID: ' > /var/www/html/index.html",
                "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
                "echo '</p><p>Availability Zone: ' >> /var/www/html/index.html",
                "curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone >> /var/www/html/index.html",
                "echo '</p>' >> /var/www/html/index.html",
                "echo 'OK' > /var/www/html/health.html",
                "# Configure and start CloudWatch agent with basic monitoring",
                "systemctl enable amazon-cloudwatch-agent",
                "systemctl start amazon-cloudwatch-agent"
        );
        return userData;
    }
    
    private Alarm createHighCpuAlarm(final Instance instance) {
        Alarm alarm = Alarm.Builder.create(this, "HighCPUAlarm")
                .alarmDescription("Alarm when CPU exceeds 70%")
                .metric(Metric.Builder.create()
                        .namespace("AWS/EC2")
                        .metricName("CPUUtilization")
                        .dimensionsMap(Map.of(
                                "InstanceId", instance.getInstanceId()
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
        alarm.addAlarmAction(
                new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(snsAlarmTopic)
        );
        
        return alarm;
    }
    
    private Alarm createUnhealthyTargetAlarm() {
        Alarm alarm = Alarm.Builder.create(this, "UnhealthyTargetAlarm")
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
        alarm.addAlarmAction(
                new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(snsAlarmTopic)
        );
        
        return alarm;
    }
}