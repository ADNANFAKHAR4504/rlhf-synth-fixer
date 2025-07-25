/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// This interface is based on the props used in the original model's response.
interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  targetRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Helper function to apply consistent tagging per resource
    const applyResourceTags = (resource: Construct, resourceName: string) => {
      cdk.Tags.of(resource).add('env-resource-name', `${props.environmentSuffix}-${resourceName}`);
    };

    // --- Start of Enhanced Infrastructure Implementation ---

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 3 });
    applyResourceTags(vpc, 'vpc');

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'KMSKey', {
      enableKeyRotation: true,
      alias: `alias/${props.targetRegion}-kms-key`,
    });
    applyResourceTags(kmsKey, 'kms-key');

    // S3 Bucket with encryption at rest
    const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: `tap-bucket-${props.environmentSuffix}-${props.targetRegion}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      enforceSSL: true, // Enforce encryption in transit
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Per claude_prompt.txt - no retain policy
      autoDeleteObjects: true,
    });
    applyResourceTags(s3Bucket, 's3-bucket');

    // RDS Instance with encryption at rest
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
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Per claude_prompt.txt - no retain policy
    });
    applyResourceTags(rdsInstance, 'rds-database');

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
    applyResourceTags(asg, 'web-server-asg');

    // Application Load Balancer with HTTPS support
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });
    applyResourceTags(alb, 'application-load-balancer');

    // HTTP Listener (for this demo, we'll keep HTTP but add HTTPS structure for production)
    // In production, you would configure HTTPS with ACM certificate
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    httpListener.addTargets('Targets', {
      port: 80,
      targets: [asg],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200,404',
      },
    });

    // TODO: For production HTTPS implementation, uncomment and configure with valid ACM certificate:
    // const httpsListener = alb.addListener('HttpsListener', {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [elbv2.ListenerCertificate.fromCertificateManager(cert)],
    //   open: true,
    // });

    // Autoscaling Policy for intelligent scaling
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    // CloudWatch Alarms for monitoring
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'GroupTotalInstances',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
    });
    
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: `High instance count alarm for ASG in ${props.targetRegion}`,
    });
    applyResourceTags(cpuAlarm, 'high-cpu-alarm');

    // Outputs for integration testing and monitoring
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: `Application Load Balancer DNS for ${props.targetRegion}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: `RDS MySQL database endpoint for ${props.targetRegion}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: `S3 bucket with encryption for ${props.targetRegion}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: `VPC ID for ${props.targetRegion}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: props.targetRegion,
      description: 'Target region for this stack deployment',
    });

    // --- End of Enhanced Infrastructure Implementation ---
  }
}