package app;

import java.util.List;
import java.util.stream.Collectors;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.HealthCheck;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Subnet;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ListenerAction;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.constructs.Construct;

/**
 * RegionalStack represents a single-region deployment of the Nova Model Breaking project.
 */
class RegionalStack extends Stack {
    public RegionalStack(final Construct scope, final String id, final StackProps props, String environmentSuffix) {
        super(scope, id, props);

        // VPC
        Vpc vpc = Vpc.Builder.create(this, "NovaVpc-" + environmentSuffix)
                .maxAzs(2)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .name("public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()))
                .build();

        // S3 Bucket
        Bucket logBucket = Bucket.Builder.create(this, "NovaLogs-" + environmentSuffix)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .expiration(Duration.days(365))
                                .transitions(List.of(
                                        software.amazon.awscdk.services.s3.LifecycleTransition.builder()
                                                .storageClass(StorageClass.GLACIER)
                                                .transitionAfter(Duration.days(90))
                                                .build()
                                ))
                                .build()))
                .build();


        // IAM Role
                                software.amazon.awscdk.services.s3.LifecycleTransition.builder()
                                        .storageClass(StorageClass.GLACIER)
                                        .transitionAfter(Duration.days(90))
                                        .build()
                        ))
                        .build()))
        .build();


        // IAM Role
        Role ec2Role = Role.Builder.create(this, "NovaEc2Role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(List.of(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
                .build();

        // Security Group
        SecurityGroup appSg = SecurityGroup.Builder.create(this, "NovaAppSg-" + environmentSuffix)
                .vpc(vpc)
                .allowAllOutbound(true)
                .build();
        appSg.addIngressRule(appSg, Port.tcp(80), "Allow HTTP");

        // Auto Scaling Group
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "NovaAsg-" + environmentSuffix)
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .minCapacity(2)
                .maxCapacity(4)
                .role(ec2Role)
                .healthCheck(HealthCheck.ec2())
                .build();

        // Load Balancer
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "NovaAlb-" + environmentSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(appSg)
                .build();

        ApplicationTargetGroup tg = ApplicationTargetGroup.Builder.create(this, "NovaAlbTg-" + environmentSuffix)
                .vpc(vpc)
                .protocol(ApplicationProtocol.HTTP)
                .port(80)
                .targetType(TargetType.INSTANCE)
                .build();

        alb.addListener("HttpListener",
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                        .port(80)
                        .defaultAction(ListenerAction.forward(List.of(tg)))
                        .build());

        asg.attachToApplicationTargetGroup(tg);

        // RDS
        DatabaseInstance rds = DatabaseInstance.Builder.create(this, "NovaRds-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.postgres(
                        PostgresInstanceEngineProps.builder()
                                .version(PostgresEngineVersion.VER_13)
                                .build()))
                .vpc(vpc)
                .multiAz(true)
                .storageEncrypted(true)
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .storageType(StorageType.GP2)
                .credentials(Credentials.fromGeneratedSecret("postgres"))
                .build();

        // Alarm
        Alarm cpuAlarm = Alarm.Builder.create(this, "NovaAsgCpuAlarm-" + environmentSuffix)
                .metric(Metric.Builder.create()
                        .namespace("AWS/EC2")
                        .metricName("CPUUtilization")
                        .statistic("Average")
                        .period(Duration.minutes(5))
                        .build())
                .threshold(80)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build();

        // Outputs
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .exportName("NovaVpcId-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "SubnetIds")
                .value(vpc.getPublicSubnets().stream()
                        .map(s -> s.getSubnetId())
                        .collect(Collectors.joining(",")))
                .exportName("NovaVpcSubnetIds-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AlbDns")
                .value(alb.getLoadBalancerDnsName())
                .exportName("NovaAlbDns-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "RdsEndpoint")
                .value(rds.getDbInstanceEndpointAddress())
                .exportName("NovaRdsEndpoint-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "LogBucketName")
                .value(logBucket.getBucketName())
                .exportName("NovaLogsBucket-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "CpuAlarmName")
                .value(cpuAlarm.getAlarmName())
                .exportName("NovaCpuAlarm-" + environmentSuffix)
                .build();
    }
}

/**
 * Main entry point for the AWS CDK Java application.
 */
public final class Main {
    private Main() {}

    public static void main(final String[] args) {
        App app = new App();

        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            throw new RuntimeException("CDK_DEFAULT_ACCOUNT not set");
        }

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        new RegionalStack(app, "NovaStack-" + environmentSuffix + "-use1",
                StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-east-1")
                                .build())
                        .build(),
                environmentSuffix);

        new RegionalStack(app, "NovaStack-" + environmentSuffix + "-usw2",
                StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-west-2")
                                .build())
                        .build(),
                environmentSuffix);

        app.synth();
    }
}
