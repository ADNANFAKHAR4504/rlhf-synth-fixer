package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.logs.*;
import software.constructs.Construct;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
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
 * High Availability Infrastructure Stack for the Tap project.
 *
 * This stack creates a robust, multi-AZ infrastructure with auto-scaling,
 * load balancing, monitoring, and automatic failure recovery capabilities.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStackDev extends Stack {

    private Vpc vpc;
    private ApplicationLoadBalancer loadBalancer;
    private AutoScalingGroup autoScalingGroup;
    private ApplicationTargetGroup targetGroup;
    private String environmentSuffix;
    private boolean isLocalStack;

    /**
     * Constructs a new TapStackDev.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack
     */
    public TapStackDev(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Extract environment suffix from stack name if present
        this.environmentSuffix = id.replaceFirst("TapStack", "");
        if (this.environmentSuffix.isEmpty()) {
            this.environmentSuffix = "dev";
        }

        // Detect LocalStack environment
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
        this.isLocalStack = endpointUrl != null &&
                           (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

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
        // LocalStack Community Edition doesn't support NAT Gateways well
        // and only supports 1 AZ effectively. Use simplified configuration for LocalStack.
        int natGateways = isLocalStack ? 0 : 3;

        this.vpc = Vpc.Builder.create(this, "HighAvailabilityVpc")
                // Use explicit AZ list to avoid AWS API calls during synth
                .availabilityZones(isLocalStack
                    ? Arrays.asList("us-east-1a")
                    : Arrays.asList("us-east-1a", "us-east-1b", "us-east-1c"))
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
                        // Use PUBLIC for LocalStack (no NAT), PRIVATE_WITH_EGRESS for AWS
                        .subnetType(isLocalStack ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS)
                        .build()
                ))
                .natGateways(natGateways) // No NAT for LocalStack, one per AZ for AWS
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
        this.targetGroup = ApplicationTargetGroup.Builder.create(this, "TargetGroup")
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .vpc(vpc)
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
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

        // Add listener to load balancer - use BaseApplicationListenerProps instead
        this.loadBalancer.addListener("HttpListener", BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(Arrays.asList(this.targetGroup))
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

        // For LocalStack, use PUBLIC subnets since we don't have NAT
        // For AWS, use PRIVATE_WITH_EGRESS for proper isolation
        SubnetSelection subnetSelection = SubnetSelection.builder()
                .subnetType(isLocalStack ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS)
                .build();

        // Reduce instance counts for LocalStack (single AZ, limited resources)
        int minCapacity = isLocalStack ? 1 : 2;
        int maxCapacity = isLocalStack ? 2 : 10;
        int desiredCapacity = isLocalStack ? 1 : 3;

        this.autoScalingGroup = AutoScalingGroup.Builder.create(this, "AutoScalingGroup")
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(minCapacity)
                .maxCapacity(maxCapacity)
                .desiredCapacity(desiredCapacity)
                .vpcSubnets(subnetSelection)
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(ElbHealthCheckOptions.builder()
                    .grace(Duration.minutes(5))
                    .build())) // Use ELB health checks
                .updatePolicy(UpdatePolicy.rollingUpdate(RollingUpdateOptions.builder()
                    .maxBatchSize(1)
                    .minInstancesInService(isLocalStack ? 0 : 2)
                    .pauseTime(Duration.minutes(5))
                    .build()))
                .build();

        // Attach auto scaling group to load balancer target group
        autoScalingGroup.attachToApplicationTargetGroup(this.targetGroup);

        // Add scaling policies - simplified for LocalStack compatibility
        // LocalStack Community doesn't fully support target tracking scaling policies
        if (!isLocalStack) {
            // Only add scaling policies for AWS deployment
            autoScalingGroup.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
                    .targetUtilizationPercent(70)
                    .cooldown(Duration.minutes(5))
                    .build());

            autoScalingGroup.scaleOnRequestCount("RequestScaling", RequestCountScalingProps.builder()
                    .targetRequestsPerMinute(1000)
                    .build());
        }
    }

    private void createMonitoring() {
        // Create CloudWatch log group with RemovalPolicy for LocalStack
        LogGroup logGroup = LogGroup.Builder.create(this, "ApplicationLogGroup")
                .logGroupName("/aws/ec2/application")
                .retention(RetentionDays.ONE_MONTH)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // CloudWatch Alarms with complex intrinsic functions don't work well in LocalStack Community
        // Only create alarms for AWS deployments
        if (!isLocalStack) {
            // Create high CPU alarm
            Alarm highCpuAlarm = Alarm.Builder.create(this, "HighCpuAlarm")
                    .metric(Metric.Builder.create()
                        .namespace("AWS/EC2")
                        .metricName("CPUUtilization")
                        .dimensionsMap(Map.of("AutoScalingGroupName", autoScalingGroup.getAutoScalingGroupName()))
                        .build())
                    .threshold(80)
                    .evaluationPeriods(2)
                    .treatMissingData(TreatMissingData.BREACHING)
                    .build();

            // Create unhealthy host alarm
            Alarm unhealthyHostsAlarm = Alarm.Builder.create(this, "UnhealthyHostsAlarm")
                    .metric(targetGroup.metricUnhealthyHostCount())
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

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration based on environment variables and context.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or environment variable or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        }
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main high availability TAP stack
        // Use placeholder account/region during synthesis to avoid credential validation
        // These will be overridden during actual deployment
        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        String region = System.getenv("CDK_DEFAULT_REGION");

        // Use placeholder values if not set (allows synth without credentials)
        if (account == null || account.isEmpty()) {
            account = "123456789012";
        }
        if (region == null || region.isEmpty()) {
            region = "us-east-1";
        }

        new TapStackDev(app, "TapStack" + environmentSuffix, StackProps.builder()
                .env(Environment.builder()
                        .account(account)
                        .region(region)
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
