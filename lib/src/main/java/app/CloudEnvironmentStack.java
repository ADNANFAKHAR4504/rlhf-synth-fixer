package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Props for CloudEnvironmentStack
 */
class CloudEnvironmentStackProps {
    private final String environmentSuffix;

    private CloudEnvironmentStackProps(String environmentSuffix) {
        this.environmentSuffix = environmentSuffix;
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public CloudEnvironmentStackProps build() {
            return new CloudEnvironmentStackProps(environmentSuffix);
        }
    }
}

/**
 * Comprehensive cloud environment stack with VPC, EC2, ALB, and Auto Scaling.
 */
public class CloudEnvironmentStack extends NestedStack {

    private final Vpc vpc;
    private final ApplicationLoadBalancer loadBalancer;
    private final AutoScalingGroup autoScalingGroup;
    private final String environmentSuffix;
    private final boolean isLocalStack;

    public CloudEnvironmentStack(final Construct scope, final String id, final CloudEnvironmentStackProps props) {
        super(scope, id, NestedStackProps.builder().build());

        this.environmentSuffix = props.getEnvironmentSuffix();

        // Detect LocalStack environment
        String awsEndpoint = System.getenv("AWS_ENDPOINT_URL");
        this.isLocalStack = awsEndpoint != null &&
            (awsEndpoint.contains("localhost") || awsEndpoint.contains("4566"));

        // Create VPC with public and private subnets across 2 AZs
        this.vpc = createVpc();
        
        // Create security groups
        SecurityGroup albSecurityGroup = createAlbSecurityGroup();
        SecurityGroup ec2SecurityGroup = createEc2SecurityGroup(albSecurityGroup);
        
        // Create Application Load Balancer
        this.loadBalancer = createApplicationLoadBalancer(albSecurityGroup);
        
        // Create Auto Scaling Group with EC2 instances
        this.autoScalingGroup = createAutoScalingGroup(ec2SecurityGroup);
        
        // Configure target group and listener
        configureLoadBalancerTargeting();
        
        // Add auto scaling policies
        configureAutoScalingPolicies();
        
        // Add tags to all resources
        addResourceTags();
        
        // Create CloudFormation outputs
        createOutputs();
    }

