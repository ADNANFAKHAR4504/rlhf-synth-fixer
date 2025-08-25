package app;

import java.util.List;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.HealthChecks;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
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
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.constructs.Construct;

/**
 * RegionalStack: one deployment per AWS region.
 */
class RegionalStack extends Stack {
    public RegionalStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);

        // VPC
        Vpc vpc = Vpc.Builder.create(this, "Vpc-" + environmentSuffix)
                .maxAzs(2)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder().name("public").subnetType(SubnetType.PUBLIC).cidrMask(24).build(),
                        SubnetConfiguration.builder().name("private").subnetType(SubnetType.PRIVATE_WITH_EGRESS).cidrMask(24).build()
                ))
                .build();

        // Logs bucket
        Bucket logBucket = Bucket.Builder.create(this, "Logs-" + environmentSuffix)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder().expiration(Duration.days(365)).build()
                ))
                .build();

        // IAM role
        Role ec2Role = Role.Builder.create(this, "Ec2Role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(List.of(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
                .build();

        // SG
        SecurityGroup appSg = SecurityGroup.Builder.create(this, "AppSg-" + environmentSuffix)
                .vpc(vpc)
                .allowAllOutbound(true)
                .build();
        appSg.addIngressRule(appSg, Port.tcp(80));

        // ASG
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg-" + environmentSuffix)
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .minCapacity(2)
                .maxCapacity(4)
                .role(ec2Role)
                .healthChecks(HealthChecks.ec2())
                .build();

        // ALB
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb-" + environmentSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(appSg)
                .build();

        ApplicationTargetGroup tg = ApplicationTargetGroup.Builder.create(this, "AlbTg-" + environmentSuffix)
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
        DatabaseInstance rds = DatabaseInstance.Builder.create(this, "Rds-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.postgres(
                        PostgresInstanceEngineProps.builder().version(PostgresEngineVersion.VER_13).build()))
                .vpc(vpc)
                .multiAz(true)
                .storageEncrypted(true)
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .storageType(StorageType.GP2)
                .credentials(Credentials.fromGeneratedSecret("postgres"))
                .build();

        // Alarm
        Alarm cpuAlarm = Alarm.Builder.create(this, "CpuAlarm-" + environmentSuffix)
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
        CfnOutput.Builder.create(this, "VpcId").value(vpc.getVpcId()).build();
        CfnOutput.Builder.create(this, "AlbDns").value(alb.getLoadBalancerDnsName()).build();
        CfnOutput.Builder.create(this, "RdsEndpoint").value(rds.getDbInstanceEndpointAddress()).build();
        CfnOutput.Builder.create(this, "LogBucketName").value(logBucket.getBucketName()).build();
        CfnOutput.Builder.create(this, "CpuAlarmName").value(cpuAlarm.getAlarmName()).build();
    }
}

/**
 * Main entry point.
 */
public final class Main {
    private Main() {}

    public static void main(final String[] args) {
        App app = new App();

        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) throw new RuntimeException("CDK_DEFAULT_ACCOUNT not set");

        String envSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (envSuffix == null) envSuffix = "dev";

        // NovaStack (new name)
        new RegionalStack(app, "NovaStack-" + envSuffix + "-use1",
                StackProps.builder().env(Environment.builder().account(account).region("us-east-1").build()).build(),
                envSuffix);
        new RegionalStack(app, "NovaStack-" + envSuffix + "-usw2",
                StackProps.builder().env(Environment.builder().account(account).region("us-west-2").build()).build(),
                envSuffix);

        // TapStack (backward compatibility for pipeline)
        new RegionalStack(app, "TapStack-" + envSuffix + "-use1",
                StackProps.builder().env(Environment.builder().account(account).region("us-east-1").build()).build(),
                envSuffix);
        new RegionalStack(app, "TapStack-" + envSuffix + "-usw2",
                StackProps.builder().env(Environment.builder().account(account).region("us-west-2").build()).build(),
                envSuffix);

        app.synth();
    }
}
