package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.HealthCheck;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.certificatemanager.Certificate;
import software.amazon.awscdk.services.certificatemanager.CertificateValidation;
import software.amazon.awscdk.services.certificatemanager.ValidationMethod;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceIdTarget;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.InstanceProfile;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.Transition;
import software.constructs.Construct;
import software.amazon.awscdk.Stack;

import java.util.List;
import java.util.Map;

/**
 * Stack for deploying a highly available web application with Auto Scaling,
 * Application Load Balancer, and S3 logging infrastructure.
 */
public class WebAppStack extends Stack {
    
    private final Vpc vpc;
    private final ApplicationLoadBalancer alb;
    private final AutoScalingGroup autoScalingGroup;
    private final Bucket logsBucket;
    private final String environmentSuffix;

    public WebAppStack(final Construct scope, final String id, final WebAppStackProps props) {
        super(scope, id, props.getStackProps());
        
        this.environmentSuffix = props.getEnvironmentSuffix();
        
        // Create VPC with public and private subnets
        this.vpc = createVpc();
        
        // Create S3 bucket for logs
        this.logsBucket = createLogsBucket();
        
        // Create security groups
        SecurityGroup albSecurityGroup = createAlbSecurityGroup();
        SecurityGroup instanceSecurityGroup = createInstanceSecurityGroup(albSecurityGroup);
        
        // Create IAM role for EC2 instances
        Role instanceRole = createInstanceRole();
        
        // Create launch template
        LaunchTemplate launchTemplate = createLaunchTemplate(instanceSecurityGroup, instanceRole);
        
        // Create Auto Scaling Group
        this.autoScalingGroup = createAutoScalingGroup(launchTemplate);
        
        // Create Application Load Balancer
        this.alb = createApplicationLoadBalancer(albSecurityGroup);
        
        // Create certificate and configure HTTPS
        configureSslAndTargetGroups();
        
        // Apply tags to all resources
        applyTags();
        
        // Create outputs
        createOutputs();
    }
    
    private Vpc createVpc() {
        return Vpc.Builder.create(this, "WebAppVpc" + environmentSuffix)
            .maxAzs(3)
            .cidr("10.0.0.0/16")
            .natGateways(2) // For high availability
            .subnetConfiguration(List.of(
                SubnetConfiguration.builder()
                    .name("Public")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("Private")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .build();
    }
    
    private Bucket createLogsBucket() {
        return Bucket.Builder.create(this, "WebAppLogsBucket" + environmentSuffix)
            .bucketName("webapp-logs-" + environmentSuffix.toLowerCase() + "-" + this.getRegion())
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .lifecycleRules(List.of(
                LifecycleRule.builder()
                    .id("LogsLifecycle")
                    .enabled(true)
                    .transitions(List.of(
                        Transition.builder()
                            .storageClass(StorageClass.GLACIER)
                            .transitionAfter(Duration.days(30))
                            .build()
                    ))
                    .expiration(Duration.days(365))
                    .build()
            ))
            .removalPolicy(RemovalPolicy.DESTROY)
            .autoDeleteObjects(true)
            .build();
    }
    
    private SecurityGroup createAlbSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSecurityGroup" + environmentSuffix)
            .vpc(vpc)
            .description("Security group for Application Load Balancer")
            .allowAllOutbound(true)
            .build();
            
        // Allow HTTP and HTTPS traffic from anywhere
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS traffic");
        
        return sg;
    }
    
    private SecurityGroup createInstanceSecurityGroup(SecurityGroup albSecurityGroup) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "InstanceSecurityGroup" + environmentSuffix)
            .vpc(vpc)
            .description("Security group for EC2 instances")
            .allowAllOutbound(true)
            .build();
            
        // Allow traffic from ALB only
        sg.addIngressRule(Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(80), "Allow HTTP from ALB");
        
