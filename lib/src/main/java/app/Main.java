package app;

import software.constructs.Construct;
import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.iam.*;

public class Main {
    public static void main(final String[] args) {
        App app = new App();

        new RegionalStack(app, "NovaStack-use1", StackProps.builder().env(Environment.builder()
                .region("us-east-1").build()).build(), "use1");

        new RegionalStack(app, "NovaStack-usw2", StackProps.builder().env(Environment.builder()
                .region("us-west-2").build()).build(), "usw2");

        app.synth();
    }
}

class RegionalStack extends Stack {
    public RegionalStack(final Construct scope, final String id, final StackProps props, final String envSuffix) {
        super(scope, id, props);

        // ✅ VPC
        Vpc vpc = Vpc.Builder.create(this, "Vpc-" + envSuffix)
                .maxAzs(2)
                .build();

        // ✅ S3 bucket for logs
        Bucket logBucket = Bucket.Builder.create(this, "Logs-" + envSuffix)
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // ✅ AutoScaling Group
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg-" + envSuffix)
                .vpc(vpc)
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                        InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .desiredCapacity(2)
                .minCapacity(1)
                .maxCapacity(3)
                .build();

        // ✅ Application Load Balancer
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb-" + envSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .build();

        ApplicationListener listener = alb.addListener("HttpListener", BaseApplicationListenerProps.builder()
                .port(80)
                .build());

        listener.addTargets("AlbTg-" + envSuffix, AddApplicationTargetsProps.builder()
                .port(80)
                .targets(java.util.List.of(asg))
                .build());

        // ✅ RDS instance
        DatabaseInstance rds = DatabaseInstance.Builder.create(this, "Rds-" + region)
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                    .version(PostgresEngineVersion.VER_14_7)   // ✅ replace 13.7 with a supported version
                    .build()))
                .instanceType(ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .vpc(vpc)
                .multiAz(true)
                .credentials(Credentials.fromGeneratedSecret("postgres"))
                .allocatedStorage(20)
                .storageEncrypted(true)
                .deletionProtection(false)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();


        // ✅ CPU Alarm
        Alarm cpuAlarm = Alarm.Builder.create(this, "CpuAlarm-" + envSuffix)
                .metric(Metric.Builder.create()
                        .namespace("AWS/EC2")
                        .metricName("CPUUtilization")
                        .dimensionsMap(java.util.Map.of("AutoScalingGroupName", asg.getAutoScalingGroupName()))
                        .statistic("Average")
                        .period(Duration.minutes(5))
                        .build())
                .threshold(80)
                .evaluationPeriods(2)
                .build();


        // ✅ Outputs
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .build();

        CfnOutput.Builder.create(this, "AlbDns")
                .value(alb.getLoadBalancerDnsName())
                .build();

        CfnOutput.Builder.create(this, "CpuAlarmName")
                .value(cpuAlarm.getAlarmName())
                .build();

        CfnOutput.Builder.create(this, "LogBucketName")
                .value(logBucket.getBucketName())
                .build();

        CfnOutput.Builder.create(this, "RdsEndpoint")
                .value(rds.getDbInstanceEndpointAddress())
                .build();
    }
}