    private Vpc createVpc() {
        // LocalStack Community doesn't support NAT Gateways reliably
        // Use natGateways(0) for LocalStack, full setup for AWS
        int natGatewayCount = isLocalStack ? 0 : 2;

        return Vpc.Builder.create(this, "CloudEnvironmentVpc")
                .vpcName("robust-cloud-vpc-" + environmentSuffix)
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build()
                ))
                .natGateways(natGatewayCount)
                .build();
    }

    private SecurityGroup createAlbSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .securityGroupName("alb-sg-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();

        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS traffic");
        
        return sg;
    }

    private SecurityGroup createEc2SecurityGroup(SecurityGroup albSecurityGroup) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "Ec2SecurityGroup")
                .securityGroupName("ec2-sg-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for EC2 instances")
                .allowAllOutbound(true)
                .build();

        sg.addIngressRule(Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(80), "Allow traffic from ALB");
        
        return sg;
    }

    private ApplicationLoadBalancer createApplicationLoadBalancer(SecurityGroup securityGroup) {
        return ApplicationLoadBalancer.Builder.create(this, "CloudEnvironmentALB")
                .loadBalancerName("robust-cloud-alb-" + environmentSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .build())
                .securityGroup(securityGroup)
                .deletionProtection(false)
                .build();
    }

    private AutoScalingGroup createAutoScalingGroup(SecurityGroup securityGroup) {
        // Get the latest Amazon Linux 2023 AMI
        IMachineImage amazonLinux = MachineImage.latestAmazonLinux2023();

        // Create IAM role for EC2 instances
        Role ec2Role = Role.Builder.create(this, "Ec2InstanceRole")
                .roleName("ec2-instance-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();

        // User data script
        UserData userData = UserData.forLinux();
        userData.addCommands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Robust Cloud Environment - Instance ID: ' > /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
            "echo '</h1>' >> /var/www/html/index.html"
        );

        // Reduce capacity for LocalStack testing
        int minCapacity = isLocalStack ? 1 : 2;
        int maxCapacity = isLocalStack ? 2 : 10;
        int desiredCapacity = isLocalStack ? 1 : 2;

        return AutoScalingGroup.Builder.create(this, "CloudEnvironmentASG")
                .autoScalingGroupName("robust-cloud-asg-" + environmentSuffix)
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.SMALL))
                .machineImage(amazonLinux)
                .role(ec2Role)
                .userData(userData)
                .minCapacity(minCapacity)
                .maxCapacity(maxCapacity)
                .desiredCapacity(desiredCapacity)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .securityGroup(securityGroup)
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(
                    ElbHealthCheckOptions.builder()
                        .grace(software.amazon.awscdk.Duration.seconds(300))
                        .build()))
                .build();
    }

    private void configureLoadBalancerTargeting() {
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "CloudEnvironmentTargetGroup")
                .targetGroupName("robust-cloud-tg-" + environmentSuffix)
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targets(Arrays.asList(autoScalingGroup))
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                    .path("/")
                    .interval(software.amazon.awscdk.Duration.seconds(30))
                    .timeout(software.amazon.awscdk.Duration.seconds(5))
                    .healthyThresholdCount(2)
                    .unhealthyThresholdCount(3)
                    .build())
                .build();

        ApplicationListener listener = ApplicationListener.Builder.create(this, "HttpListener")
                .loadBalancer(loadBalancer)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.forward(Arrays.asList(targetGroup)))
                .build();
    }

    private void configureAutoScalingPolicies() {
        // Scale out policy - CPU > 70%
        autoScalingGroup.scaleOnCpuUtilization("ScaleOutPolicy",
                CpuUtilizationScalingProps.builder()
                    .targetUtilizationPercent(70)
                    .cooldown(software.amazon.awscdk.Duration.seconds(300))
                    .build());

        // Additional custom scaling policies for fine-tuned control
        StepScalingPolicy stepScalingPolicy = StepScalingPolicy.Builder.create(this, "StepScalingPolicy")
                .autoScalingGroup(autoScalingGroup)
                .metric(Metric.Builder.create()
                    .namespace("AWS/EC2")
                    .metricName("CPUUtilization")
                    .dimensionsMap(Map.of("AutoScalingGroupName", autoScalingGroup.getAutoScalingGroupName()))
                    .statistic("Average")
                    .build())
                .scalingSteps(Arrays.asList(
                    ScalingInterval.builder()
                        .lower(30)
                        .upper(70)
                        .change(0)
                        .build(),
                    ScalingInterval.builder()
                        .lower(70)
                        .change(2)
                        .build()
                ))
                .adjustmentType(AdjustmentType.CHANGE_IN_CAPACITY)
                .cooldown(software.amazon.awscdk.Duration.seconds(300))
                .build();
    }

    private void addResourceTags() {
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "RobustCloudEnvironment");
        Tags.of(this).add("ManagedBy", "CDK");
        Tags.of(this).add("Application", "WebApplication");
    }

    private void createOutputs() {
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("ID of the VPC")
                .exportName("VpcId-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "LoadBalancerDnsName")
                .value(loadBalancer.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer")
                .exportName("LoadBalancerDnsName-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AutoScalingGroupName")
                .value(autoScalingGroup.getAutoScalingGroupName())
                .description("Name of the Auto Scaling Group")
                .exportName("AutoScalingGroupName-" + environmentSuffix)
                .build();
    }

    // Getters for accessing resources from other stacks
    public Vpc getVpc() {
        return vpc;
    }

    public ApplicationLoadBalancer getLoadBalancer() {
        return loadBalancer;
    }

    public AutoScalingGroup getAutoScalingGroup() {
        return autoScalingGroup;
    }
}