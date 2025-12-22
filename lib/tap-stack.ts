import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Common tags for all resources
    const commonTags = {
      Department: 'Engineering',
      Project: 'CompleteEnvironment',
      Environment: 'Production',
      Owner: 'DevOps',
      CostCenter: 'IT-001',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Owner', commonTags.Owner);
    cdk.Tags.of(this).add('CostCenter', commonTags.CostCenter);

    // 1. KMS Key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3KmsKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // 2. S3 Logging Bucket
    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `complete-env-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // 3. Main S3 Bucket with KMS encryption and logging
    const mainBucket = new s3.Bucket(this, 'MainBucket', {
      bucketName: `complete-env-main-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // 4. VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'CompleteEnvironmentVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1, // One NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 5. Security Group for EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    // Allow SSH access from specific IP addresses (replace with your IPs)
    const allowedIPs = [
      '203.0.113.0/32', // Example IP - replace with your actual IP
      '198.51.100.0/32', // Example IP - replace with your actual IP
    ];

    allowedIPs.forEach((ip, index) => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(22),
        `SSH access from IP ${index + 1}`
      );
    });

    // 6. IAM Role for EC2 instance with S3 access
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instance with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant read/write access to the main S3 bucket
    mainBucket.grantReadWrite(ec2Role);
    s3KmsKey.grantEncryptDecrypt(ec2Role);

    // 7. EC2 Instance in private subnet
    const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      detailedMonitoring: true, // Enable detailed monitoring
      userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y aws-cli
echo "EC2 instance setup complete" > /var/log/setup.log
`),
    });

    // 8. Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false, // Restrict outbound traffic
    });

    // Allow inbound MySQL/Aurora access from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // Restrict outbound traffic - only allow necessary ports
    rdsSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS for AWS services'
    );

    // 9. RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // 10. RDS Instance
    const rdsInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      databaseName: 'completeenvdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'rds-credentials',
      }),
      backupRetention: cdk.Duration.days(7), // 7 days backup retention
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true for production
      monitoringInterval: cdk.Duration.seconds(60), // Enhanced monitoring (not Performance Insights)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // 11. CloudWatch Log Group for application logs
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/ec2/complete-environment',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 12. CloudWatch Alarms for monitoring
    // EC2 CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'EC2HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: ec2Instance.instanceId,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'EC2 instance high CPU utilization',
    });

    // RDS CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'RDSHighCPUAlarm', {
      metric: rdsInstance.metricCPUUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS instance high CPU utilization',
    });

    // RDS Database Connections Alarm
    new cloudwatch.Alarm(this, 'RDSHighConnectionsAlarm', {
      metric: rdsInstance.metricDatabaseConnections({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS instance high connection count',
    });

    // 13. Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Instance Endpoint',
    });

    new cdk.CfnOutput(this, 'MainBucketName', {
      value: mainBucket.bucketName,
      description: 'Main S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucketName,
      description: 'Logging S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID for S3 encryption',
    });
  }
}
