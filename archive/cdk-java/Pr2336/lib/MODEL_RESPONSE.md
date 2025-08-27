I'll help you create a robust, high-availability infrastructure setup using AWS CDK Java. This solution provides fault tolerance, automatic failover, secure access, and comprehensive monitoring across multiple availability zones in us-west-2.

Here's the complete infrastructure code organized by component:

## Main Stack Implementation

**lib/src/main/java/app/Main.java**

```java
package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.iam.*;
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
class TapStack extends Stack {
    private final String environmentSuffix;
    private final Map<String, String> productionTags;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Production tags for all resources
        this.productionTags = Map.of("environment", "production");

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
        return Vpc.Builder.create(this, "ProductionVpc")
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
                .tags(productionTags)
                .build();
    }

    private DatabaseCluster createRdsCluster(Vpc vpc) {
        // Create DB subnet group spanning multiple AZs
        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .description("Subnet group for production RDS cluster")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .tags(productionTags)
                .build();

        // Create security group for RDS
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RdsSecurityGroup")
                .vpc(vpc)
                .description("Security group for RDS cluster")
                .allowAllOutbound(false)
                .tags(productionTags)
                .build();

        // Create RDS cluster with Aurora MySQL for better performance and features
        DatabaseCluster cluster = DatabaseCluster.Builder.create(this, "ProductionDatabase")
                .engine(DatabaseClusterEngine.auroraMysql(AuroraMysqlEngineVersion.VER_8_0_MYSQL_3_05_2))
                .instanceProps(InstanceProps.builder()
                        .instanceType(InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MEDIUM))
                        .vpc(vpc)
                        .vpcSubnets(SubnetSelection.builder()
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .build())
                        .securityGroups(Collections.singletonList(rdsSecurityGroup))
                        .build())
                .instances(2) // Multi-AZ setup for automatic failover
                .backup(BackupProps.builder()
                        .retention(Duration.days(7))
                        .preferredWindow("03:00-04:00")
                        .build())
                .storageEncrypted(true)
                .deletionProtection(true)
                .preferredMaintenanceWindow("sun:04:00-sun:05:00")
                .subnetGroup(dbSubnetGroup)
                .monitoringInterval(Duration.minutes(1))
                .enablePerformanceInsights(true) // New feature for database insights
                .performanceInsightRetention(PerformanceInsightRetention.MONTHS_1)
                .tags(productionTags)
                .build();

        return cluster;
    }

    private Bucket createS3Bucket() {
        return Bucket.Builder.create(this, "ProductionDataBucket")
                .bucketName("production-data-" + environmentSuffix + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .enforceSSL(true) // HTTPS-only access
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .lifecycleRules(Collections.singletonList(
                        LifecycleRule.builder()
                                .id("DeleteIncompleteMultipartUploads")
                                .abortIncompleteMultipartUploadAfter(Duration.days(1))
                                .enabled(true)
                                .build()
                ))
                .tags(productionTags)
                .build();
    }

    private ApplicationLoadBalancer createApplicationLoadBalancer(Vpc vpc) {
        // Security group for ALB
        SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .tags(productionTags)
                .build();

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

        return ApplicationLoadBalancer.Builder.create(this, "ProductionALB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .tags(productionTags)
                .build();
    }

    private AutoScalingGroup createAutoScalingGroup(Vpc vpc, ApplicationLoadBalancer alb) {
        // Create IAM role for EC2 instances
        Role ec2Role = Role.Builder.create(this, "Ec2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .tags(productionTags)
                .build();

        InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "Ec2InstanceProfile")
                .role(ec2Role)
                .build();

        // Security group for EC2 instances
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "Ec2SecurityGroup")
                .vpc(vpc)
                .description("Security group for EC2 instances")
                .allowAllOutbound(true)
                .tags(productionTags)
                .build();

        ec2SecurityGroup.addIngressRule(
                Peer.securityGroupId(alb.getLoadBalancerSecurityGroup()),
                Port.tcp(80),
                "Allow traffic from ALB"
        );

        // Launch template for EC2 instances
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "Ec2LaunchTemplate")
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
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
                .healthCheck(HealthCheck.elb(Duration.minutes(5)))
                .tags(productionTags)
                .build();

        // Target group for ALB
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebTargetGroup")
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targets(Collections.singletonList(asg))
                .healthCheck(HealthCheck.builder()
                        .path("/health.html")
                        .interval(Duration.seconds(30))
                        .timeout(Duration.seconds(5))
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(3)
                        .build())
                .tags(productionTags)
                .build();

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
                .tags(productionTags)
                .build();

        // CPU Utilization alarm
        Alarm.Builder.create(this, "RdsCpuAlarm")
                .metric(rdsCluster.metricCPUUtilization())
                .threshold(80)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .alarmDescription("RDS CPU utilization is high")
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));

        // Database connections alarm
        Alarm.Builder.create(this, "RdsConnectionsAlarm")
                .metric(rdsCluster.metricDatabaseConnections())
                .threshold(40)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .alarmDescription("RDS connection count is high")
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));

        // Read replica lag alarm
        Alarm.Builder.create(this, "RdsReplicationLagAlarm")
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
                .build()
                .addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(alarmTopic));
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
            environmentSuffix = "dev";
        }

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

This infrastructure provides:

1. **High Availability**: Multi-AZ VPC with Aurora MySQL cluster, multiple NAT gateways, and Auto Scaling across availability zones

2. **Automatic Failover**: Aurora cluster with 2 instances, Application Load Balancer with health checks, and Auto Scaling Group with ELB health checks

3. **Security**: HTTPS-only S3 bucket, encrypted RDS storage, security groups with least privilege access, and SSL enforcement

4. **Monitoring**: CloudWatch alarms for RDS CPU, connections, and replication lag with SNS notifications

5. **Production Tagging**: All resources tagged with `environment:production`

6. **Integration Outputs**: ALB DNS name, RDS endpoints, S3 bucket name, VPC details for external integration

The setup includes newer AWS features like Performance Insights for Aurora and uses Aurora MySQL for better performance and automatic scaling capabilities. The infrastructure is designed for quick deployment while maintaining production-grade reliability and monitoring.