package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.sns.*;
import software.constructs.Construct;

import java.util.*;

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
 * High-availability production infrastructure stack with RDS, ALB, EC2, S3, and CloudWatch monitoring
 */
class TapStack extends software.amazon.awscdk.Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Apply production tags to entire stack
        Tags.of(this).add("environment", "production");

        // Create VPC with multi-AZ setup
        Vpc vpc = createVpc();

        // Create RDS database with encryption and automatic failover
        DatabaseCluster rdsCluster = createRdsCluster(vpc);

        // Create S3 bucket with HTTPS-only access
        Bucket s3Bucket = createS3Bucket();

        // Create Application Load Balancer
        ApplicationLoadBalancer alb = createApplicationLoadBalancer(vpc);

        // Create Auto Scaling Group with EC2 instances
        AutoScalingGroup asg = createAutoScalingGroup(vpc, alb);

        // Create CloudWatch alarms for RDS monitoring
        createCloudWatchAlarms(rdsCluster);

        // Create stack outputs for integration testing
        createStackOutputs(alb, rdsCluster, s3Bucket, vpc);
    }

    private Vpc createVpc() {
        Vpc vpc = Vpc.Builder.create(this, "ProductionVpc")
                .ipProtocol(IpProtocol.DUAL_STACK)
                .maxAzs(3)
                .natGateways(2) // For high availability
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
                                .build(),
                        SubnetConfiguration.builder()
                                .name("DatabaseSubnet")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(28)
                                .build()
                ))
                .build();
        
        Tags.of(vpc).add("environment", "production");
        return vpc;
    }

    private DatabaseCluster createRdsCluster(Vpc vpc) {
        // Create DB subnet group spanning multiple AZs
        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .description("Subnet group for production RDS cluster")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();
        
        Tags.of(dbSubnetGroup).add("environment", "production");

        // Create security group for RDS
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RdsSecurityGroup")
                .vpc(vpc)
                .description("Security group for RDS cluster")
                .allowAllOutbound(false)
                .build();
        
        Tags.of(rdsSecurityGroup).add("environment", "production");

        // Create RDS cluster with Aurora MySQL for better performance and features
        DatabaseCluster cluster = DatabaseCluster.Builder.create(this, "ProductionDatabase")
                .engine(DatabaseClusterEngine.auroraMysql(AuroraMysqlClusterEngineProps.builder()
                        .version(AuroraMysqlEngineVersion.VER_3_05_2)
                        .build()))
                .writer(ClusterInstance.provisioned("writer", ProvisionedClusterInstanceProps.builder()
                        .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MEDIUM))
                        .build()))
                .readers(Arrays.asList(
                        ClusterInstance.provisioned("reader", ProvisionedClusterInstanceProps.builder()
                                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MEDIUM))
                                .build())
                ))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .securityGroups(Collections.singletonList(rdsSecurityGroup))
                .backup(BackupProps.builder()
                        .retention(Duration.days(7))
                        .preferredWindow("03:00-04:00")
                        .build())
                .storageEncrypted(true)
                .deletionProtection(false) // Changed to false for destroyability
                .preferredMaintenanceWindow("sun:04:00-sun:05:00")
                .subnetGroup(dbSubnetGroup)
                .monitoringInterval(Duration.minutes(1))
                .enablePerformanceInsights(true) // New feature for database insights
                .performanceInsightRetention(PerformanceInsightRetention.MONTHS_1)
                .build();
        
        Tags.of(cluster).add("environment", "production");
        return cluster;
    }

    private Bucket createS3Bucket() {
        Bucket bucket = Bucket.Builder.create(this, "ProductionDataBucket")
                .bucketName("production-data-" + environmentSuffix + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .lifecycleRules(Collections.singletonList(
                        LifecycleRule.builder()
                                .id("DeleteIncompleteMultipartUploads")
                                .abortIncompleteMultipartUploadAfter(Duration.days(1))
                                .enabled(true)
                                .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY) // Ensure destroyability
                .autoDeleteObjects(true) // Clean up on destruction
                .build();
        
        // Add bucket policy to enforce HTTPS-only access
        bucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .sid("DenyInsecureConnections")
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(bucket.getBucketArn(), bucket.arnForObjects("*")))
                .conditions(Map.of(
                        "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build());
        
        Tags.of(bucket).add("environment", "production");
        return bucket;
    }

    private ApplicationLoadBalancer createApplicationLoadBalancer(Vpc vpc) {
        // Security group for ALB
        SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();
        
        Tags.of(albSecurityGroup).add("environment", "production");

        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic"
        );
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic"
        );

        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "ProductionALB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .build();
        
        Tags.of(alb).add("environment", "production");
        return alb;
    }

    private AutoScalingGroup createAutoScalingGroup(Vpc vpc, ApplicationLoadBalancer alb) {
        // Create IAM role for EC2 instances
        Role ec2Role = Role.Builder.create(this, "Ec2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();
        
        Tags.of(ec2Role).add("environment", "production");

        // Security group for EC2 instances
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "Ec2SecurityGroup")
                .vpc(vpc)
                .description("Security group for EC2 instances")
                .allowAllOutbound(true)
                .build();
        
        Tags.of(ec2SecurityGroup).add("environment", "production");

        // Get ALB security group
        ISecurityGroup albSg = alb.getConnections().getSecurityGroups().get(0);
        
        ec2SecurityGroup.addIngressRule(
                albSg,
                Port.tcp(80),
                "Allow traffic from ALB"
        );

        // Launch template for EC2 instances
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "Ec2LaunchTemplate")
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
                .machineImage(MachineImage.latestAmazonLinux2023())
                .securityGroup(ec2SecurityGroup)
                .role(ec2Role)
                .userData(UserData.forLinux())
                .build();

        // Configure user data for web server setup
        launchTemplate.getUserData().addCommands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Production Web Server</h1>' > /var/www/html/index.html",
                "echo '<p>Instance ID: ' > /var/www/html/health.html",
                "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/health.html",
                "echo '</p>' >> /var/www/html/health.html"
        );

        // Auto Scaling Group
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "ProductionAsg")
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(2)
                .maxCapacity(10)
                .desiredCapacity(3)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(
                        ElbHealthCheckOptions.builder()
                                .grace(Duration.minutes(5))
                                .build()))
                .build();
        
        Tags.of(asg).add("environment", "production");

        // Target group for ALB
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebTargetGroup")
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targets(Collections.singletonList(asg))
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                        .path("/health.html")
                        .interval(Duration.seconds(30))
                        .timeout(Duration.seconds(5))
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(3)
                        .build())
                .build();
        
        Tags.of(targetGroup).add("environment", "production");

        // ALB Listener
        alb.addListener("HttpListener", BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.forward(Collections.singletonList(targetGroup)))
                .build());

        return asg;
    }

    private void createCloudWatchAlarms(DatabaseCluster rdsCluster) {
        // Create SNS topic for alarm notifications
        Topic alarmTopic = Topic.Builder.create(this, "DatabaseAlarmTopic")
                .displayName("Production Database Alarms")
                .build();
        
        Tags.of(alarmTopic).add("environment", "production");

        // CPU Utilization alarm
        Alarm cpuAlarm = Alarm.Builder.create(this, "RdsCpuAlarm")
                .metric(rdsCluster.metricCPUUtilization())
                .threshold(80)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .alarmDescription("RDS CPU utilization is high")
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
        
        cpuAlarm.addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));

        // Database connections alarm
        Alarm connectionsAlarm = Alarm.Builder.create(this, "RdsConnectionsAlarm")
                .metric(rdsCluster.metricDatabaseConnections())
                .threshold(40)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .alarmDescription("RDS connection count is high")
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
        
        connectionsAlarm.addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));

        // Read replica lag alarm
        Alarm replicationAlarm = Alarm.Builder.create(this, "RdsReplicationLagAlarm")
                .metric(Metric.Builder.create()
                        .namespace("AWS/RDS")
                        .metricName("AuroraReplicaLag")
                        .dimensionsMap(Map.of("DBClusterIdentifier", rdsCluster.getClusterIdentifier()))
                        .statistic("Average")
                        .period(Duration.minutes(1))
                        .build())
                .threshold(1000) // 1 second in milliseconds
                .evaluationPeriods(3)
                .datapointsToAlarm(2)
                .alarmDescription("Aurora replica lag is high")
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
        
        replicationAlarm.addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));
    }

    private void createStackOutputs(ApplicationLoadBalancer alb, DatabaseCluster rdsCluster, 
                                   Bucket s3Bucket, Vpc vpc) {
        // ALB DNS name for DNS integration
        CfnOutput.Builder.create(this, "LoadBalancerDnsName")
                .value(alb.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer")
                .exportName("ALBDnsName" + environmentSuffix)
                .build();

        // ALB hosted zone ID for Route53 alias records
        CfnOutput.Builder.create(this, "LoadBalancerCanonicalHostedZoneId")
                .value(alb.getLoadBalancerCanonicalHostedZoneId())
                .description("Hosted zone ID of the Application Load Balancer")
                .exportName("ALBHostedZoneId" + environmentSuffix)
                .build();

        // RDS cluster endpoint
        CfnOutput.Builder.create(this, "DatabaseClusterEndpoint")
                .value(rdsCluster.getClusterEndpoint().getSocketAddress())
                .description("RDS cluster endpoint for application connection")
                .exportName("DatabaseEndpoint" + environmentSuffix)
                .build();

        // RDS cluster reader endpoint
        CfnOutput.Builder.create(this, "DatabaseReaderEndpoint")
                .value(rdsCluster.getClusterReadEndpoint().getSocketAddress())
                .description("RDS cluster reader endpoint for read-only connections")
                .exportName("DatabaseReaderEndpoint" + environmentSuffix)
                .build();

        // S3 bucket name
        CfnOutput.Builder.create(this, "S3BucketName")
                .value(s3Bucket.getBucketName())
                .description("S3 bucket name for application data")
                .exportName("S3BucketName" + environmentSuffix)
                .build();

        // VPC ID
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("VPC ID for network configuration")
                .exportName("VpcId" + environmentSuffix)
                .build();

        // Private subnet IDs
        CfnOutput.Builder.create(this, "PrivateSubnetIds")
                .value(String.join(",", vpc.getPrivateSubnets().stream()
                        .map(ISubnet::getSubnetId)
                        .toArray(String[]::new)))
                .description("Private subnet IDs for application deployment")
                .exportName("PrivateSubnetIds" + environmentSuffix)
                .build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the production infrastructure CDK application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
            if (environmentSuffix == null) {
                environmentSuffix = "dev";
            }
        }

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // Fixed to us-west-2 as per requirements
                                .build())
                        .build())
                .build());

        app.synth();
    }
}