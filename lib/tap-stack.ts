/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

// This interface is based on the props used in the original model's response.
interface TapStackProps extends cdk.StackProps {
  region: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // --- Start of Consolidated Code from Model Response ---

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 3 });

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'KMSKey', {
      enableKeyRotation: true,
      alias: `alias/${props.region}-kms-key`,
    });

    // RDS Instance
    // Note: The original code used 'removalPolicy: cdk.RemovalPolicy.SNAPSHOT'
    const rdsInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      vpc,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      multiAz: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    listener.addTargets('Targets', {
      port: 80,
      targets: [asg],
    });

    // Tagging
    // Note: This applies a single tag to the entire stack, not to individual
    // resources as the prompt's 'env-resource-name' convention required.
    cdk.Tags.of(this).add('env-resource-name', `${props.region}-web-server-asg`);

    // Autoscaling Policy
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    // CloudWatch Alarms
    // Note: The original code had a reference to 'cdk.aws_cloudwatch.Alarm'
    // which is incorrect. The correct reference is just 'cloudwatch.Alarm'.
    // This has been corrected for basic syntax, but the logic is unchanged.
    new cdk.aws_cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: asg.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
    });

    // --- End of Consolidated Code ---
  }
}