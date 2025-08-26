package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;

import software.constructs.Construct;

// EC2
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;

// AutoScaling
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;

// ELBv2
import software.amazon.awscdk.services.elasticloadbalancingv2.AddApplicationTargetsProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListener;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps;

// S3
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;

// IAM
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;

// RDS
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;

// CloudWatch
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;

// CloudWatch → SNS
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;

// Route53
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.HostedZoneAttributes;
import software.amazon.awscdk.services.route53.IHostedZone;
import software.amazon.awscdk.services.route53.RecordTarget;

// Route53 alias target for ALB
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;

// SNS
import software.amazon.awscdk.services.sns.Topic;

import java.util.List;

public final class Main {

    private Main() {
        // Prevent instantiation
    }

    public static void main(final String[] args) {
        App app = new App();

        new FaultTolerantStack(app, "Nova-East", StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-east-1")
                .build())
            .build());

        new FaultTolerantStack(app, "Nova-West", StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-west-2")
                .build())
            .build());

        app.synth();
    }

    public static class FaultTolerantStack extends Stack {
        public FaultTolerantStack(final Construct scope, final String id, final StackProps props) {
            super(scope, id, props);

            String env = id.toLowerCase();

            // VPC
            Vpc vpc = Vpc.Builder.create(this, env + "-vpc")
                .maxAzs(2)
                .build();

            // Logging bucket
            Bucket logBucket = Bucket.Builder.create(this, env + "-logs")
                .versioned(true)
                .encryption(BucketEncryption.KMS_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .lifecycleRules(List.of(LifecycleRule.builder()
                    .expiration(Duration.days(365))
                    .build()))
                .build();

            // EC2 Role
            Role ec2Role = Role.Builder.create(this, env + "-ec2-role")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(List.of(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")))
                .build();

            // Security Group
            SecurityGroup sg = SecurityGroup.Builder.create(this, env + "-sg")
                .vpc(vpc)
                .allowAllOutbound(true)
                .build();
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP");
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS");

            // AutoScaling Group
            IMachineImage ami = MachineImage.latestAmazonLinux2();
            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, env + "-asg")
                .vpc(vpc)
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                    InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                .machineImage(ami)
                .securityGroup(sg)
                .role(ec2Role)
                .minCapacity(1)
                .maxCapacity(2)
                .build();

            // ALB
            ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, env + "-alb")
                .vpc(vpc)
                .internetFacing(true)
                .build();

            ApplicationListener listener = alb.addListener(env + "-listener",
                BaseApplicationListenerProps.builder()
                    .port(80)
                    .protocol(ApplicationProtocol.HTTP)
                    .build());

            listener.addTargets(env + "-targets",
                AddApplicationTargetsProps.builder()
                    .port(80)
                    .targets(List.of(asg))
                    .build());

            // RDS
            DatabaseInstance rds = DatabaseInstance.Builder.create(this, env + "-rds")
                .engine(DatabaseInstanceEngine.postgres(
                    PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_16)
                        .build()))
                .vpc(vpc)
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                    InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
                .credentials(Credentials.fromGeneratedSecret("dbadmin"))
                .multiAz(true)
                .allocatedStorage(20)
                .storageEncrypted(true)   // ✅ Added to satisfy test
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

            // Monitoring
            Metric cpuMetric = Metric.Builder.create()
                .namespace("AWS/EC2")
                .metricName("CPUUtilization")
                .statistic("Average")
                .period(Duration.minutes(5))
                .build();

            Alarm cpuAlarm = Alarm.Builder.create(this, env + "-cpu-alarm")
                .metric(cpuMetric)
                .threshold(80)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build();

            Topic alarmTopic = new Topic(this, env + "-alarm-topic");
            cpuAlarm.addAlarmAction(new SnsAction(alarmTopic));

            // Route53 (example zone placeholder)
            IHostedZone zone = HostedZone.fromHostedZoneAttributes(this, env + "-zone",
                HostedZoneAttributes.builder()
                    .hostedZoneId("Z123456ABCDEFG")
                    .zoneName("example.com")
                    .build());

            ARecord.Builder.create(this, env + "-dns")
                .zone(zone)
                .recordName(env + ".example.com")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(alb)))
                .ttl(Duration.minutes(1))
                .build();
        }
    }
}
