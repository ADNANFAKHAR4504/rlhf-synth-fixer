/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as aws_config from 'aws-cdk-lib/aws-config';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimaryRegion?: boolean;
  globalClusterId?: string;
  hostedZoneId?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props?.env,
        region: 'us-west-2', // Hardcode region as per PROMPT.md requirements
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // --- Tagging Strategy ---
    const tags = {
      Project: 'SecureCloudEnvironment',
      Environment: environmentSuffix,
    };
    for (const [key, value] of Object.entries(tags)) {
      cdk.Tags.of(this).add(key, value);
    }

    // --- VPC with Multi-AZ and Logging ---
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      maxAzs: 2,
      natGateways: 1, // For cost-effectiveness in non-prod environments
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-app-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private-db-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // --- VPC Flow Logs ---
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // --- Bastion Host for Secure Access ---
    const bastionSg = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc,
      description: 'Security group for bastion host',
    });
    // Restrict SSH access to a specific IP range for better security
    bastionSg.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH access from trusted IP range'
    );

    const bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
    });

    // --- S3 Bucket for Logs ---
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For easy cleanup in non-prod
    });

    // --- Application Load Balancer ---
    const albSg = new ec2.SecurityGroup(this, 'AlbSG', {
      vpc,
      description: 'Security group for ALB',
    });
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    alb.logAccessLogs(logBucket, 'alb-logs');

    // --- Application Tier (Auto Scaling Group) ---
    const appSg = new ec2.SecurityGroup(this, 'AppSG', {
      vpc,
      description: 'Security group for application instances',
    });
    appSg.addIngressRule(albSg, ec2.Port.tcp(80), 'Allow traffic from ALB');

    const appRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager access
      ],
    });

    const asg = new autoscaling.AutoScalingGroup(this, 'AppASG', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: appSg,
      role: appRole,
      minCapacity: 2,
      maxCapacity: 5,
    });
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    const listener = alb.addListener('HttpListener', { port: 80 });
    listener.addTargets('AppTargets', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    // --- Database Tier (RDS MySQL) ---
    const dbSg = new ec2.SecurityGroup(this, 'DbSG', {
      vpc,
      description: 'Security group for RDS database',
    });
    dbSg.addIngressRule(
      appSg,
      ec2.Port.tcp(3306),
      'Allow traffic from application instances'
    );

    const dbInstance = new rds.DatabaseInstance(this, 'MySQLDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // --- Monitoring (CloudWatch Alarms) ---
    new cloudwatch.Alarm(this, 'HighCpuAlarmASG', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 85,
      evaluationPeriods: 2,
      alarmDescription:
        'High CPU utilization on the application Auto Scaling Group.',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    // Note: Memory usage requires the CloudWatch agent installed on the EC2 instances.

    // --- Compliance (AWS Config Rules) ---
    new aws_config.ManagedRule(this, 'S3VersioningEnabledRule', {
      identifier:
        aws_config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
    });

    // AWS Config rule to ensure EC2 instances are not launched with public IPs
    new aws_config.ManagedRule(this, 'Ec2NoPublicIpRule', {
      identifier: aws_config.ManagedRuleIdentifiers.EC2_INSTANCE_NO_PUBLIC_IP,
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'ALB_DNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });
    new cdk.CfnOutput(this, 'BastionHostId', {
      value: bastionHost.instanceId,
      description: 'ID of the Bastion Host instance',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
      description: 'Endpoint of the MySQL database instance',
    });
  }
}
