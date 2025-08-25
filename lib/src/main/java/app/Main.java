package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.cloudwatch.actions.*;
import software.amazon.awscdk.services.route53.*;
import software.amazon.awscdk.services.route53.targets.*;
import software.amazon.awscdk.services.sns.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class Main {
    public static void main(final String[] args) {
        App app = new App();

        new FaultTolerantStack(app, "Nova-East", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv().getOrDefault("CDK_DEFAULT_ACCOUNT", "123456789012"))
                        .region("us-east-1")
                        .build())
                .build());

        new FaultTolerantStack(app, "Nova-West", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv().getOrDefault("CDK_DEFAULT_ACCOUNT", "123456789012"))
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
                    .natGateways(2)
                    .build();

            // Logs S3 bucket
            Bucket logBucket = Bucket.Builder.create(this, env + "-logs")
                    .versioned(true)
                    .encryption(BucketEncryption.KMS_MANAGED)
                    .lifecycleRules(List.of(LifecycleRule.builder()
                            .enabled(true)
                            .expiration(Duration.days(365))
                            .build()))
                    .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                    .build();

            // IAM Role
            Role ec2Role = Role.Builder.create(this, env + "-ec2-role")
                    .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                    .managedPolicies(List.of(
                            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                    ))
                    .build();

            // Security Group
            SecurityGroup sg = SecurityGroup.Builder.create(this, env + "-sg")
                    .vpc(vpc)
                    .allowAllOutbound(true)
                    .build();
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP");
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS");

            // Auto Scaling Group
            IMachineImage ami = MachineImage.latestAmazonLinux2();
            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, env + "-asg")
                    .vpc(vpc)
                    .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                            InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                    .machineImage(ami)
                    .minCapacity(2)
                    .maxCapacity(6)
                    .role(ec2Role)
                    .securityGroup(sg)
                    .build();

            // Application Load Balancer
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

            // RDS Multi-AZ
            DatabaseInstance rds = DatabaseInstance.Builder.create(this, env + "-rds")
                    .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                            .version(PostgresEngineVersion.VER_15_4) // ✅ updated to supported version
                            .build()))
                    .vpc(vpc)
                    .allocatedStorage(20)
                    .multiAz(true)
                    .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                            InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
                    .storageEncrypted(true)
                    .credentials(Credentials.fromGeneratedSecret("dbadmin"))
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .deletionProtection(false)
                    .build();

            // CloudWatch CPU metric for ASG
            Metric cpuMetric = Metric.Builder.create()
                    .namespace("AWS/EC2")
                    .metricName("CPUUtilization")
                    .statistic("Average")
                    .period(Duration.minutes(5))
                    .dimensionsMap(Map.of(
                            "AutoScalingGroupName", asg.getAutoScalingGroupName()
                    ))
                    .build();

            Alarm cpuAlarm = Alarm.Builder.create(this, env + "-cpu-alarm")
                    .metric(cpuMetric)
                    .threshold(70)
                    .evaluationPeriods(2)
                    .alarmDescription("Alarm if CPU > 70% for 2 periods")
                    .build();

            Topic alarmTopic = new Topic(this, env + "-alarm-topic");
            cpuAlarm.addAlarmAction(new SnsAction(alarmTopic));

            // Route53 DNS — static HostedZoneAttributes (no lookup)
            IHostedZone zone = HostedZone.fromHostedZoneAttributes(this, env + "-zone",
                    HostedZoneAttributes.builder()
                            .hostedZoneId("ZFAKE123456")   // placeholder HostedZoneId
                            .zoneName("example.com")        // placeholder domain
                            .build());

            ARecord.Builder.create(this, env + "-dns")
                    .zone(zone)
                    .recordName("app." + zone.getZoneName())
                    .target(RecordTarget.fromAlias(new LoadBalancerTarget(alb)))
                    .ttl(Duration.minutes(1))
                    .build();
        }
    }
}