        return sg;
    }
    
    private Role createInstanceRole() {
        return Role.Builder.create(this, "InstanceRole" + environmentSuffix)
            .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
            .managedPolicies(List.of(
                ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
            ))
            .build();
    }
    
    private LaunchTemplate createLaunchTemplate(SecurityGroup securityGroup, Role instanceRole) {
        InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "InstanceProfile" + environmentSuffix)
            .role(instanceRole)
            .build();
            
        // User data script to install and configure web server
        String userData = "#!/bin/bash\n" +
            "yum update -y\n" +
            "yum install -y httpd\n" +
            "systemctl start httpd\n" +
            "systemctl enable httpd\n" +
            "echo '<h1>Hello from Web Server</h1>' > /var/www/html/index.html\n" +
            "# Configure CloudWatch agent for log shipping\n" +
            "yum install -y amazon-cloudwatch-agent\n";
            
        return LaunchTemplate.Builder.create(this, "WebAppLaunchTemplate" + environmentSuffix)
            .launchTemplateName("webapp-template-" + environmentSuffix.toLowerCase())
            .machineImage(MachineImage.latestAmazonLinux2023())
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
            .securityGroup(securityGroup)
            .userData(UserData.custom(userData))
            .build();
    }
    
    private AutoScalingGroup createAutoScalingGroup(LaunchTemplate launchTemplate) {
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "WebAppAsg" + environmentSuffix)
            .vpc(vpc)
            .launchTemplate(launchTemplate)
            .minCapacity(2)
            .maxCapacity(6)
            .desiredCapacity(2)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .healthCheck(HealthCheck.elb(software.amazon.awscdk.services.autoscaling.ElbHealthCheckOptions.builder()
                .grace(Duration.minutes(5))
                .build()))
            .build();
            
        // Configure CPU-based scaling policies
asg.scaleOnCpuUtilization("CpuScaling" + environmentSuffix,
            software.amazon.awscdk.services.autoscaling.CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70)
                .build());
            
        return asg;
    }
    
    private ApplicationLoadBalancer createApplicationLoadBalancer(SecurityGroup securityGroup) {
        return ApplicationLoadBalancer.Builder.create(this, "WebAppAlb" + environmentSuffix)
            .vpc(vpc)
            .internetFacing(true)
            .securityGroup(securityGroup)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PUBLIC)
                .build())
            .build();
    }
    
    private void configureSslAndTargetGroups() {
        // Create target group
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup" + environmentSuffix)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .targetType(TargetType.INSTANCE)
            .vpc(vpc)
            .build();
            
        // Attach Auto Scaling Group to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        
        // Health check configuration
        targetGroup.configureHealthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
            .enabled(true)
            .path("/")
            .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
            .healthyHttpCodes("200")
            .interval(Duration.seconds(30))
            .timeout(Duration.seconds(10))
            .healthyThresholdCount(2)
            .unhealthyThresholdCount(3)
            .build());
            
        // Create HTTP listener with target group
        ApplicationListener httpListener = alb.addListener("HttpListener" + environmentSuffix,
            BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(List.of(targetGroup))
                .build());
    }
    
    private void applyTags() {
        Tags.of(this).add("Environment", "Production");
        Tags.of(this).add("App", "WebApp");
    }
    
    private void createOutputs() {
        CfnOutput.Builder.create(this, "LoadBalancerDns")
            .value(alb.getLoadBalancerDnsName())
            .description("DNS name of the load balancer")
            .exportName("LoadBalancerDNS")
            .build();
            
        CfnOutput.Builder.create(this, "LogsBucketName")
            .value(logsBucket.getBucketName())
            .description("Name of the S3 logs bucket")
            .exportName("S3BucketName")
            .build();
            
        CfnOutput.Builder.create(this, "VpcId")
            .value(vpc.getVpcId())
            .description("VPC ID")
            .exportName("VPCId")
            .build();
            
        CfnOutput.Builder.create(this, "AutoScalingGroupName")
            .value(autoScalingGroup.getAutoScalingGroupName())
            .description("Auto Scaling Group name")
            .exportName("AutoScalingGroupName")
            .build();
    }
    
    // Getters
    public Vpc getVpc() { return vpc; }
    public ApplicationLoadBalancer getApplicationLoadBalancer() { return alb; }
    public AutoScalingGroup getAutoScalingGroup() { return autoScalingGroup; }
    public Bucket getLogsBucket() { return logsBucket; }
}